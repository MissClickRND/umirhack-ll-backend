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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const users_service_1 = require("./users.service");
const USER_PATTERNS = {
    FIND_BY_EMAIL: "users.findByEmail",
    CREATE: "users.create",
    SET_REFRESH_TOKEN_HASH: "users.setRefreshTokenHash",
    LOGOUT: "users.logout",
    FIND_AUTH_BY_ID: "users.findAuthById",
    FIND_TOKEN_VERSION_BY_ID: "users.findTokenVersionById",
    FIND_PROFILE_BY_ID: "users.findProfileById",
    FIND_LIST: "users.findList",
    UPDATE_ROLE: "users.updateRole",
    UPDATE_PROFILE: "users.updateProfile",
};
let UsersController = class UsersController {
    usersService;
    constructor(usersService) {
        this.usersService = usersService;
    }
    findByEmail(payload) {
        return this.usersService.findByEmail(payload.email);
    }
    create(payload) {
        return this.usersService.create(payload);
    }
    setRefreshTokenHash(payload) {
        return this.usersService.setRefreshTokenHash(payload.userId, payload.hash);
    }
    logout(payload) {
        return this.usersService.logout(payload.userId);
    }
    findAuthById(payload) {
        return this.usersService.findAuthById(payload.userId);
    }
    findTokenVersionById(payload) {
        return this.usersService.findTokenVersionById(payload.userId);
    }
    findProfileById(payload) {
        return this.usersService.findProfileById(payload.userId);
    }
    findList(payload) {
        return this.usersService.findList(payload);
    }
    updateRole(payload) {
        return this.usersService.updateRole(payload);
    }
    updateProfile(payload) {
        return this.usersService.updateProfile(payload);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, microservices_1.MessagePattern)(USER_PATTERNS.FIND_BY_EMAIL),
    __param(0, (0, microservices_1.Payload)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findByEmail", null);
__decorate([
    (0, microservices_1.MessagePattern)(USER_PATTERNS.CREATE),
    __param(0, (0, microservices_1.Payload)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "create", null);
__decorate([
    (0, microservices_1.MessagePattern)(USER_PATTERNS.SET_REFRESH_TOKEN_HASH),
    __param(0, (0, microservices_1.Payload)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "setRefreshTokenHash", null);
__decorate([
    (0, microservices_1.MessagePattern)(USER_PATTERNS.LOGOUT),
    __param(0, (0, microservices_1.Payload)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "logout", null);
__decorate([
    (0, microservices_1.MessagePattern)(USER_PATTERNS.FIND_AUTH_BY_ID),
    __param(0, (0, microservices_1.Payload)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findAuthById", null);
__decorate([
    (0, microservices_1.MessagePattern)(USER_PATTERNS.FIND_TOKEN_VERSION_BY_ID),
    __param(0, (0, microservices_1.Payload)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findTokenVersionById", null);
__decorate([
    (0, microservices_1.MessagePattern)(USER_PATTERNS.FIND_PROFILE_BY_ID),
    __param(0, (0, microservices_1.Payload)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findProfileById", null);
__decorate([
    (0, microservices_1.MessagePattern)(USER_PATTERNS.FIND_LIST),
    __param(0, (0, microservices_1.Payload)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findList", null);
__decorate([
    (0, microservices_1.MessagePattern)(USER_PATTERNS.UPDATE_ROLE),
    __param(0, (0, microservices_1.Payload)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateRole", null);
__decorate([
    (0, microservices_1.MessagePattern)(USER_PATTERNS.UPDATE_PROFILE),
    __param(0, (0, microservices_1.Payload)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateProfile", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map