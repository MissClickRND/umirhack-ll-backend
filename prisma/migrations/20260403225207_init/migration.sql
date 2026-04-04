-- CreateEnum
CREATE TYPE "DiplomaStatus" AS ENUM ('ACTIVE', 'REVOKED');

-- CreateEnum
CREATE TYPE "DegreeLevel" AS ENUM ('BACHELOR', 'MAGISTRACY', 'SPECIALIST', 'DOCTORATE');

-- CreateTable
CREATE TABLE "diplomas" (
    "id" TEXT NOT NULL,
    "full_name_author" TEXT NOT NULL,
    "registration_number" TEXT NOT NULL,
    "university_id" TEXT NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL,
    "specialty" TEXT NOT NULL,
    "degree_level" "DegreeLevel" NOT NULL,
    "status" "DiplomaStatus" NOT NULL,
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
    "created_by" TEXT NOT NULL,
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
CREATE UNIQUE INDEX "diploma_tokens_token_hash_key" ON "diploma_tokens"("token_hash");

-- AddForeignKey
ALTER TABLE "diplomas" ADD CONSTRAINT "diplomas_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diploma_tokens" ADD CONSTRAINT "diploma_tokens_diploma_id_fkey" FOREIGN KEY ("diploma_id") REFERENCES "diplomas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
