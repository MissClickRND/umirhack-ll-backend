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

@Injectable()
export class DiplomasService {
  private key: string;

  constructor(
    private prisma: PrismaService,
    private readonly cryptoService: CryptoService,
  ) {
    this.key = this.cryptoService.generateSymmetricKey();
  }

  async createBatch(dto: CreateDiplomaBatchDto) {
    const universityIds = [...new Set(dto.diplomas.map((d) => d.universityId))];

    const universities = await this.prisma.university.findMany({
      where: { id: { in: universityIds } },
    });

    const universityMap = new Map(universities.map((u) => [u.id, u]));

    if (universityMap.size !== universityIds.length) {
      throw new BadRequestException('Some universities not found');
    }

    const diplomasToCreate: Prisma.DiplomaCreateManyInput[] = dto.diplomas.map(
      (d) => {
        const university = universityMap.get(d.universityId)!;

        if (!university.encryptedSymmetricKey) {
          throw new BadRequestException('University has no symmetric key');
        }

        if (!university.encryptedPrivateKey) {
          throw new BadRequestException('University has no private key');
        }

        const symmetricKey = university.encryptedSymmetricKey;
        const privateKey = university.encryptedPrivateKey;

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

        const signature = this.cryptoService.sign(payload, privateKey);

        return {
          fullNameAuthorEncrypted: fullNameEncrypted,
          registrationNumberEncrypted,
          registrationNumberHash,

          userId: d.userId,
          universityId: d.universityId,
          issuedAt: d.issuedAt,
          specialty: d.specialty,
          degreeLevel: d.degreeLevel,
          status: DiplomaStatus.ISSUED,

          signature,
        };
      },
    );

    return this.prisma.diploma.createMany({
      data: diplomasToCreate,
    });
  }

  async findByUniversity(universityId: number) {
    return this.prisma.diploma.findMany({
      where: { universityId },
      include: {
        university: true,
      },
    });
  }

  async findByUser(userId: number) {
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new BadRequestException('Invalid userId');
    }

    return this.prisma.diploma.findMany({
      where: {
        userId,
      },
      include: {
        university: true,
      },
    });
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

    return diploma;
  }

  async update(id: number, dto: UpdateDiplomaStatusDto) {
    const diploma = await this.prisma.diploma.findUnique({
      where: { id },
    });

    if (!diploma) {
      throw new NotFoundException('Diploma not found');
    }

    return this.prisma.diploma.update({
      where: { id },
      data: {
        status: dto.status,
      },
    });
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

    await this.prisma.diplomaToken.update({
      where: { id: record.id },
      data: {
        lastUsedAt: now,
      },
    });

    return record.diploma;
  }

  async revokeQrToken(diplomaId: number) {
    const token = await this.prisma.diplomaToken.findFirst({
      where: {
        diplomaId,
        revokedAt: null, // находим активные
      },
      orderBy: {
        createdAt: 'desc', // берём последний
      },
    });

    if (!token) {
      throw new NotFoundException('Active token not found');
    }

    await this.prisma.diplomaToken.update({
      where: { id: token.id },
      data: {
        revokedAt: new Date(),
      },
    });

    return { message: 'Token revoked' };
  }

  async searchByNumber(number: string) {
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
      throw new NotFoundException('Diploma not found');
    }

    return diploma;
  }
}
