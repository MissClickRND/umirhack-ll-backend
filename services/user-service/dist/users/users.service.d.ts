import { PrismaService } from "src/prisma/prisma.service";
import { UpdateProfilePayload, UpdateRolePayload, UsersListQuery } from "./users.types";
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private readonly authSelect;
    private readonly publicSelect;
    private toPublic;
    findByEmail(email: string): Promise<{
        id: number;
        email: string;
        name: string | null;
        phone: string | null;
        passwordHash: string;
        hashedRefreshToken: string | null;
        tokenVersion: number;
        role: import("@prisma/client").$Enums.Role;
        createdAt: Date;
        updatedAt: Date;
        userAllergens: {
            allergen: {
                id: number;
                name: string;
            };
        }[];
    } | null>;
    create(data: {
        email: string;
        passwordHash: string;
    }): Promise<{
        id: number;
        email: string;
        name: string | null;
        phone: string | null;
        passwordHash: string;
        hashedRefreshToken: string | null;
        tokenVersion: number;
        role: import("@prisma/client").$Enums.Role;
        createdAt: Date;
        updatedAt: Date;
        userAllergens: {
            allergen: {
                id: number;
                name: string;
            };
        }[];
    }>;
    setRefreshTokenHash(userId: number, hash: string): Promise<{
        ok: boolean;
    }>;
    logout(userId: number): Promise<{
        ok: boolean;
    }>;
    findAuthById(userId: number): Promise<{
        id: number;
        email: string;
        name: string | null;
        phone: string | null;
        passwordHash: string;
        hashedRefreshToken: string | null;
        tokenVersion: number;
        role: import("@prisma/client").$Enums.Role;
        createdAt: Date;
        updatedAt: Date;
        userAllergens: {
            allergen: {
                id: number;
                name: string;
            };
        }[];
    } | null>;
    findTokenVersionById(userId: number): Promise<number | null>;
    findProfileById(userId: number): Promise<{
        id: number;
        email: string;
        name: string | null;
        phone: string | null;
        role: "ADMIN" | "WAITER" | "COOK" | "CUSTOMER";
        createdAt: Date;
        updatedAt: Date;
        userAllergens: {
            id: number;
            name: string;
        }[];
    } | null>;
    findList(query: UsersListQuery): Promise<{
        data: {
            id: number;
            email: string;
            name: string | null;
            phone: string | null;
            role: "ADMIN" | "WAITER" | "COOK" | "CUSTOMER";
            createdAt: Date;
            updatedAt: Date;
            userAllergens: {
                id: number;
                name: string;
            }[];
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    updateRole(payload: UpdateRolePayload): Promise<{
        id: number;
        email: string;
        name: string | null;
        phone: string | null;
        role: "ADMIN" | "WAITER" | "COOK" | "CUSTOMER";
        createdAt: Date;
        updatedAt: Date;
        userAllergens: {
            id: number;
            name: string;
        }[];
    }>;
    updateProfile(payload: UpdateProfilePayload): Promise<{
        id: number;
        email: string;
        name: string | null;
        phone: string | null;
        role: "ADMIN" | "WAITER" | "COOK" | "CUSTOMER";
        createdAt: Date;
        updatedAt: Date;
        userAllergens: {
            id: number;
            name: string;
        }[];
    }>;
}
