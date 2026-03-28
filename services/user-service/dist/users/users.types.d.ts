export declare const ROLES: readonly ["ADMIN", "WAITER", "COOK", "CUSTOMER"];
export type Role = (typeof ROLES)[number];
export type UsersListQuery = {
    search?: string;
    sort?: string;
    page?: number;
    limit?: number;
};
export type UpdateProfilePayload = {
    userId: number;
    email?: string;
    name?: string;
    phone?: string;
    userAllergenIds?: number[];
};
export type UpdateRolePayload = {
    userId: number;
    role: Role;
};
