CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateTable
CREATE TABLE "University" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "publicKey" TEXT,
    "encryptedPrivateKey" TEXT,
    "encryptedSymmetricKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "University_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Diploma" (
    "id" TEXT NOT NULL,
    "fullNameUser" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "userId" INTEGER,
    "registrationNumber" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL,
    "specialty" TEXT NOT NULL,
    "degreeLevel" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Diploma_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "User" ADD COLUMN "universityId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "University_shortName_key" ON "University"("shortName");
CREATE INDEX "Diploma_universityId_idx" ON "Diploma"("universityId");
CREATE INDEX "Diploma_userId_idx" ON "Diploma"("userId");

-- Migrate data Organization -> University
CREATE TABLE "_OrganizationUniversityMap" (
    "organizationId" INTEGER NOT NULL PRIMARY KEY,
    "universityId" TEXT NOT NULL
);

INSERT INTO "_OrganizationUniversityMap" ("organizationId", "universityId")
SELECT "id", gen_random_uuid()::text
FROM "Organization";

INSERT INTO "University" (
    "id",
    "name",
    "shortName",
    "createdAt",
    "updatedAt"
)
SELECT
    m."universityId",
    o."name",
    o."shortName",
    o."createdAt",
    o."updatedAt"
FROM "Organization" o
JOIN "_OrganizationUniversityMap" m ON m."organizationId" = o."id";

UPDATE "User" u
SET "universityId" = m."universityId"
FROM "_OrganizationUniversityMap" m
WHERE u."organizationId" = m."organizationId";

-- Drop old organization link
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_organizationId_fkey";
ALTER TABLE "User" DROP COLUMN IF EXISTS "organizationId";
DROP TABLE IF EXISTS "_OrganizationUniversityMap";
DROP TABLE IF EXISTS "Organization";

-- AddForeignKey
ALTER TABLE "User"
ADD CONSTRAINT "User_universityId_fkey"
FOREIGN KEY ("universityId") REFERENCES "University"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Diploma"
ADD CONSTRAINT "Diploma_universityId_fkey"
FOREIGN KEY ("universityId") REFERENCES "University"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Diploma"
ADD CONSTRAINT "Diploma_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
