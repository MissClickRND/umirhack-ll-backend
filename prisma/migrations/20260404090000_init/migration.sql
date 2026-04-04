-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'HR', 'NEED_VERIFICATION', 'UNIVERSITY', 'STUDENT');

-- CreateEnum
CREATE TYPE "DiplomaStatus" AS ENUM ('ACTIVE', 'REVOKED');

-- CreateEnum
CREATE TYPE "DegreeLevel" AS ENUM ('BACHELOR', 'MAGISTRACY', 'SPECIALIST', 'DOCTORATE');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "hashedRefreshToken" TEXT,
    "tokenVersion" INTEGER NOT NULL DEFAULT 0,
    "role" "Role" NOT NULL DEFAULT 'HR',
    "universityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diplomas" (
    "id" TEXT NOT NULL,
    "full_name_author" TEXT NOT NULL,
    "registration_number" TEXT NOT NULL,
    "registration_number_hash" TEXT NOT NULL,
    "user_id" INTEGER,
    "university_id" TEXT NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL,
    "specialty" TEXT NOT NULL,
    "degree_level" "DegreeLevel" NOT NULL,
    "status" "DiplomaStatus" NOT NULL,
    "signature" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diplomas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diploma_tokens" (
    "id" TEXT NOT NULL,
    "diploma_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "is_one_time" BOOLEAN NOT NULL DEFAULT false,
    "last_used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "diploma_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "universities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "short_name" TEXT,
    "public_key" TEXT,
    "encrypted_private_key" TEXT,
    "encrypted_symmetric_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "universities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "diplomas_registration_number_hash_key" ON "diplomas"("registration_number_hash");

-- CreateIndex
CREATE UNIQUE INDEX "diploma_tokens_token_hash_key" ON "diploma_tokens"("token_hash");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diplomas" ADD CONSTRAINT "diplomas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diplomas" ADD CONSTRAINT "diplomas_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diploma_tokens" ADD CONSTRAINT "diploma_tokens_diploma_id_fkey" FOREIGN KEY ("diploma_id") REFERENCES "diplomas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
