/*
  Warnings:

  - You are about to drop the column `serviceAccessId` on the `userAccess` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "userAccess" DROP CONSTRAINT "userAccess_serviceAccessId_fkey";

-- AlterTable
ALTER TABLE "userAccess" DROP COLUMN "serviceAccessId";

-- AddForeignKey
ALTER TABLE "userAccess" ADD CONSTRAINT "userAccess_accessId_fkey" FOREIGN KEY ("accessId") REFERENCES "serviceAccess"("accessId") ON DELETE RESTRICT ON UPDATE CASCADE;
