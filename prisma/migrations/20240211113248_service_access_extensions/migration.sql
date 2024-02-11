-- AlterTable
ALTER TABLE "serviceAccess" ADD COLUMN     "availableFrom" TIMESTAMP(3),
ADD COLUMN     "availableTo" TIMESTAMP(3),
ADD COLUMN     "customData" JSONB;
