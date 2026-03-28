import { config as loadEnv } from 'dotenv';
import { defineConfig, env } from 'prisma/config';
import { resolve } from 'path';

loadEnv({ path: resolve(process.cwd(), '../../.env') });
loadEnv();

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
