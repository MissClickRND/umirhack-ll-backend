-- AlterTable
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'ADMIN';

-- AlterTable
ALTER TABLE "posts" ALTER COLUMN "updated_at" DROP DEFAULT;
