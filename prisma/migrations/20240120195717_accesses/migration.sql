/*
  Warnings:

  - You are about to drop the `post` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "accessType" AS ENUM ('WATTIVAHTI_CONSUMPTION', 'WATTIVAHTI_PRODUCTION', 'SOLARMAN', 'MELCLOUD');

-- DropForeignKey
ALTER TABLE "post" DROP CONSTRAINT "post_createdById_fkey";

-- DropTable
DROP TABLE "post";

-- CreateTable
CREATE TABLE "userAccess" (
    "id" SERIAL NOT NULL,
    "accessId" TEXT NOT NULL,
    "type" "accessType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "serviceAccessId" TEXT NOT NULL,

    CONSTRAINT "userAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "serviceAccess" (
    "id" SERIAL NOT NULL,
    "accessId" TEXT NOT NULL,
    "accessName" TEXT,
    "type" "accessType" NOT NULL,
    "email" TEXT,
    "password" TEXT,
    "token" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "refreshToken" TEXT,
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "serviceAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "userAccess_accessId_idx" ON "userAccess"("accessId");

-- CreateIndex
CREATE UNIQUE INDEX "serviceAccess_accessId_key" ON "serviceAccess"("accessId");

-- CreateIndex
CREATE INDEX "serviceAccess_accessId_idx" ON "serviceAccess"("accessId");

-- AddForeignKey
ALTER TABLE "userAccess" ADD CONSTRAINT "userAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "userAccess" ADD CONSTRAINT "userAccess_serviceAccessId_fkey" FOREIGN KEY ("serviceAccessId") REFERENCES "serviceAccess"("accessId") ON DELETE RESTRICT ON UPDATE CASCADE;
