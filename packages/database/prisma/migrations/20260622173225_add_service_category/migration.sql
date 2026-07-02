-- CreateEnum
CREATE TYPE "ServiceCategory" AS ENUM ('HAIRCUT', 'COMBO', 'PREMIUM', 'VIP', 'COLORIMETRIA', 'KIDS');

-- AlterTable
ALTER TABLE "services" ADD COLUMN     "category" "ServiceCategory" NOT NULL DEFAULT 'HAIRCUT',
ADD COLUMN     "priceNote" TEXT;
