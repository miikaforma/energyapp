-- CreateEnum
CREATE TYPE "accessType" AS ENUM ('WATTIVAHTI_CONSUMPTION', 'WATTIVAHTI_PRODUCTION', 'SOLARMAN', 'MELCLOUD');

-- CreateTable
CREATE TABLE "access" (
    "id" SERIAL NOT NULL,
    "accessId" TEXT NOT NULL,
    "type" "accessType" NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "access_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "access_accessId_idx" ON "access"("accessId");

-- AddForeignKey
ALTER TABLE "access" ADD CONSTRAINT "access_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
