/*
  Warnings:

  - You are about to drop the column `moodTier` on the `SymptomLog` table. All the data in the column will be lost.
  - You are about to drop the column `moodSpecific` on the `SymptomLog` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SymptomLog" DROP COLUMN "moodTier",
DROP COLUMN "moodSpecific",
ADD COLUMN     "moods" JSONB;
