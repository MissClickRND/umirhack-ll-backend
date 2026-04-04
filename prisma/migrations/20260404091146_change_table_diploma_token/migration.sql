/*
  Warnings:

  - You are about to drop the column `created_by` on the `diploma_tokens` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE IF EXISTS "diploma_tokens" DROP COLUMN IF EXISTS "created_by";
