/*
  Warnings:

  - You are about to drop the `Diploma` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `University` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Diploma" DROP CONSTRAINT "Diploma_universityId_fkey";

-- DropForeignKey
ALTER TABLE "Diploma" DROP CONSTRAINT "Diploma_userId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_universityId_fkey";

-- DropForeignKey
ALTER TABLE "diplomas" DROP CONSTRAINT "diplomas_user_id_fkey";

-- AlterTable
ALTER TABLE "diplomas" ALTER COLUMN "user_id" DROP NOT NULL;

-- DropTable
DROP TABLE "Diploma";

-- DropTable
DROP TABLE "University";

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diplomas" ADD CONSTRAINT "diplomas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
