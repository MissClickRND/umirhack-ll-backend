-- Add explicit flag for university private key encryption state
ALTER TABLE "universities"
ADD COLUMN "is_private_key_encrypted" BOOLEAN NOT NULL DEFAULT false;

-- Best-effort backfill: mark rows that already look like encrypted payloads (iv:cipher hex)
UPDATE "universities"
SET "is_private_key_encrypted" = true
WHERE "encrypted_private_key" IS NOT NULL
  AND POSITION(':' IN "encrypted_private_key") > 0
  AND "encrypted_private_key" NOT LIKE '%BEGIN PRIVATE KEY%';
