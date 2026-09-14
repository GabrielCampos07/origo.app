-- AlterTable
ALTER TABLE "users" ADD COLUMN "name" TEXT;

-- CreateEnum
CREATE TYPE "ProfessionalCategory" AS ENUM ('FISIOTERAPIA', 'EDUCACAO_FISICA', 'PERSONAL');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'REVOKED');

-- CreateTable
CREATE TABLE "professional_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" "ProfessionalCategory" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "professional_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invite_tokens" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "professionalUserId" TEXT NOT NULL,
    "category" "ProfessionalCategory" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invite_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "id" TEXT NOT NULL,
    "studentUserId" TEXT NOT NULL,
    "professionalUserId" TEXT NOT NULL,
    "category" "ProfessionalCategory" NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "professional_profiles_userId_key" ON "professional_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "invite_tokens_tokenHash_key" ON "invite_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "invite_tokens_professionalUserId_idx" ON "invite_tokens"("professionalUserId");

-- CreateIndex
CREATE INDEX "invite_tokens_expiresAt_idx" ON "invite_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "enrollments_studentUserId_idx" ON "enrollments"("studentUserId");

-- CreateIndex
CREATE INDEX "enrollments_professionalUserId_idx" ON "enrollments"("professionalUserId");

-- CreateIndex
CREATE INDEX "enrollments_category_idx" ON "enrollments"("category");

-- CreatePartialUniqueIndex (enforces ONE ACTIVE per studentUserId + category)
-- This prevents multiple ACTIVE enrollments for the same student in the same category
CREATE UNIQUE INDEX "enrollments_one_active_per_student_category" ON "enrollments"("studentUserId", "category") WHERE "status" = 'ACTIVE';

-- AddCheckConstraint (prevents self-enrollment)
-- Student cannot enroll with themselves as the professional
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_no_self_enrollment_check" CHECK ("studentUserId" <> "professionalUserId");

-- AddForeignKey
ALTER TABLE "professional_profiles" ADD CONSTRAINT "professional_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invite_tokens" ADD CONSTRAINT "invite_tokens_professionalUserId_fkey" FOREIGN KEY ("professionalUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_professionalUserId_fkey" FOREIGN KEY ("professionalUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
