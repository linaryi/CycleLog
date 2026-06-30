/*
  Warnings:

  - A unique constraint covering the columns `[userId,date]` on the table `SymptomLog` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "SymptomLog" ADD COLUMN     "flow" TEXT,
ADD COLUMN     "headacheSeverity" INTEGER,
ADD COLUMN     "headacheSide" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "SymptomLog_userId_date_key" ON "SymptomLog"("userId", "date");
