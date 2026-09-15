-- Patient session note + exercise video catalog

-- AlterTable: optional free-text note on completed sessions
ALTER TABLE "workout_sessions" ADD COLUMN "patientNote" TEXT;

-- CreateTable: curated exercise catalog
CREATE TABLE "exercise_catalog_items" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "namePt" TEXT NOT NULL,
    "categoryTags" TEXT[],
    "videoUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "durationSec" INTEGER,
    "cuesPt" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exercise_catalog_items_pkey" PRIMARY KEY ("id")
);

-- AlterTable: optional FK from program exercise → catalog
ALTER TABLE "program_exercises" ADD COLUMN "catalogItemId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "exercise_catalog_items_slug_key" ON "exercise_catalog_items"("slug");

-- CreateIndex
CREATE INDEX "exercise_catalog_items_active_idx" ON "exercise_catalog_items"("active");

-- CreateIndex
CREATE INDEX "program_exercises_catalogItemId_idx" ON "program_exercises"("catalogItemId");

-- AddForeignKey
ALTER TABLE "program_exercises" ADD CONSTRAINT "program_exercises_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "exercise_catalog_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
