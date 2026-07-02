-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "cancellationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "appointments_startAt_status_idx" ON "appointments"("startAt", "status");

-- CreateIndex
CREATE INDEX "appointments_userId_status_idx" ON "appointments"("userId", "status");

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Enable btree_gist extension for EXCLUDE constraint support
-- NOTE: If btree_gist is unavailable on the hosting tier, this line will fail gracefully
-- and the application-level transaction in appointments.service.ts becomes the sole double-booking guard.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- EXCLUDE constraint: prevents overlapping active appointments at the DB level
-- Only PENDING and CONFIRMED appointments participate — CANCELLED/COMPLETED/NO_SHOW do not block slots.
ALTER TABLE "appointments" ADD CONSTRAINT "no_overlapping_active_appointments"
  EXCLUDE USING gist (
    tsrange("startAt", "endAt", '[)') WITH &&
  ) WHERE (status IN ('PENDING', 'CONFIRMED'));
