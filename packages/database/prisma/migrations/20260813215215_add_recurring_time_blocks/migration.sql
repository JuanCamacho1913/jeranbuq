-- CreateTable
CREATE TABLE "recurring_time_blocks" (
    "id" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "reason" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recurring_time_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recurring_time_blocks_dayOfWeek_active_idx" ON "recurring_time_blocks"("dayOfWeek", "active");

-- AddForeignKey
ALTER TABLE "recurring_time_blocks" ADD CONSTRAINT "recurring_time_blocks_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
