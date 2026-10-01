-- CreateTable
CREATE TABLE "TrialActivation" (
    "id" TEXT NOT NULL,
    "macAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrialActivation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrialActivation_macAddress_key" ON "TrialActivation"("macAddress");

-- CreateIndex
CREATE INDEX "TrialActivation_macAddress_idx" ON "TrialActivation"("macAddress");
