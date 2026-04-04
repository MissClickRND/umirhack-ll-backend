import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DiplomaStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../crypto/crypto.service';
import { BulkVerifyDiplomasDto } from './dto/bulk-verify-diplomas.dto';
import {
  BulkVerifyDiplomaResponseDto,
  PublicDiplomaDetailDto,
  PublicDiplomaUserDto,
} from './dto/bulk-verify-diploma-response.dto';

const DIPLOMA_NUMBER_RE = /^\d{13}$/;

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

  private assertDiplomaNumberFormat(diplomaNumber: string): void {
    if (!DIPLOMA_NUMBER_RE.test(diplomaNumber)) {
      throw new BadRequestException(
        'Diploma number must be a string with exactly 13 digits',
      );
    }
  }

  private resolveUniversitySymmetricKey(
    stored: string,
    master: string,
  ): string | null {
    const trimmed = stored?.trim();
    if (!trimmed) {
      return null;
    }

    if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
      return trimmed;
    }

    try {
      const decrypted = this.cryptoService
        .decryptSymmetric(trimmed, master)
        .trim();
      return /^[0-9a-fA-F]{64}$/.test(decrypted) ? decrypted : null;
    } catch {
      return null;
    }
  }

  private buildUserInfo(input: {
    user: { id: number; email: string } | null;
    fullName: string | null;
  }): PublicDiplomaUserDto | null {
    const hasAnyUserInfo = Boolean(input.user) || Boolean(input.fullName);

    if (!hasAnyUserInfo) {
      return null;
    }

    return {
      id: input.user?.id ?? null,
      email: input.user?.email ?? null,
      fullName: input.fullName,
    };
  }

  private async lookupByNumber(
    diplomaNumber: string,
  ): Promise<BulkVerifyDiplomaResponseDto> {
    const hash = this.cryptoService.hash(diplomaNumber);

    const diploma = await this.prisma.diploma.findFirst({
      where: { registrationNumberHash: hash },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        university: {
          select: {
            encryptedSymmetricKey: true,
          },
        },
      },
    });

    if (!diploma) {
      return {
        diplomaNumber,
        status: DiplomaStatus.REVOKED,
        user: null,
      };
    }

    let fullName: string | null = null;
    const masterSymmetricKey = this.getDiplomaSymmetricKey();
    const universityKey = this.resolveUniversitySymmetricKey(
      diploma.university.encryptedSymmetricKey ?? '',
      masterSymmetricKey,
    );

    if (universityKey) {
      try {
        fullName = this.cryptoService.decryptSymmetric(
          diploma.fullNameAuthorEncrypted,
          universityKey,
        );
      } catch {
        fullName = null;
      }
    }

    return {
      diplomaNumber,
      status: diploma.status,
      user: this.buildUserInfo({ user: diploma.user, fullName }),
    };
  }

  async verifyOne(
    diplomaNumber: string,
  ): Promise<BulkVerifyDiplomaResponseDto> {
    this.assertDiplomaNumberFormat(diplomaNumber);
    return this.lookupByNumber(diplomaNumber);
  }

  async getDiplomaByNumber(
    diplomaNumber: string,
  ): Promise<PublicDiplomaDetailDto> {
    this.assertDiplomaNumberFormat(diplomaNumber);

    const hash = this.cryptoService.hash(diplomaNumber);
    const diploma = await this.prisma.diploma.findFirst({
      where: { registrationNumberHash: hash },
      include: {
        university: {
          select: {
            id: true,
            name: true,
            shortName: true,
            encryptedSymmetricKey: true,
          },
        },
      },
    });

    if (!diploma) {
      throw new NotFoundException('Diploma not found');
    }

    const masterSymmetricKey = this.getDiplomaSymmetricKey();
    const universitySymmetricKey = this.resolveUniversitySymmetricKey(
      diploma.university.encryptedSymmetricKey ?? '',
      masterSymmetricKey,
    );

    if (!universitySymmetricKey) {
      throw new BadRequestException('University symmetric key is invalid');
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
      throw new BadRequestException(
        'Diploma data is encrypted with invalid key',
      );
    }

    return {
      id: diploma.id,
      fullNameAuthor,
      registrationNumber,
      specialty: diploma.specialty,
      degreeLevel: diploma.degreeLevel,
      status: diploma.status,
      university: {
        id: diploma.university.id,
        name: diploma.university.name,
        shortName: diploma.university.shortName,
      },
    };
  }

  async verifyMany(
    diplomaNumbers: string[],
  ): Promise<BulkVerifyDiplomaResponseDto[]> {
    diplomaNumbers.forEach((number) => this.assertDiplomaNumberFormat(number));

    return Promise.all(
      diplomaNumbers.map((number) => this.lookupByNumber(number)),
    );
  }

  async verify(
    dto: BulkVerifyDiplomasDto,
  ): Promise<BulkVerifyDiplomaResponseDto | BulkVerifyDiplomaResponseDto[]> {
    const hasSingle = typeof dto.diplomaNumber === 'string';
    const hasMany = Array.isArray(dto.diplomaNumbers);

    if (hasSingle === hasMany) {
      throw new BadRequestException(
        'Provide either diplomaNumber (single) or diplomaNumbers (array)',
      );
    }

    if (hasSingle) {
      return this.verifyOne(dto.diplomaNumber!);
    }

    if (!dto.diplomaNumbers) {
      throw new BadRequestException(
        'diplomaNumbers must be provided for batch verification',
      );
    }

    return this.verifyMany(dto.diplomaNumbers);
  }
}
