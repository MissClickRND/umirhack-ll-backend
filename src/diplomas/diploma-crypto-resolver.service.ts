import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CryptoService } from '../crypto/crypto.service';

@Injectable()
export class DiplomaCryptoResolverService {
  constructor(
    private readonly config: ConfigService,
    private readonly cryptoService: CryptoService,
  ) {}

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

  resolveUniversitySymmetricKey(stored: string): string {
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

  resolveUniversityPrivateKey(stored: string): string {
    const direct = stored?.trim();

    // Backward compatibility: old rows may still keep raw PEM.
    if (direct?.includes('BEGIN PRIVATE KEY')) {
      return direct;
    }

    const master = this.getMasterSymmetricKey();

    let decrypted: string;
    try {
      decrypted = this.cryptoService.decryptSymmetric(stored, master).trim();
    } catch {
      throw new BadRequestException('University private key is invalid');
    }

    if (!decrypted.includes('BEGIN PRIVATE KEY')) {
      throw new BadRequestException('University private key is invalid');
    }

    return decrypted;
  }
}
