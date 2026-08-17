-- AlterTable: Make userId nullable and add pending signup fields
ALTER TABLE "VerificationCode" ALTER COLUMN "userId" DROP NOT NULL;

ALTER TABLE "VerificationCode" ADD COLUMN "pendingName"         TEXT;
ALTER TABLE "VerificationCode" ADD COLUMN "pendingPasswordHash" TEXT;
ALTER TABLE "VerificationCode" ADD COLUMN "pendingMethod"       TEXT;
