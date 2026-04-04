/*
  Warnings:

  - You are about to drop the column `signature` on the `diploma_tokens` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE IF EXISTS "diploma_tokens" DROP COLUMN IF EXISTS "signature";

-- AlterTable
ALTER TABLE IF EXISTS "diplomas" ADD COLUMN IF NOT EXISTS "signature" TEXT;
