"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    authSelect = {
        id: true,
        email: true,
        name: true,
        phone: true,
        passwordHash: true,
        hashedRefreshToken: true,
        role: true,
        tokenVersion: true,
        createdAt: true,
        updatedAt: true,
        userAllergens: {
            select: {
                allergen: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        },
    };
    publicSelect = {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        userAllergens: {
            select: {
                allergen: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        },
    };
    toPublic(user) {
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            userAllergens: user.userAllergens.map((x) => x.allergen),
        };
    }
    async findByEmail(email) {
        return this.prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
            select: this.authSelect,
        });
    }
    async create(data) {
        return this.prisma.user.create({
            data: {
                email: data.email.toLowerCase().trim(),
                passwordHash: data.passwordHash,
            },
            select: this.authSelect,
        });
    }
    async setRefreshTokenHash(userId, hash) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { hashedRefreshToken: hash },
        });
        return { ok: true };
    }
    async logout(userId) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { hashedRefreshToken: null, tokenVersion: { increment: 1 } },
        });
        return { ok: true };
    }
    async findAuthById(userId) {
        return this.prisma.user.findUnique({
            where: { id: userId },
            select: this.authSelect,
        });
    }
    async findTokenVersionById(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { tokenVersion: true },
        });
        return user?.tokenVersion ?? null;
    }
    async findProfileById(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: this.publicSelect,
        });
        return user ? this.toPublic(user) : null;
    }
    async findList(query) {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 20;
        const search = query.search?.trim();
        let orderBy = { createdAt: "desc" };
        if (query.sort === "createdAt:asc")
            orderBy = { createdAt: "asc" };
        if (query.sort === "createdAt:desc")
            orderBy = { createdAt: "desc" };
        if (query.sort === "email:asc")
            orderBy = { email: "asc" };
        if (query.sort === "email:desc")
            orderBy = { email: "desc" };
        const where = search
            ? {
                OR: [
                    { email: { contains: search, mode: "insensitive" } },
                    { name: { contains: search, mode: "insensitive" } },
                    { phone: { contains: search, mode: "insensitive" } },
                ],
            }
            : {};
        const [total, users] = await this.prisma.$transaction([
            this.prisma.user.count({ where }),
            this.prisma.user.findMany({
                where,
                orderBy,
                skip: (page - 1) * limit,
                take: limit,
                select: this.publicSelect,
            }),
        ]);
        return {
            data: users.map((user) => this.toPublic(user)),
            meta: {
                page,
                limit,
                total,
                pages: Math.max(1, Math.ceil(total / limit)),
            },
        };
    }
    async updateRole(payload) {
        const user = await this.prisma.user.update({
            where: { id: payload.userId },
            data: { role: payload.role },
            select: this.publicSelect,
        });
        return this.toPublic(user);
    }
    async updateProfile(payload) {
        const userId = payload.userId;
        const email = payload.email?.toLowerCase().trim();
        if (email) {
            const existing = await this.prisma.user.findUnique({
                where: { email },
                select: { id: true },
            });
            if (existing && existing.id !== userId) {
                throw new common_1.BadRequestException("User with this email already exists");
            }
        }
        const user = await this.prisma.$transaction(async (tx) => {
            if (Array.isArray(payload.userAllergenIds)) {
                await tx.userAllergen.deleteMany({ where: { userId } });
                if (payload.userAllergenIds.length > 0) {
                    await tx.userAllergen.createMany({
                        data: payload.userAllergenIds.map((allergenId) => ({
                            userId,
                            allergenId,
                        })),
                        skipDuplicates: true,
                    });
                }
            }
            return tx.user.update({
                where: { id: userId },
                data: {
                    email,
                    name: payload.name,
                    phone: payload.phone,
                },
                select: this.publicSelect,
            });
        });
        return this.toPublic(user);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map