import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../crypto/crypto.service';
import type { Role } from 'src/auth/types/auth-user.type';
import { Role as PrismaRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly config: ConfigService,
  ) {}

  private getDiplomaSymmetricKey(): string {
    const key = this.config.get<string>('DIPLOMA_SYMMETRIC_KEY', {
      infer: true,
    });
    if (!key || !/^[0-9a-fA-F]{64}$/.test(key)) {
      throw new InternalServerErrorException(
        'DIPLOMA_SYMMETRIC_KEY must be 64 hex characters (256-bit)',
      );
    }
    return key;
  }

  async getAll(page?: number, limit?: number) {
    const safePage = !page || page < 1 ? 1 : page;
    const safeLimit = !limit || limit < 1 || limit > 50 ? 10 : limit;
    const skip = (safePage - 1) * safeLimit;

    const total = await this.prisma.user.count();

    const data = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
      skip,
      take: safeLimit,
      orderBy: { createdAt: 'desc' },
    });

    return {
      data,
      meta: {
        page: safePage,
        limit: safeLimit,
        itemsOnPage: data.length,
        total,
        totalPages: Math.max(1, Math.ceil(total / safeLimit)),
      },
    };
  }

  getAllUniversities() {
    return this.prisma.university.findMany({
      select: {
        id: true,
        name: true,
        shortName: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async updateRole(params: { userId: number; role: Role }) {
    const { userId, role } = params;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true },
    });

    if (!user) throw new BadRequestException('User not found');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        role,
        hashedRefreshToken: null,
        tokenVersion: { increment: 1 },
      },
      select: { id: true, email: true, role: true },
    });

    return { before: user, after: updated };
  }

  async getVerificationRequests() {
    const rows = await this.prisma.user.findMany({
      where: { role: PrismaRole.NEED_VERIFICATION },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        pendingUniversityName: true,
        pendingUniversityShortName: true,
        organization: {
          select: {
            id: true,
            name: true,
            shortName: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(
      ({
        organization,
        pendingUniversityName,
        pendingUniversityShortName,
        ...rest
      }) => {
        let university:
          | { id: number; name: string; shortName: string | null }
          | { id: null; name: string; shortName: string | null }
          | null = organization;
        if (!university) {
          const pn = pendingUniversityName?.trim();
          const ps = pendingUniversityShortName?.trim();
          if (pn && ps) {
            university = { id: null, name: pn, shortName: ps };
          }
        }
        return { ...rest, university };
      },
    );
  }

  private async ensureUniversityCryptoFields(universityId: number) {
    const u = await this.prisma.university.findUnique({
      where: { id: universityId },
    });
    if (!u) return;

    const master = this.getDiplomaSymmetricKey();
    const data: Prisma.UniversityUpdateInput = {};

    if (!u.publicKey?.trim() || !u.encryptedPrivateKey?.trim()) {
      const { publicKey, privateKey } = this.crypto.generateKeyPair();
      data.publicKey = publicKey;
      data.encryptedPrivateKey = privateKey;
    }
    if (!u.encryptedSymmetricKey?.trim()) {
      const symm = this.crypto.generateSymmetricKey();
      data.encryptedSymmetricKey = this.crypto.encryptSymmetric(symm, master);
    }

    if (Object.keys(data).length > 0) {
      await this.prisma.university.update({
        where: { id: universityId },
        data,
      });
    }
  }

  async reviewVerificationRequest(params: {
    userId: number;
    action: 'approve' | 'reject';
  }) {
    const { userId, action } = params;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        organizationId: true,
        pendingUniversityName: true,
        pendingUniversityShortName: true,
      },
    });

    if (!user) throw new BadRequestException('User not found');
    if (user.role === PrismaRole.ADMIN) {
      throw new ForbiddenException('Cannot process admin user');
    }
    if (user.role !== PrismaRole.NEED_VERIFICATION) {
      throw new BadRequestException('User does not require verification');
    }

    const before = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    if (action === 'reject') {
      const after = await this.prisma.user.update({
        where: { id: userId },
        data: {
          pendingUniversityName: null,
          pendingUniversityShortName: null,
        },
        select: { id: true, email: true, role: true },
      });
      return { before, after };
    }

    if (user.organizationId) {
      await this.ensureUniversityCryptoFields(user.organizationId);
      const after = await this.prisma.user.update({
        where: { id: userId },
        data: {
          role: PrismaRole.UNIVERSITY,
          hashedRefreshToken: null,
          tokenVersion: { increment: 1 },
          pendingUniversityName: null,
          pendingUniversityShortName: null,
        },
        select: { id: true, email: true, role: true },
      });
      return { before, after };
    }

    const name = user.pendingUniversityName?.trim();
    const shortName = user.pendingUniversityShortName?.trim();
    if (!name || !shortName) {
      throw new BadRequestException(
        'Заявка не содержит названия вуза; пользователь должен указать name и short_name при регистрации',
      );
    }

    const existing = await this.prisma.university.findUnique({
      where: { name },
    });
    if (existing) {
      throw new ConflictException('Вуз с таким названием уже зарегистрирован');
    }

    const master = this.getDiplomaSymmetricKey();
    const { publicKey, privateKey } = this.crypto.generateKeyPair();
    const symm = this.crypto.generateSymmetricKey();
    const encryptedSymmetricKey = this.crypto.encryptSymmetric(symm, master);

    try {
      const after = await this.prisma.$transaction(async (tx) => {
        const university = await tx.university.create({
          data: {
            name,
            shortName,
          },
          select: { id: true },
        });

        await tx.university.update({
          where: { id: university.id },
          data: {
            publicKey,
            encryptedPrivateKey: privateKey,
            encryptedSymmetricKey,
          },
        });

        return tx.user.update({
          where: { id: userId },
          data: {
            organizationId: university.id,
            role: PrismaRole.UNIVERSITY,
            hashedRefreshToken: null,
            tokenVersion: { increment: 1 },
            pendingUniversityName: null,
            pendingUniversityShortName: null,
          },
          select: { id: true, email: true, role: true },
        });
      });
      return { before, after };
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException(
          'Вуз с таким названием уже зарегистрирован',
        );
      }
      throw e;
    }
  }

  async attachDiplomaToStudent(diplomaId: number, userId: number) {
    const student = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });
    if (!student) throw new BadRequestException('Student not found');
    if (student.role !== PrismaRole.STUDENT) {
      throw new BadRequestException('Only student can attach diploma');
    }

    const diploma = await this.prisma.diploma.findUnique({
      where: { id: diplomaId },
      select: { id: true, userId: true },
    });
    if (!diploma) throw new BadRequestException('Diploma not found');

    return this.prisma.diploma.update({
      where: { id: diplomaId },
      data: { userId: student.id },
      select: {
        id: true,
        userId: true,
        universityId: true,
        status: true,
      },
    });
  }
}
