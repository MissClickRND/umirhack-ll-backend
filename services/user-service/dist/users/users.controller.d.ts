import { UsersService } from "./users.service";
import type { UpdateProfilePayload, UpdateRolePayload, UsersListQuery } from "./users.types";
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findByEmail(payload: {
        email: string;
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
    } | null>;
    create(payload: {
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
    setRefreshTokenHash(payload: {
        userId: number;
        hash: string;
    }): Promise<{
        ok: boolean;
    }>;
    logout(payload: {
        userId: number;
    }): Promise<{
        ok: boolean;
    }>;
    findAuthById(payload: {
        userId: number;
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
    } | null>;
    findTokenVersionById(payload: {
        userId: number;
    }): Promise<number | null>;
    findProfileById(payload: {
        userId: number;
    }): Promise<{
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
    findList(payload: UsersListQuery): Promise<{
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
