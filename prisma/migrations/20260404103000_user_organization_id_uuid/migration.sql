-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_universityId_fkey";

-- DropForeignKey
ALTER TABLE "diplomas" DROP CONSTRAINT IF EXISTS "diplomas_university_id_fkey";

-- AlterTable: PK and FK targets must be UUID for native UUID columns
ALTER TABLE "universities" ALTER COLUMN "id" SET DATA TYPE UUID USING "id"::uuid;

-- AlterTable
ALTER TABLE "diplomas" ALTER COLUMN "university_id" SET DATA TYPE UUID USING "university_id"::uuid;

-- AlterTable: rename universityId -> organization_id (nullable)
ALTER TABLE "User" RENAME COLUMN "universityId" TO "organization_id";
ALTER TABLE "User" ALTER COLUMN "organization_id" SET DATA TYPE UUID USING "organization_id"::uuid;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "universities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diplomas" ADD CONSTRAINT "diplomas_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
