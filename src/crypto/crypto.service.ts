import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class CryptoService {
  private normalizePem(
    pem: string,
    label: 'PRIVATE KEY' | 'PUBLIC KEY',
  ): string {
    const text = (pem ?? '').trim();
    const re = new RegExp(
      `-----BEGIN ${label}-----([\\s\\S]+?)-----END ${label}-----`,
    );
    const match = text.match(re);

    if (!match) {
      return text;
    }

    const body = match[1].replace(/\s+/g, '');
    const lines = body.match(/.{1,64}/g) ?? [];

    return [
      `-----BEGIN ${label}-----`,
      ...lines,
      `-----END ${label}-----`,
    ].join('\n');
  }

  generateSymmetricKey(): string {
    return crypto.randomBytes(32).toString('hex'); // 256-bit key
  }

  encryptSymmetric(text: string, key: string): string {
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(key, 'hex'),
      iv,
    );

    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final(),
    ]);

    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  decryptSymmetric(payload: string, key: string): string {
    const [ivHex, encryptedHex] = payload.split(':');

    const iv = Buffer.from(ivHex, 'hex');
    const encryptedText = Buffer.from(encryptedHex, 'hex');

    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(key, 'hex'),
      iv,
    );

    const decrypted = Buffer.concat([
      decipher.update(encryptedText),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }

  generateKeyPair(): { publicKey: string; privateKey: string } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    return { publicKey, privateKey };
  }

  sign(data: string, privateKey: string): string {
    const normalizedPrivateKey = this.normalizePem(privateKey, 'PRIVATE KEY');
    const sign = crypto.createSign('SHA256');
    sign.update(data);
    sign.end();

    return sign.sign(normalizedPrivateKey, 'hex');
  }

  verify(data: string, signature: string, publicKey: string): boolean {
    const normalizedPublicKey = this.normalizePem(publicKey, 'PUBLIC KEY');
    const verify = crypto.createVerify('SHA256');
    verify.update(data);
    verify.end();

    return verify.verify(normalizedPublicKey, signature, 'hex');
  }

  hash(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }
}
