-- Rename email -> username (no email verification, so it was only ever an identifier).
-- RENAME preserves existing values rather than dropping/recreating the column.
ALTER TABLE "User" RENAME COLUMN "email" TO "username";
ALTER INDEX "User_email_key" RENAME TO "User_username_key";
