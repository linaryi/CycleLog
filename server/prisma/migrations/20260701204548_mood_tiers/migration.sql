/*
  Warnings:

  - You are about to drop the column `mood` on the `SymptomLog` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SymptomLog" DROP COLUMN "mood",
ADD COLUMN     "moodTier" TEXT,
ADD COLUMN     "moodSpecific" TEXT;
