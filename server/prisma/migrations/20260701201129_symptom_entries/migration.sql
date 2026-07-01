/*
  Warnings:

  - You are about to drop the column `bloating` on the `SymptomLog` table. All the data in the column will be lost.
  - You are about to drop the column `cramps` on the `SymptomLog` table. All the data in the column will be lost.
  - You are about to drop the column `fatigue` on the `SymptomLog` table. All the data in the column will be lost.
  - You are about to drop the column `headache` on the `SymptomLog` table. All the data in the column will be lost.
  - You are about to drop the column `headacheSeverity` on the `SymptomLog` table. All the data in the column will be lost.
  - You are about to drop the column `headacheSide` on the `SymptomLog` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SymptomLog" DROP COLUMN "bloating",
DROP COLUMN "cramps",
DROP COLUMN "fatigue",
DROP COLUMN "headache",
DROP COLUMN "headacheSeverity",
DROP COLUMN "headacheSide";

-- CreateTable
CREATE TABLE "SymptomEntry" (
    "id" SERIAL NOT NULL,
    "symptomLogId" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "severity" TEXT,
    "details" JSONB,

    CONSTRAINT "SymptomEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SymptomEntry_symptomLogId_key_key" ON "SymptomEntry"("symptomLogId", "key");

-- AddForeignKey
ALTER TABLE "SymptomEntry" ADD CONSTRAINT "SymptomEntry_symptomLogId_fkey" FOREIGN KEY ("symptomLogId") REFERENCES "SymptomLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
