-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "diploma_tokens" DROP CONSTRAINT "diploma_tokens_diploma_id_fkey";

-- DropForeignKey
ALTER TABLE "diplomas" DROP CONSTRAINT "diplomas_university_id_fkey";

-- DropForeignKey
ALTER TABLE "diplomas" DROP CONSTRAINT "diplomas_user_id_fkey";

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
DROP COLUMN "organization_id",
ADD COLUMN     "organization_id" INTEGER,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "diploma_tokens" DROP CONSTRAINT "diploma_tokens_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "diploma_id",
ADD COLUMN     "diploma_id" INTEGER NOT NULL,
ADD CONSTRAINT "diploma_tokens_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "diplomas" DROP CONSTRAINT "diplomas_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "university_id",
ADD COLUMN     "university_id" INTEGER NOT NULL,
DROP COLUMN "user_id",
ADD COLUMN     "user_id" INTEGER,
ADD CONSTRAINT "diplomas_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "universities" DROP CONSTRAINT "universities_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "universities_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "universities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diplomas" ADD CONSTRAINT "diplomas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diplomas" ADD CONSTRAINT "diplomas_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diploma_tokens" ADD CONSTRAINT "diploma_tokens_diploma_id_fkey" FOREIGN KEY ("diploma_id") REFERENCES "diplomas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
