import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DegreeLevel, DiplomaStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../crypto/crypto.service';
import { buildDiplomaSigningPayload } from '../diplomas/diploma-signing.js';
import { BulkVerifyDiplomasDto } from './dto/bulk-verify-diplomas.dto';
import type {
  BulkVerifyDiplomaShortDto,
  BulkVerifyDiplomaSuccessDto,
} from './dto/bulk-verify-diploma-response.dto';

export type BulkVerifyDiplomaItem =
  | BulkVerifyDiplomaSuccessDto
  | BulkVerifyDiplomaShortDto;

function degreeLevelToQualification(level: DegreeLevel): string {
  switch (level) {
    case DegreeLevel.BACHELOR:
      return 'Бакалавр';
    case DegreeLevel.MAGISTRACY:
      return 'Магистр';
    case DegreeLevel.SPECIALIST:
      return 'Специалист';
    case DegreeLevel.DOCTORATE:
      return 'Доктор наук';
    default:
      return level;
  }
}

@Injectable()
export class PublicApiServiseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cryptoService: CryptoService,
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

  async verifyBatch(
    dto: BulkVerifyDiplomasDto,
  ): Promise<BulkVerifyDiplomaItem[]> {
    const masterSymmetricKey = this.getDiplomaSymmetricKey();
    const numbers = dto.diplomaNumbers;

    const seenHashes = new Set<string>();
    const uniqueHashes: string[] = [];
    for (const num of numbers) {
      const h = this.cryptoService.hash(num);
      if (!seenHashes.has(h)) {
        seenHashes.add(h);
        uniqueHashes.push(h);
      }
    }

    const rows = await this.prisma.diploma.findMany({
      where: { registrationNumberHash: { in: uniqueHashes } },
      include: { university: true },
    });

    const hashToDiploma = new Map(
      rows.map((d) => [d.registrationNumberHash, d] as const),
    );

    const results: BulkVerifyDiplomaItem[] = [];

    for (const diplomaNumber of numbers) {
      const hash = this.cryptoService.hash(diplomaNumber);
      const diploma = hashToDiploma.get(hash);

      if (!diploma) {
        results.push({
          diplomaNumber,
          valid: false,
          reason: 'NOT_FOUND',
        });
        continue;
      }

      const short = (): BulkVerifyDiplomaShortDto => ({
        diplomaNumber,
        valid: false,
        status: diploma.status,
        reason: 'INVALID_OR_REVOKED',
      });

      if (!diploma.signature?.trim()) {
        results.push(short());
        continue;
      }
      const pub = diploma.university.publicKey;
      if (!pub?.trim()) {
        results.push(short());
        continue;
      }

      const storedUniversitySymmetricKey =
        diploma.university.encryptedSymmetricKey;
      if (!storedUniversitySymmetricKey?.trim()) {
        results.push(short());
        continue;
      }

      let universitySymmetricKey: string;
      try {
        const trimmed = storedUniversitySymmetricKey.trim();
        if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
          universitySymmetricKey = trimmed;
        } else {
          universitySymmetricKey = this.cryptoService
            .decryptSymmetric(trimmed, masterSymmetricKey)
            .trim();
        }
      } catch {
        results.push(short());
        continue;
      }

      if (!/^[0-9a-fA-F]{64}$/.test(universitySymmetricKey)) {
        results.push(short());
        continue;
      }

      let fullNameAuthor: string;
      let registrationNumber: string;
      try {
        fullNameAuthor = this.cryptoService.decryptSymmetric(
          diploma.fullNameAuthorEncrypted,
          universitySymmetricKey,
        );
        registrationNumber = this.cryptoService.decryptSymmetric(
          diploma.registrationNumberEncrypted,
          universitySymmetricKey,
        );
      } catch {
        results.push(short());
        continue;
      }

      const payload = buildDiplomaSigningPayload({
        fullNameAuthor,
        registrationNumber,
        universityId: diploma.universityId,
        issuedAtIso: diploma.issuedAt.toISOString(),
      });

      const signatureOk = this.cryptoService.verify(
        payload,
        diploma.signature,
        pub,
      );

      if (!signatureOk || diploma.status !== DiplomaStatus.VALID) {
        results.push(short());
        continue;
      }

      const universityName =
        diploma.university.shortName?.trim() || diploma.university.name;

      results.push({
        valid: true,
        status: 'VALID',
        fullName: fullNameAuthor,
        university: universityName,
        qualification: degreeLevelToQualification(diploma.degreeLevel),
        issuedAt: diploma.issuedAt.toISOString().slice(0, 10),
      });
    }

    return results;
  }
}
