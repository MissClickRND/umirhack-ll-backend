import { BadRequestException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";
import {
  UpdateProfilePayload,
  UpdateRolePayload,
  UsersListQuery,
} from "./users.types";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly authSelect = {
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
  } as const;

  private readonly publicSelect = {
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
  } as const;

  private toPublic(user: {
    id: number;
    email: string;
    name: string | null;
    phone: string | null;
    role: "ADMIN" | "WAITER" | "COOK" | "CUSTOMER";
    createdAt: Date;
    updatedAt: Date;
    userAllergens: Array<{ allergen: { id: number; name: string } }>;
  }) {
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

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: this.authSelect,
    });
  }

  async create(data: { email: string; passwordHash: string }) {
    return this.prisma.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        passwordHash: data.passwordHash,
      },
      select: this.authSelect,
    });
  }

  async setRefreshTokenHash(userId: number, hash: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRefreshToken: hash },
    });

    return { ok: true };
  }

  async logout(userId: number) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRefreshToken: null, tokenVersion: { increment: 1 } },
    });

    return { ok: true };
  }

  async findAuthById(userId: number) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: this.authSelect,
    });
  }

  async findTokenVersionById(userId: number): Promise<number | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { tokenVersion: true },
    });

    return user?.tokenVersion ?? null;
  }

  async findProfileById(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: this.publicSelect,
    });

    return user ? this.toPublic(user) : null;
  }

  async findList(query: UsersListQuery) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit =
      query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 20;
    const search = query.search?.trim();

    let orderBy: Prisma.UserOrderByWithRelationInput = { createdAt: "desc" };
    if (query.sort === "createdAt:asc") orderBy = { createdAt: "asc" };
    if (query.sort === "createdAt:desc") orderBy = { createdAt: "desc" };
    if (query.sort === "email:asc") orderBy = { email: "asc" };
    if (query.sort === "email:desc") orderBy = { email: "desc" };

    const where: Prisma.UserWhereInput = search
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

  async updateRole(payload: UpdateRolePayload) {
    const user = await this.prisma.user.update({
      where: { id: payload.userId },
      data: { role: payload.role },
      select: this.publicSelect,
    });

    return this.toPublic(user);
  }

  async updateProfile(payload: UpdateProfilePayload) {
    const userId = payload.userId;
    const email = payload.email?.toLowerCase().trim();

    if (email) {
      const existing = await this.prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });

      if (existing && existing.id !== userId) {
        throw new BadRequestException("User with this email already exists");
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
}
