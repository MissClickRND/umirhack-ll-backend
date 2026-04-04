import {
  Inject,
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from '@nestjs/cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDiplomaBatchDto } from './dto/create-diplomas-batch.dto';
import { CreateQrTokenDto } from './dto/create-qr-token.dto';
import { CryptoService } from '../crypto/crypto.service';
import { DiplomaStatus, Prisma } from '@prisma/client';
import { UpdateDiplomaStatusDto } from './dto/update-diploma-status.dto';
import * as crypto from 'crypto';
import { buildDiplomaSigningPayload } from './diploma-signing.js';
import { DiplomaCacheBusterService } from './diploma-cache-buster.service';

@Injectable()
export class DiplomasService {
  private key: string;
  private readonly cacheTtlMs: number;

  constructor(
    private prisma: PrismaService,
    private readonly cryptoService: CryptoService,
    private readonly config: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly diplomaCache: DiplomaCacheBusterService,
  ) {
    this.key = this.cryptoService.generateSymmetricKey();
    this.cacheTtlMs = this.config.get<number>('DIPLOMA_CACHE_TTL_MS', 120_000);
  }

  private getMasterSymmetricKey(): string {
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

  private resolveUniversitySymmetricKey(stored: string): string {
    const direct = stored?.trim();

    // Backward compatibility: some records may still store plain 64-hex key.
    if (direct && /^[0-9a-fA-F]{64}$/.test(direct)) {
      return direct;
    }

    const master = this.getMasterSymmetricKey();

    let decrypted: string;
    try {
      decrypted = this.cryptoService.decryptSymmetric(stored, master).trim();
    } catch {
      throw new BadRequestException('University symmetric key is invalid');
    }

    if (!/^[0-9a-fA-F]{64}$/.test(decrypted)) {
      throw new BadRequestException('University symmetric key is invalid');
    }

    return decrypted;
  }

  private resolveUniversityPrivateKey(stored: string): string {
    const direct = stored?.trim();

    // Backward compatibility: existing rows may keep raw PEM.
    if (direct?.includes('BEGIN PRIVATE KEY')) {
      return direct;
    }

    const master = this.getMasterSymmetricKey();

    try {
      return this.cryptoService.decryptSymmetric(stored, master).trim();
    } catch {
      throw new BadRequestException('University private key is invalid');
    }
  }

  private toHumanDiploma(
    diploma: Prisma.DiplomaGetPayload<{
      include: {
        university: true;
      };
    }> & {
      tokens?: Prisma.DiplomaTokenUncheckedCreateInput[];
    },
  ) {
    if (!diploma.university.encryptedSymmetricKey) {
      throw new BadRequestException('University has no symmetric key');
    }

    const symmetricKey = this.resolveUniversitySymmetricKey(
      diploma.university.encryptedSymmetricKey,
    );

    const fullNameAuthor = this.cryptoService.decryptSymmetric(
      diploma.fullNameAuthorEncrypted,
      symmetricKey,
    );

    const registrationNumber = this.cryptoService.decryptSymmetric(
      diploma.registrationNumberEncrypted,
      symmetricKey,
    );

    const tokens = Array.isArray(diploma.tokens) ? diploma.tokens : null;

    return {
      id: diploma.id,
      fullNameAuthor,
      registrationNumber,
      userId: diploma.userId,
      universityId: diploma.universityId,
      issuedAt: diploma.issuedAt,
      specialty: diploma.specialty,
      degreeLevel: diploma.degreeLevel,
      status: diploma.status,
      createdAt: diploma.createdAt,
      updatedAt: diploma.updatedAt,
      university: {
        id: diploma.university.id,
        name: diploma.university.name,
        shortName: diploma.university.shortName,
      },
      ...(tokens
        ? {
            tokens: tokens.map((t) => ({
              id: t.id,
              diplomaId: t.diplomaId,
              expiresAt: t.expiresAt,
              revokedAt: t.revokedAt,
              isOneTime: t.isOneTime,
              lastUsedAt: t.lastUsedAt,
              createdAt: t.createdAt,
            })),
          }
        : {}),
    };
  }

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

        const symmetricKey = this.resolveUniversitySymmetricKey(
          university.encryptedSymmetricKey,
        );
        const privateKey = this.resolveUniversityPrivateKey(
          university.encryptedPrivateKey,
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
          status: DiplomaStatus.VALID,

          signature,
        };
      });

    const result = await this.prisma.diploma.createMany({
      data: diplomasToCreate,
    });

    this.diplomaCache.bumpUniversities(universityIds);
    const userIds = [
      ...new Set(
        normalizedDiplomas
          .map((d) => d.userId)
          .filter((id): id is number => id != null),
      ),
    ];
    this.diplomaCache.bumpUsers(userIds);

    return result;
  }

  async findByUniversity(universityId: number, requesterUserId?: number) {
    let targetUniversityId = universityId;

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

    const v = this.diplomaCache.universityListVersion(targetUniversityId);
    const cacheKey = `diploma:list:uni:${targetUniversityId}:v${v}`;

    return this.cache.wrap(
      cacheKey,
      async () => {
        const diplomas = await this.prisma.diploma.findMany({
          where: { universityId: targetUniversityId },
          include: {
            university: true,
          },
        });

        return diplomas.map((d) => this.toHumanDiploma(d));
      },
      this.cacheTtlMs,
    );
  }

  async findByUser(userId: number) {
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new BadRequestException('Invalid userId');
    }

    const v = this.diplomaCache.userListVersion(userId);
    const cacheKey = `diploma:list:user:${userId}:v${v}`;

    return this.cache.wrap(
      cacheKey,
      async () => {
        const diplomas = await this.prisma.diploma.findMany({
          where: {
            userId,
          },
          include: {
            university: true,
          },
        });

        return diplomas.map((d) => this.toHumanDiploma(d));
      },
      this.cacheTtlMs,
    );
  }

  async findById(id: number) {
    const cacheKey = `diploma:byId:${id}`;

    return this.cache.wrap(
      cacheKey,
      async () => {
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

        return this.toHumanDiploma(diploma);
      },
      this.cacheTtlMs,
    );
  }

  async update(id: number, dto: UpdateDiplomaStatusDto) {
    const diploma = await this.prisma.diploma.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        universityId: true,
        registrationNumberHash: true,
      },
    });

    if (!diploma) {
      throw new NotFoundException('Diploma not found');
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

    await this.cache.del(`diploma:byId:${id}`);
    await this.cache.del(`diploma:search:${diploma.registrationNumberHash}`);
    this.diplomaCache.bumpUniversityList(diploma.universityId);
    if (diploma.userId != null) {
      this.diplomaCache.bumpUserList(diploma.userId);
    }

    return this.toHumanDiploma(updated);
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

    await this.cache.del(`diploma:byId:${diplomaId}`);

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

    const symmetricKey = this.resolveUniversitySymmetricKey(
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

    await this.cache.del(`diploma:byId:${diploma.id}`);

    return this.toHumanDiploma(diploma);
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

    await this.cache.del(`diploma:byId:${diplomaId}`);

    return { message: 'Token revoked' };
  }

  async searchByNumber(number: string) {
    const hash = this.cryptoService.hash(number);
    const cacheKey = `diploma:search:${hash}`;

    type HumanDiploma = ReturnType<DiplomasService['toHumanDiploma']>;
    const cached = await this.cache.get<HumanDiploma>(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

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

    const human = this.toHumanDiploma(diploma);
    await this.cache.set(cacheKey, human, this.cacheTtlMs);
    return human;
  }
}