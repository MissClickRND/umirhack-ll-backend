-- AlterTable
ALTER TABLE "User" ADD COLUMN "pending_university_name" TEXT,
ADD COLUMN "pending_university_short_name" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "universities_name_key" ON "universities"("name");
