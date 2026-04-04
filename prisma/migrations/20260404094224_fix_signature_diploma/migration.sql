/*
  Warnings:

  - You are about to drop the column `signature` on the `diploma_tokens` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "diploma_tokens" DROP COLUMN "signature";

-- AlterTable
ALTER TABLE "diplomas" ADD COLUMN     "signature" TEXT;
