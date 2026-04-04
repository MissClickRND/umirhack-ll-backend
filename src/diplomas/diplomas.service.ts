import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateDiplomaBatchDto } from "./dto/create-diplomas-batch.dto";
import { CreateDiplomaDto } from "./dto/create-diploma.dto";
import { CreateQrTokenDto } from "./dto/create-qr-token.dto";
import { CryptoService } from "../crypto/crypto.service";
import { DiplomaStatus } from "@prisma/client";

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
        const data = dto.diplomas.map((d) => ({
            fullNameAuthorEncrypted: this.cryptoService.encryptSymmetric(d.fullNameAuthor, this.key),
            registrationNumberEncrypted: this.cryptoService.encryptSymmetric(
                d.registrationNumber,
                this.key,
            ),

            registrationNumberHash: this.cryptoService.hash(d.registrationNumber),

            userId: d.userId,
            universityId: d.universityId,
            issuedAt: d.issuedAt,
            specialty: d.specialty,
            degreeLevel: d.degreeLevel,
            status: DiplomaStatus.ACTIVE,
        }));

        return this.prisma.diploma.createMany({
            data,
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

        await this.prisma.diplomaToken.create({
            data: {
                diplomaId,
                tokenHash,
                expiresAt: dto.expiresAt,
                isOneTime: dto.isOneTime ?? false,
                createdBy: 'system',
            },
        });

        return {
            token,
        };
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

        // expiry check
        if (record.expiresAt && record.expiresAt < now) {
            throw new NotFoundException('Token expired');
        }

        // revoked check
        if (record.revokedAt) {
            throw new NotFoundException('Token revoked');
        }

        // one-time usage
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
