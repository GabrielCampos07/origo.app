-- CreateTable
CREATE TABLE "legal_acceptances" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "docVersion" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "legal_acceptances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "legal_acceptances_userId_idx" ON "legal_acceptances"("userId");

-- CreateIndex
CREATE INDEX "legal_acceptances_userId_acceptedAt_idx" ON "legal_acceptances"("userId", "acceptedAt");

-- CreateIndex
CREATE UNIQUE INDEX "legal_acceptances_userId_docVersion_key" ON "legal_acceptances"("userId", "docVersion");

-- AddForeignKey
ALTER TABLE "legal_acceptances" ADD CONSTRAINT "legal_acceptances_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
