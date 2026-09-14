-- Slice 2–3 HEP: Program, ProgramExercise, WorkoutSession, SessionExerciseLog, ClinicalNote

-- CreateEnum
CREATE TYPE "ProgramStatus" AS ENUM ('ACTIVE');

-- CreateEnum
CREATE TYPE "WorkoutSessionStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED');

-- CreateTable
CREATE TABLE "programs" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "phaseLabel" TEXT,
    "status" "ProgramStatus" NOT NULL DEFAULT 'ACTIVE',
    "targetSessionsPerWeek" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "programs_target_sessions_range_check" CHECK ("targetSessionsPerWeek" >= 1 AND "targetSessionsPerWeek" <= 14)
);

-- CreateTable
CREATE TABLE "program_exercises" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "sets" INTEGER NOT NULL,
    "reps" TEXT NOT NULL,
    "notes" TEXT,
    "precautions" TEXT,
    "removedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "program_exercises_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "program_exercises_sets_range_check" CHECK ("sets" >= 1 AND "sets" <= 50)
);

-- CreateTable
CREATE TABLE "workout_sessions" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" "WorkoutSessionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "painLevel" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workout_sessions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "workout_sessions_pain_level_check" CHECK ("painLevel" IS NULL OR ("painLevel" >= 0 AND "painLevel" <= 10))
);

-- CreateTable
CREATE TABLE "session_exercise_logs" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "programExerciseId" TEXT NOT NULL,
    "setsCompleted" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_exercise_logs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "session_exercise_logs_sets_completed_check" CHECK ("setsCompleted" >= 0 AND "setsCompleted" <= 50)
);

-- CreateTable
CREATE TABLE "clinical_notes" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "conduta" TEXT NOT NULL,
    "evolucao" TEXT NOT NULL,
    "informacoesPertinentes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clinical_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "programs_enrollmentId_idx" ON "programs"("enrollmentId");

-- One ACTIVE program per enrollment
CREATE UNIQUE INDEX "programs_one_active_per_enrollment"
ON "programs"("enrollmentId")
WHERE "status" = 'ACTIVE';

-- CreateIndex
CREATE INDEX "program_exercises_programId_idx" ON "program_exercises"("programId");

-- Unique order among visible (non-removed) exercises
CREATE UNIQUE INDEX "program_exercises_programId_orderIndex_active_key"
ON "program_exercises"("programId", "orderIndex")
WHERE "removedAt" IS NULL;

-- CreateIndex
CREATE INDEX "workout_sessions_programId_idx" ON "workout_sessions"("programId");

-- CreateIndex
CREATE INDEX "workout_sessions_studentId_idx" ON "workout_sessions"("studentId");

-- CreateIndex
CREATE INDEX "workout_sessions_studentId_status_idx" ON "workout_sessions"("studentId", "status");

-- One IN_PROGRESS session per student+program
CREATE UNIQUE INDEX "workout_sessions_one_in_progress_per_student_program"
ON "workout_sessions"("studentId", "programId")
WHERE "status" = 'IN_PROGRESS';

-- CreateIndex
CREATE UNIQUE INDEX "session_exercise_logs_sessionId_programExerciseId_key" ON "session_exercise_logs"("sessionId", "programExerciseId");

-- CreateIndex
CREATE INDEX "session_exercise_logs_sessionId_idx" ON "session_exercise_logs"("sessionId");

-- CreateIndex
CREATE INDEX "session_exercise_logs_programExerciseId_idx" ON "session_exercise_logs"("programExerciseId");

-- CreateIndex
CREATE INDEX "clinical_notes_studentId_createdAt_idx" ON "clinical_notes"("studentId", "createdAt");

-- CreateIndex
CREATE INDEX "clinical_notes_professionalId_idx" ON "clinical_notes"("professionalId");

-- AddForeignKey
ALTER TABLE "programs" ADD CONSTRAINT "programs_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_exercises" ADD CONSTRAINT "program_exercises_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_exercise_logs" ADD CONSTRAINT "session_exercise_logs_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "workout_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_exercise_logs" ADD CONSTRAINT "session_exercise_logs_programExerciseId_fkey" FOREIGN KEY ("programExerciseId") REFERENCES "program_exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_notes" ADD CONSTRAINT "clinical_notes_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_notes" ADD CONSTRAINT "clinical_notes_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
