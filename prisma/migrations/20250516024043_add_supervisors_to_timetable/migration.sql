/*
  Warnings:

  - You are about to drop the column `courseTitle` on the `Timetable` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Timetable" DROP COLUMN "courseTitle",
ADD COLUMN     "supervisors" TEXT[];
