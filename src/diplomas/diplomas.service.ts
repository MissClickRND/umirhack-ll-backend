import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDiplomaBatchDto } from './dto/create-diplomas-batch.dto';
import { CreateQrTokenDto } from './dto/create-qr-token.dto';
import { CryptoService } from '../crypto/crypto.service';
import { DiplomaStatus, Prisma } from '@prisma/client';
import { UpdateDiplomaStatusDto } from './dto/update-diploma-status.dto';
import * as crypto from 'crypto';
import { buildDiplomaSigningPayload } from './diploma-signing.js';
import { DiplomaCryptoResolverService } from './diploma-crypto-resolver.service';
import { DiplomaHumanMapper } from './diploma-human.mapper';
import type { Role } from 'src/auth/types/auth-user.type';

@Injectable()
export class DiplomasService {
  private readonly attempts = new Map<
    string,
    { count: number; blockedUntil?: number }
  >();

  constructor(
    private readonly prisma: PrismaService,
    private readonly cryptoService: CryptoService,
    private readonly resolver: DiplomaCryptoResolverService,
    private readonly mapper: DiplomaHumanMapper,
  ) {}

  async createBatch(dto: CreateDiplomaBatchDto, requesterUserId?: number) {
    let requesterUniversityId: number | null = null;

    if (requesterUserId) {
      const requester = await this.prisma.user.findUnique({
        where: { id: requesterUserId },
        select: { id: true, role: true, organizationId: true },
      });

      if (!requester || requester.role !== 'UNIVERSITY') {
        throw new ForbiddenException('Only university can create diplomas');
      }

      if (!requester.organizationId) {
        throw new BadRequestException(
          'University account is not linked to organization',
        );
      }

      requesterUniversityId = requester.organizationId;
    }

    const normalizedDiplomas = requesterUniversityId
      ? dto.diplomas.map((d) => ({
          ...d,
          universityId: requesterUniversityId!,
        }))
      : dto.diplomas;

    const universityIds = [
      ...new Set(normalizedDiplomas.map((d) => d.universityId)),
    ];

    const universities = await this.prisma.university.findMany({
      where: { id: { in: universityIds } },
    });

    const universityMap = new Map(universities.map((u) => [u.id, u]));

    if (universityMap.size !== universityIds.length) {
      throw new BadRequestException('Some universities not found');
    }

    const diplomasToCreate: Prisma.DiplomaCreateManyInput[] =
      normalizedDiplomas.map((d) => {
        const university = universityMap.get(d.universityId)!;

        if (!university.encryptedSymmetricKey) {
          throw new BadRequestException('University has no symmetric key');
        }

        if (!university.encryptedPrivateKey) {
          throw new BadRequestException('University has no private key');
        }

        const symmetricKey = this.resolver.resolveUniversitySymmetricKey(
          university.encryptedSymmetricKey,
        );

        const fullNameEncrypted = this.cryptoService.encryptSymmetric(
          d.fullNameAuthor,
          symmetricKey,
        );

        const registrationNumberEncrypted = this.cryptoService.encryptSymmetric(
          d.registrationNumber,
          symmetricKey,
        );

        const registrationNumberHash = this.cryptoService.hash(
          d.registrationNumber,
        );

        const payload = buildDiplomaSigningPayload({
          fullNameAuthor: d.fullNameAuthor,
          registrationNumber: d.registrationNumber,
          issuedAtIso: d.issuedAt.toISOString(),
          universityId: d.universityId,
        });

        const signature = this.cryptoService.sign(
          payload,
          this.resolver.resolveUniversityPrivateKey(
            university.encryptedPrivateKey,
          ),
        );

        return {
          fullNameAuthorEncrypted: fullNameEncrypted,
          registrationNumberEncrypted,
          registrationNumberHash,

          userId: d.userId,
          universityId: d.universityId,
          issuedAt: d.issuedAt,
          specialty: d.specialty,
          degreeLevel: d.degreeLevel,
          status: DiplomaStatus.VALID,

          signature,
        };
      });

    return this.prisma.diploma.createMany({
      data: diplomasToCreate,
    });
  }

  async findByUniversity(
    universityId: number,
    requesterUserId?: number,
    page?: number,
    limit?: number,
  ) {
    let targetUniversityId = universityId;

    const safePage = !page || page < 1 ? 1 : page;
    const safeLimit = !limit || limit < 1 || limit > 50 ? 10 : limit;

    if (requesterUserId) {
      const requester = await this.prisma.user.findUnique({
        where: { id: requesterUserId },
        select: { id: true, role: true, organizationId: true },
      });

      if (!requester) {
        throw new ForbiddenException('No user');
      }

      if (requester.role === 'UNIVERSITY') {
        if (!requester.organizationId) {
          throw new BadRequestException(
            'University account is not linked to organization',
          );
        }

        if (requester.organizationId !== universityId) {
          throw new ForbiddenException(
            'University can request diplomas only for its organizationId',
          );
        }

        targetUniversityId = requester.organizationId;
      }
    }

    const universityExists = await this.prisma.university.findUnique({
      where: { id: targetUniversityId },
      select: { id: true },
    });

    if (!universityExists) {
      throw new NotFoundException('University not found');
    }

    const skip = (safePage - 1) * safeLimit;

    const total = await this.prisma.diploma.count({
      where: { universityId: targetUniversityId },
    });

    const diplomas = await this.prisma.diploma.findMany({
      where: { universityId: targetUniversityId },
      include: {
        university: true,
      },
      skip,
      take: safeLimit,
      orderBy: { createdAt: 'desc' },
    });

    const data = diplomas.map((d) => this.mapper.toHumanDiploma(d));

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

  async findByUser(userId: number, requesterUserId: number) {
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new BadRequestException('Invalid userId');
    }

    if (requesterUserId !== userId) {
      throw new ForbiddenException('Forbidden');
    }

    const diplomas = await this.prisma.diploma.findMany({
      where: {
        userId,
      },
      include: {
        university: true,
      },
    });

    return diplomas.map((d) => this.mapper.toHumanDiploma(d));
  }

  async findById(id: number) {
    const diploma = await this.prisma.diploma.findUnique({
      where: { id },
      include: {
        university: true,
        tokens: true,
      },
    });

    if (!diploma) {
      throw new NotFoundException('Diploma not found');
    }

    return this.mapper.toHumanDiploma(diploma);
  }

  async update(
    id: number,
    dto: UpdateDiplomaStatusDto,
    requesterUserId: number,
    requesterRole: Role,
  ) {
    const diploma = await this.prisma.diploma.findUnique({
      where: { id },
      select: {
        id: true,
        universityId: true,
      },
    });

    if (!diploma) {
      throw new NotFoundException('Diploma not found');
    }

    if (requesterRole === 'UNIVERSITY') {
      const requester = await this.prisma.user.findUnique({
        where: { id: requesterUserId },
        select: { role: true, organizationId: true },
      });

      if (
        !requester ||
        requester.role !== 'UNIVERSITY' ||
        !requester.organizationId
      ) {
        throw new ForbiddenException('Forbidden');
      }

      if (requester.organizationId !== diploma.universityId) {
        throw new ForbiddenException('University can update only own diplomas');
      }
    }

    await this.prisma.diploma.update({
      where: { id },
      data: {
        status: dto.status,
      },
    });

    const updated = await this.prisma.diploma.findUnique({
      where: { id },
      include: {
        university: true,
      },
    });

    if (!updated) {
      throw new NotFoundException('Diploma not found');
    }

    return this.mapper.toHumanDiploma(updated);
  }

  async createQrToken(
    diplomaId: number,
    dto: CreateQrTokenDto,
    requesterUserId: number,
  ) {
    const diploma = await this.prisma.diploma.findUnique({
      where: { id: diplomaId },
      select: { id: true, userId: true },
    });

    if (!diploma) {
      throw new NotFoundException('Diploma not found');
    }

    if (diploma.userId !== requesterUserId) {
      throw new ForbiddenException(
        'You can create token only for your diploma',
      );
    }

    const token = crypto.randomUUID();
    const tokenHash = this.cryptoService.hash(token);

    const now = new Date();

    let expiresAt: Date | null = null;
    let isOneTime = false;

    switch (dto.type) {
      case 'DAYS_7':
        expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;

      case 'DAYS_30':
        expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        break;

      case 'INFINITE':
        expiresAt = null;
        break;

      case 'ONETIME':
        isOneTime = true;
        expiresAt = null;
        break;
    }

    await this.prisma.diplomaToken.create({
      data: {
        diplomaId,
        tokenHash,
        encryptedToken: this.resolver.encryptRuntimeToken(token),
        expiresAt,
        isOneTime,
      },
    });

    return { token };
  }

  async findByQrToken(token: string) {
    const tokenHash = this.cryptoService.hash(token);

    const record = await this.prisma.diplomaToken.findUnique({
      where: { tokenHash },
      include: {
        diploma: {
          include: {
            university: true,
          },
        },
      },
    });

    if (!record) {
      throw new NotFoundException('Invalid token');
    }

    const now = new Date();

    if (record.expiresAt && record.expiresAt < now) {
      throw new NotFoundException('Token expired');
    }

    if (record.revokedAt) {
      throw new NotFoundException('Token revoked');
    }

    if (record.isOneTime && record.lastUsedAt) {
      throw new NotFoundException('Token already used');
    }

    const diploma = record.diploma;
    const university = diploma.university;

    if (!university.publicKey) {
      throw new BadRequestException('University has no public key');
    }

    if (!university.encryptedSymmetricKey) {
      throw new BadRequestException('University has no symmetric key');
    }

    if (!diploma.signature) {
      throw new BadRequestException('Diploma has no signature');
    }

    const symmetricKey = this.resolver.resolveUniversitySymmetricKey(
      university.encryptedSymmetricKey,
    );

    const fullName = this.cryptoService.decryptSymmetric(
      diploma.fullNameAuthorEncrypted,
      symmetricKey,
    );

    const registrationNumber = this.cryptoService.decryptSymmetric(
      diploma.registrationNumberEncrypted,
      symmetricKey,
    );

    const payload = buildDiplomaSigningPayload({
      fullNameAuthor: fullName,
      registrationNumber,
      issuedAtIso: diploma.issuedAt.toISOString(),
      universityId: diploma.universityId,
    });

    const isValid = this.cryptoService.verify(
      payload,
      diploma.signature,
      university.publicKey,
    );

    if (!isValid) {
      throw new ForbiddenException('Diploma signature is invalid');
    }

    // Фиксируем использование токена.
    await this.prisma.diplomaToken.update({
      where: { id: record.id },
      data: {
        lastUsedAt: now,
      },
    });

    return this.mapper.toHumanDiploma(diploma);
  }

  async revokeQrTokenById(tokenId: number, requesterUserId: number) {
    const token = await this.prisma.diplomaToken.findUnique({
      where: { id: tokenId },
      include: {
        diploma: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!token) {
      throw new NotFoundException('Token not found');
    }

    if (token.diploma.userId !== requesterUserId) {
      throw new ForbiddenException('Forbidden');
    }

    if (token.revokedAt) {
      throw new BadRequestException('Token already revoked');
    }

    await this.prisma.diplomaToken.update({
      where: { id: tokenId },
      data: {
        revokedAt: new Date(),
      },
    });

    return { message: 'Token revoked' };
  }

  async searchByNumber(number: string, ip: string) {
    const record = this.attempts.get(ip) || { count: 0 };

    if (record.blockedUntil && record.blockedUntil > Date.now()) {
      throw new ForbiddenException('Too many attempts. Try later');
    }

    const hash = this.cryptoService.hash(number);

    const diploma = await this.prisma.diploma.findFirst({
      where: {
        registrationNumberHash: hash,
      },
      include: {
        university: true,
      },
    });

    if (!diploma) {
      record.count += 1;

      if (record.count >= 5) {
        record.blockedUntil = Date.now() + 60_000;
        record.count = 0;

        this.attempts.set(ip, record);

        throw new ForbiddenException('Too many attempts. Blocked for 1 minute');
      }

      this.attempts.set(ip, record);

      throw new NotFoundException('Diploma not found');
    }

    this.attempts.delete(ip);

    return this.mapper.toHumanDiploma(diploma);
  }

  async getUserTokens(userId: number, requesterUserId: number) {
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new BadRequestException('Invalid userId');
    }

    if (requesterUserId !== userId) {
      throw new ForbiddenException('Forbidden');
    }

    const diplomas = await this.prisma.diploma.findMany({
      where: {
        userId,
      },
      include: {
        university: true,
        tokens: {
          where: {
            revokedAt: null,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return diplomas.flatMap((d) => {
      const human = this.mapper.toHumanDiploma(d);
      const tokens = Array.isArray(human.tokens) ? human.tokens : [];
      const tokenById = new Map(
        d.tokens.map((t) => [
          t.id,
          (t as { encryptedToken?: string | null }).encryptedToken ?? null,
        ]),
      );

      const diplomaView = {
        id: human.id,
        fullNameAuthor: human.fullNameAuthor,
        registrationNumber: human.registrationNumber,
        userId: human.userId,
        universityId: human.universityId,
        issuedAt: human.issuedAt,
        specialty: human.specialty,
        degreeLevel: human.degreeLevel,
        status: human.status,
        createdAt: human.createdAt,
        updatedAt: human.updatedAt,
        university: human.university,
      };

      return tokens.map((token) => {
        const encryptedToken = tokenById.get(token.id);
        const plainToken = encryptedToken
          ? this.resolver.decryptRuntimeToken(encryptedToken)
          : null;

        return {
          token: plainToken,
          tokenMeta: token,
          diploma: diplomaView,
        };
      });
    });
  }
}
