-- Professional-owned exercise library + optional FK on program lines

-- CreateTable
CREATE TABLE "professional_exercises" (
    "id" TEXT NOT NULL,
    "professionalUserId" TEXT NOT NULL,
    "namePt" TEXT NOT NULL,
    "categoryTags" TEXT[],
    "videoUrl" TEXT,
    "photoUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "cuesPt" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "professional_exercises_pkey" PRIMARY KEY ("id")
);

-- AlterTable: optional FK from program exercise → professional library
ALTER TABLE "program_exercises" ADD COLUMN "professionalExerciseId" TEXT;

-- CreateIndex
CREATE INDEX "professional_exercises_professionalUserId_active_idx" ON "professional_exercises"("professionalUserId", "active");

-- CreateIndex
CREATE INDEX "program_exercises_professionalExerciseId_idx" ON "program_exercises"("professionalExerciseId");

-- AddForeignKey
ALTER TABLE "professional_exercises" ADD CONSTRAINT "professional_exercises_professionalUserId_fkey" FOREIGN KEY ("professionalUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_exercises" ADD CONSTRAINT "program_exercises_professionalExerciseId_fkey" FOREIGN KEY ("professionalExerciseId") REFERENCES "professional_exercises"("id") ON DELETE SET NULL ON UPDATE CASCADE;
