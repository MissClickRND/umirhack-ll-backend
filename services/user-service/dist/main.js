"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const microservices_1 = require("@nestjs/microservices");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
function normalizeOrigin(value) {
    return value
        .replace(/[\u200B-\u200D\uFEFF\u2060]/g, "")
        .trim()
        .replace(/\/$/, "");
}
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    const tcpPort = Number(configService.get("TCP_PORT") ?? "4001");
    const httpPort = Number(configService.get("USER_SERVICE_PORT") ??
        configService.get("PORT") ??
        "3002");
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    const swaggerConfig = new swagger_1.DocumentBuilder()
        .setTitle("User Service API")
        .setDescription("Users domain service API")
        .setVersion("1.0")
        .addBearerAuth()
        .addCookieAuth("accessToken")
        .build();
    const swaggerDocument = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
    swagger_1.SwaggerModule.setup("docs", app, swaggerDocument);
    const originsRaw = configService.get("CORS_ORIGIN") ??
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000";
    const allowedOrigins = new Set(originsRaw
        .split(",")
        .map((origin) => normalizeOrigin(origin))
        .filter(Boolean));
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin) {
                callback(null, true);
                return;
            }
            const normalizedOrigin = normalizeOrigin(origin);
            if (allowedOrigins.has(normalizedOrigin)) {
                callback(null, true);
                return;
            }
            callback(new Error(`CORS blocked for origin: ${normalizedOrigin}`), false);
        },
        credentials: true,
    });
    app.connectMicroservice({
        transport: microservices_1.Transport.TCP,
        options: {
            host: "0.0.0.0",
            port: tcpPort,
        },
    });
    await app.startAllMicroservices();
    await app.listen(httpPort, "0.0.0.0");
}
bootstrap();
//# sourceMappingURL=main.js.map