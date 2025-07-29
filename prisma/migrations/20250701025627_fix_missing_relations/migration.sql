/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Timetable` table. All the data in the column will be lost.
  - You are about to drop the column `data` on the `Timetable` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Timetable` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Timetable` table. All the data in the column will be lost.
  - You are about to drop the column `supervisors` on the `Timetable` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Timetable` table. All the data in the column will be lost.
  - Added the required column `date` to the `Timetable` table without a default value. This is not possible if the table is not empty.
  - Added the required column `day` to the `Timetable` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endTime` to the `Timetable` table without a default value. This is not possible if the table is not empty.
  - Added the required column `groupedCourseCodes` to the `Timetable` table without a default value. This is not possible if the table is not empty.
  - Added the required column `groupedHallNames` to the `Timetable` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startTime` to the `Timetable` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timeSlot` to the `Timetable` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Timetable" DROP COLUMN "createdAt",
DROP COLUMN "data",
DROP COLUMN "name",
DROP COLUMN "status",
DROP COLUMN "supervisors",
DROP COLUMN "updatedAt",
ADD COLUMN     "courseCodeId" INTEGER,
ADD COLUMN     "date" TEXT NOT NULL,
ADD COLUMN     "day" TEXT NOT NULL,
ADD COLUMN     "endTime" TEXT NOT NULL,
ADD COLUMN     "groupedCourseCodes" TEXT NOT NULL,
ADD COLUMN     "groupedHallNames" TEXT NOT NULL,
ADD COLUMN     "hallId" INTEGER,
ADD COLUMN     "startTime" TEXT NOT NULL,
ADD COLUMN     "timeSlot" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "_TimetableSupervisors" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_TimetableSupervisors_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_TimetableSupervisors_B_index" ON "_TimetableSupervisors"("B");

-- AddForeignKey
ALTER TABLE "Timetable" ADD CONSTRAINT "Timetable_courseCodeId_fkey" FOREIGN KEY ("courseCodeId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Timetable" ADD CONSTRAINT "Timetable_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "Hall"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TimetableSupervisors" ADD CONSTRAINT "_TimetableSupervisors_A_fkey" FOREIGN KEY ("A") REFERENCES "Supervisor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TimetableSupervisors" ADD CONSTRAINT "_TimetableSupervisors_B_fkey" FOREIGN KEY ("B") REFERENCES "Timetable"("id") ON DELETE CASCADE ON UPDATE CASCADE;
