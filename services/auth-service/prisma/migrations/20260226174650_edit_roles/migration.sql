-- Convert legacy roles[] column into single role enum column
ALTER TABLE "User" RENAME COLUMN "roles" TO "role";

ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;

ALTER TABLE "User"
ALTER COLUMN "role" TYPE "Role" USING COALESCE("role"[1], 'CUSTOMER'::"Role"),
ALTER COLUMN "role" SET DEFAULT 'CUSTOMER',
ALTER COLUMN "role" SET NOT NULL;
