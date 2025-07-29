/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Supervisor` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Supervisor` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Supervisor` table. All the data in the column will be lost.
  - Added the required column `fullName` to the `Supervisor` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Supervisor" DROP COLUMN "createdAt",
DROP COLUMN "name",
DROP COLUMN "updatedAt",
ADD COLUMN     "department" TEXT,
ADD COLUMN     "fullName" TEXT NOT NULL,
ADD COLUMN     "phone" TEXT;
