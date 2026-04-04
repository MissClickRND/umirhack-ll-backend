import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateDiplomaBatchDto } from "./dto/create-diplomas-batch.dto";
import { CreateDiplomaDto } from "./dto/create-diploma.dto";
import { CreateQrTokenDto } from "./dto/create-qr-token.dto";
import { CryptoService } from "../crypto/crypto.service";
import { DiplomaStatus, Prisma } from "@prisma/client";

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
        const diplomasToCreate: Prisma.DiplomaCreateManyInput[] = [];

        for (const d of dto.diplomas) {

            const university = await this.prisma.university.findUnique({
                where: { id: d.universityId },
            });

            if (!university) {
                throw new BadRequestException(`University not found: ${d.universityId}`);
            }

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

            const registrationNumberHash = this.cryptoService.hash(d.registrationNumber);

            const payload = JSON.stringify({
                fullName: d.fullNameAuthor,
                registrationNumber: d.registrationNumber,
                issuedAt: d.issuedAt,
                universityId: d.universityId,
            });

            const signature = this.cryptoService.sign(payload, privateKey);

            diplomasToCreate.push({
                fullNameAuthorEncrypted: fullNameEncrypted,
                registrationNumberEncrypted,
                registrationNumberHash,

                userId: d.userId,
                universityId: d.universityId,
                issuedAt: d.issuedAt,
                specialty: d.specialty,
                degreeLevel: d.degreeLevel,
                status: DiplomaStatus.ACTIVE,

                signature,
            });
        }

        return this.prisma.diploma.createMany({
            data: diplomasToCreate,
        });
    }

    async findByUniversity(universityId: string) {
        return this.prisma.diploma.findMany({
            where: { universityId },
            include: {
                university: true,
            },
        });
    }


    async findByUser(userId: string) {
        return this.prisma.diploma.findMany({
            where: {
                userId: parseInt(userId),
            },
            include: {
                university: true,
            },
        });
    }


    async findById(id: string) {
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

    async update(id: string, dto: any) {
        const diploma = await this.prisma.diploma.findUnique({
            where: { id },
        });

        if (!diploma) {
            throw new NotFoundException('Diploma not found');
        }

        return this.prisma.diploma.update({
            where: { id },
            data: {
                ...dto,
            },
        });
    }


    async createQrToken(diplomaId: string, dto: CreateQrTokenDto) {
        const diploma = await this.prisma.diploma.findUnique({
            where: { id: diplomaId },
        });

        if (!diploma) {
            throw new NotFoundException('Diploma not found');
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
