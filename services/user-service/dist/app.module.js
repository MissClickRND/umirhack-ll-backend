"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const joi_1 = __importDefault(require("joi"));
const prisma_module_1 = require("./prisma/prisma.module");
const users_module_1 = require("./users/users.module");
const path_1 = require("path");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: (0, path_1.resolve)(__dirname, "../../../.env"),
                validationSchema: joi_1.default.object({
                    DATABASE_URL: joi_1.default.string().required(),
                    USER_SERVICE_PORT: joi_1.default.number().port().default(3002),
                    PORT: joi_1.default.number().port().optional(),
                    TCP_PORT: joi_1.default.number().port().default(4001),
                    JWT_ACCESS_SECRET: joi_1.default.string().required(),
                    CORS_ORIGIN: joi_1.default.string().default("http://localhost:5173"),
                }),
            }),
            prisma_module_1.PrismaModule,
            users_module_1.UsersModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map