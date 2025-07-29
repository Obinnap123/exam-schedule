/*
  Warnings:

  - The primary key for the `Chat` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Chat` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `ChatMessage` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `ChatMessage` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Course` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `courseCode` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `courseTitle` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `courseUnit` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `department` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `groupedCode` on the `Course` table. All the data in the column will be lost.
  - The `id` column on the `Course` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Hall` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `hallName` on the `Hall` table. All the data in the column will be lost.
  - The `id` column on the `Hall` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Supervisor` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `department` on the `Supervisor` table. All the data in the column will be lost.
  - The `id` column on the `Supervisor` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Timetable` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `courseId` on the `Timetable` table. All the data in the column will be lost.
  - You are about to drop the column `endTime` on the `Timetable` table. All the data in the column will be lost.
  - You are about to drop the column `examDate` on the `Timetable` table. All the data in the column will be lost.
  - You are about to drop the column `hallId` on the `Timetable` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `Timetable` table. All the data in the column will be lost.
  - The `id` column on the `Timetable` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `_SupervisorToTimetable` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[code]` on the table `Course` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `Hall` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `chatId` on the `ChatMessage` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `code` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `duration` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `students` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Hall` table without a default value. This is not possible if the table is not empty.
  - Added the required column `data` to the `Timetable` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Timetable` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `Timetable` table without a default value. This is not possible if the table is not empty.

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
DROP INDEX "Course_courseCode_key";

-- DropIndex
DROP INDEX "Hall_hallName_key";

-- AlterTable
ALTER TABLE "Chat" DROP CONSTRAINT "Chat_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Chat_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "ChatMessage" DROP CONSTRAINT "ChatMessage_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "chatId",
ADD COLUMN     "chatId" INTEGER NOT NULL,
ADD CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Course" DROP CONSTRAINT "Course_pkey",
DROP COLUMN "courseCode",
DROP COLUMN "courseTitle",
DROP COLUMN "courseUnit",
DROP COLUMN "department",
DROP COLUMN "groupedCode",
ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "duration" INTEGER NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "students" INTEGER NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Course_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Hall" DROP CONSTRAINT "Hall_pkey",
DROP COLUMN "hallName",
ADD COLUMN     "name" TEXT NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Hall_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Supervisor" DROP CONSTRAINT "Supervisor_pkey",
DROP COLUMN "department",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Supervisor_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Timetable" DROP CONSTRAINT "Timetable_pkey",
DROP COLUMN "courseId",
DROP COLUMN "endTime",
DROP COLUMN "examDate",
DROP COLUMN "hallId",
DROP COLUMN "startTime",
ADD COLUMN     "data" JSONB NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL,
ADD COLUMN     "supervisors" JSONB,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Timetable_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "_SupervisorToTimetable";

-- CreateIndex
CREATE UNIQUE INDEX "Course_code_key" ON "Course"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Hall_name_key" ON "Hall"("name");

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
