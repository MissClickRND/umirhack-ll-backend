/*
  Warnings:

  - A unique constraint covering the columns `[registration_number_hash]` on the table `diplomas` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `registration_number_hash` to the `diplomas` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "diplomas" ADD COLUMN     "registration_number_hash" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "diplomas_registration_number_hash_key" ON "diplomas"("registration_number_hash");
