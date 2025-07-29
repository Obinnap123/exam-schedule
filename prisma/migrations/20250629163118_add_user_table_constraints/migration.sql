/*
  Warnings:

  - The primary key for the `Chat` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `title` on the `Chat` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Chat` table. All the data in the column will be lost.
  - The primary key for the `ChatMessage` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Course` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `code` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `level` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `studentsCount` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Course` table. All the data in the column will be lost.
  - The primary key for the `Hall` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `name` on the `Hall` table. All the data in the column will be lost.
  - The primary key for the `Supervisor` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `fullName` on the `Supervisor` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Supervisor` table. All the data in the column will be lost.
  - The primary key for the `Timetable` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `date` on the `Timetable` table. All the data in the column will be lost.
  - You are about to drop the column `day` on the `Timetable` table. All the data in the column will be lost.
  - You are about to drop the column `groupedCourseCodes` on the `Timetable` table. All the data in the column will be lost.
  - You are about to drop the column `groupedHallNames` on the `Timetable` table. All the data in the column will be lost.
  - You are about to drop the column `timeSlot` on the `Timetable` table. All the data in the column will be lost.
  - You are about to drop the column `rememberToken` on the `User` table. All the data in the column will be lost.
  - The primary key for the `_SupervisorToTimetable` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[courseCode]` on the table `Course` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[hallName]` on the table `Hall` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `ChatMessage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `courseCode` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `courseTitle` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `courseUnit` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hallName` to the `Hall` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Hall` table without a default value. This is not possible if the table is not empty.
  - Made the column `capacity` on table `Hall` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `name` to the `Supervisor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Supervisor` table without a default value. This is not possible if the table is not empty.
  - Made the column `department` on table `Supervisor` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `examDate` to the `Timetable` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Timetable` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `startTime` on the `Timetable` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `endTime` on the `Timetable` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "ChatMessage" DROP CONSTRAINT "ChatMessage_chatId_fkey";

-- DropForeignKey
ALTER TABLE "Timetable" DROP CONSTRAINT "Timetable_courseId_fkey";

-- DropForeignKey
ALTER TABLE "Timetable" DROP CONSTRAINT "Timetable_hallId_fkey";

-- DropForeignKey
ALTER TABLE "_SupervisorToTimetable" DROP CONSTRAINT "_SupervisorToTimetable_A_fkey";

-- DropForeignKey
ALTER TABLE "_SupervisorToTimetable" DROP CONSTRAINT "_SupervisorToTimetable_B_fkey";

-- DropIndex
DROP INDEX "Course_code_key";

-- DropIndex
DROP INDEX "Hall_name_key";

-- AlterTable
ALTER TABLE "Chat" DROP CONSTRAINT "Chat_pkey",
DROP COLUMN "title",
DROP COLUMN "userId",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Chat_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Chat_id_seq";

-- AlterTable
ALTER TABLE "ChatMessage" DROP CONSTRAINT "ChatMessage_pkey",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "chatId" SET DATA TYPE TEXT,
ADD CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "ChatMessage_id_seq";

-- AlterTable
ALTER TABLE "Course" DROP CONSTRAINT "Course_pkey",
DROP COLUMN "code",
DROP COLUMN "level",
DROP COLUMN "studentsCount",
DROP COLUMN "title",
ADD COLUMN     "courseCode" TEXT NOT NULL,
ADD COLUMN     "courseTitle" TEXT NOT NULL,
ADD COLUMN     "courseUnit" INTEGER NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "groupedCode" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Course_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Course_id_seq";

-- AlterTable
ALTER TABLE "Hall" DROP CONSTRAINT "Hall_pkey",
DROP COLUMN "name",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "hallName" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "capacity" SET NOT NULL,
ADD CONSTRAINT "Hall_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Hall_id_seq";

-- AlterTable
ALTER TABLE "Supervisor" DROP CONSTRAINT "Supervisor_pkey",
DROP COLUMN "fullName",
DROP COLUMN "phone",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "department" SET NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Supervisor_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Supervisor_id_seq";

-- AlterTable
ALTER TABLE "Timetable" DROP CONSTRAINT "Timetable_pkey",
DROP COLUMN "date",
DROP COLUMN "day",
DROP COLUMN "groupedCourseCodes",
DROP COLUMN "groupedHallNames",
DROP COLUMN "timeSlot",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "examDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
DROP COLUMN "startTime",
ADD COLUMN     "startTime" TIMESTAMP(3) NOT NULL,
DROP COLUMN "endTime",
ADD COLUMN     "endTime" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "courseId" SET DATA TYPE TEXT,
ALTER COLUMN "hallId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Timetable_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Timetable_id_seq";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "rememberToken";

-- AlterTable
ALTER TABLE "_SupervisorToTimetable" DROP CONSTRAINT "_SupervisorToTimetable_AB_pkey",
ALTER COLUMN "A" SET DATA TYPE TEXT,
ALTER COLUMN "B" SET DATA TYPE TEXT,
ADD CONSTRAINT "_SupervisorToTimetable_AB_pkey" PRIMARY KEY ("A", "B");

-- CreateIndex
CREATE UNIQUE INDEX "Course_courseCode_key" ON "Course"("courseCode");

-- CreateIndex
CREATE UNIQUE INDEX "Hall_hallName_key" ON "Hall"("hallName");

-- AddForeignKey
ALTER TABLE "Timetable" ADD CONSTRAINT "Timetable_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Timetable" ADD CONSTRAINT "Timetable_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "Hall"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SupervisorToTimetable" ADD CONSTRAINT "_SupervisorToTimetable_A_fkey" FOREIGN KEY ("A") REFERENCES "Supervisor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SupervisorToTimetable" ADD CONSTRAINT "_SupervisorToTimetable_B_fkey" FOREIGN KEY ("B") REFERENCES "Timetable"("id") ON DELETE CASCADE ON UPDATE CASCADE;
