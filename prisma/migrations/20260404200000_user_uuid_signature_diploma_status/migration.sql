-- DiplomaStatus: ACTIVE -> ISSUED, add VALID
CREATE TYPE "DiplomaStatus_new" AS ENUM ('ISSUED', 'VALID', 'REVOKED');

ALTER TABLE "diplomas" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "diplomas"
  ALTER COLUMN "status" TYPE "DiplomaStatus_new"
  USING (
    CASE "status"::text
      WHEN 'ACTIVE' THEN 'ISSUED'::"DiplomaStatus_new"
      WHEN 'REVOKED' THEN 'REVOKED'::"DiplomaStatus_new"
      ELSE 'ISSUED'::"DiplomaStatus_new"
    END
  );

DROP TYPE "DiplomaStatus";

ALTER TYPE "DiplomaStatus_new" RENAME TO "DiplomaStatus";

-- Digital signature (hex); empty for legacy rows
ALTER TABLE "diplomas" ADD COLUMN IF NOT EXISTS "signature" TEXT;
UPDATE "diplomas" SET "signature" = '' WHERE "signature" IS NULL;
ALTER TABLE "diplomas" ALTER COLUMN "signature" SET DEFAULT '';
ALTER TABLE "diplomas" ALTER COLUMN "signature" SET NOT NULL;

-- User PK: INTEGER -> UUID
ALTER TABLE "User" ADD COLUMN "new_id" UUID;

UPDATE "User" SET "new_id" = gen_random_uuid() WHERE "new_id" IS NULL;

ALTER TABLE "User" ALTER COLUMN "new_id" SET NOT NULL;

CREATE UNIQUE INDEX "User_new_id_key" ON "User"("new_id");

ALTER TABLE "diplomas" ADD COLUMN "user_id_new" UUID;

UPDATE "diplomas" d
SET "user_id_new" = u."new_id"
FROM "User" u
WHERE d."user_id" IS NOT NULL AND d."user_id" = u."id";

ALTER TABLE "diplomas" DROP CONSTRAINT IF EXISTS "diplomas_user_id_fkey";

ALTER TABLE "diplomas" DROP COLUMN "user_id";

ALTER TABLE "diplomas" RENAME COLUMN "user_id_new" TO "user_id";

ALTER TABLE "User" DROP CONSTRAINT "User_pkey";

ALTER TABLE "User" DROP COLUMN "id";

ALTER TABLE "User" RENAME COLUMN "new_id" TO "id";

DROP INDEX IF EXISTS "User_new_id_key";

ALTER TABLE "User" ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

ALTER TABLE "diplomas"
  ADD CONSTRAINT "diplomas_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
