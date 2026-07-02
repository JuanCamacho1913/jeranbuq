-- Rename durationMinutes → durationMin on services
ALTER TABLE "services" RENAME COLUMN "durationMinutes" TO "durationMin";

-- Rename isActive → active on services
ALTER TABLE "services" RENAME COLUMN "isActive" TO "active";

-- Rename isActive → active on admin_availability
ALTER TABLE "admin_availability" RENAME COLUMN "isActive" TO "active";
