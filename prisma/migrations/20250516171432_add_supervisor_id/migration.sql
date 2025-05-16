/*
  Warnings:

  - The primary key for the `Supervisor` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Supervisor` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `courseCode` on the `Timetable` table. All the data in the column will be lost.
  - You are about to drop the column `hallName` on the `Timetable` table. All the data in the column will be lost.
  - You are about to drop the column `studentsCount` on the `Timetable` table. All the data in the column will be lost.
  - You are about to drop the column `supervisors` on the `Timetable` table. All the data in the column will be lost.
  - Added the required column `courseId` to the `Timetable` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hallId` to the `Timetable` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Hall" ALTER COLUMN "capacity" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Supervisor" DROP CONSTRAINT "Supervisor_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Supervisor_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Timetable" DROP COLUMN "courseCode",
DROP COLUMN "hallName",
DROP COLUMN "studentsCount",
DROP COLUMN "supervisors",
ADD COLUMN     "courseId" INTEGER NOT NULL,
ADD COLUMN     "hallId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "_SupervisorToTimetable" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_SupervisorToTimetable_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_SupervisorToTimetable_B_index" ON "_SupervisorToTimetable"("B");

-- AddForeignKey
ALTER TABLE "Timetable" ADD CONSTRAINT "Timetable_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Timetable" ADD CONSTRAINT "Timetable_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "Hall"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SupervisorToTimetable" ADD CONSTRAINT "_SupervisorToTimetable_A_fkey" FOREIGN KEY ("A") REFERENCES "Supervisor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SupervisorToTimetable" ADD CONSTRAINT "_SupervisorToTimetable_B_fkey" FOREIGN KEY ("B") REFERENCES "Timetable"("id") ON DELETE CASCADE ON UPDATE CASCADE;
