ALTER TABLE "User"
ADD COLUMN "name" TEXT,
ADD COLUMN "phone" TEXT;

CREATE TABLE "Allergen" (
  "id" SERIAL NOT NULL,
  "name" TEXT NOT NULL,
  CONSTRAINT "Allergen_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Allergen_name_key" ON "Allergen"("name");

CREATE TABLE "UserAllergen" (
  "userId" INTEGER NOT NULL,
  "allergenId" INTEGER NOT NULL,
  CONSTRAINT "UserAllergen_pkey" PRIMARY KEY ("userId", "allergenId")
);

ALTER TABLE "UserAllergen"
ADD CONSTRAINT "UserAllergen_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserAllergen"
ADD CONSTRAINT "UserAllergen_allergenId_fkey"
FOREIGN KEY ("allergenId") REFERENCES "Allergen"("id") ON DELETE CASCADE ON UPDATE CASCADE;
