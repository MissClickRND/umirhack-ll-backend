-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'WAITER', 'COOK', 'CUSTOMER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "roles" "Role"[] DEFAULT ARRAY['CUSTOMER']::"Role"[];
