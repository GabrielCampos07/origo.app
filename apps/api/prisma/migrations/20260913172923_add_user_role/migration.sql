-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PROFESSIONAL', 'STUDENT');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'STUDENT';
