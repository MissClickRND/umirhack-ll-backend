import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";
import { resolve } from "path";

loadEnv({ path: resolve(process.cwd(), "../../.env") });
loadEnv();

const databaseUrl = process.env.DATABASE_URL ?? process.env.AUTH_DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL or AUTH_DATABASE_URL must be set");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: databaseUrl,
  },
});
