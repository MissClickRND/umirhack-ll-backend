import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, type DiplomaToken } from '@prisma/client';
import { CryptoService } from '../crypto/crypto.service';
import { DiplomaCryptoResolverService } from './diploma-crypto-resolver.service';

@Injectable()
export class DiplomaHumanMapper {
  constructor(
    private readonly cryptoService: CryptoService,
    private readonly resolver: DiplomaCryptoResolverService,
  ) {}

  toHumanDiploma(
    diploma: Prisma.DiplomaGetPayload<{
      include: {
        university: true;
      };
    }> & {
      tokens?: DiplomaToken[];
    },
  ) {
    if (!diploma.university.encryptedSymmetricKey) {
      throw new BadRequestException('University has no symmetric key');
    }

    const symmetricKey = this.resolver.resolveUniversitySymmetricKey(
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
}
