/*
  Warnings:

  - You are about to drop the column `studentInternalId` on the `AttendanceRecord` table. All the data in the column will be lost.
  - You are about to drop the column `passwordHash` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `UserActivityLog` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[attendanceId]` on the table `AttendanceRecord` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[departmentId]` on the table `Department` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[passwordResetToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `attendanceId` to the `AttendanceRecord` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentId` to the `AttendanceRecord` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `mealType` on the `AttendanceRecord` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `status` on the `AttendanceRecord` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `departmentId` to the `Department` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `role` on the `User` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `status` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "AttendanceRecord" DROP CONSTRAINT "AttendanceRecord_studentInternalId_fkey";

-- DropIndex
DROP INDEX "AttendanceRecord_studentInternalId_recordDate_mealType_key";

-- DropIndex
DROP INDEX "Student_qrCodeData_key";

-- AlterTable
ALTER TABLE "AttendanceRecord" DROP COLUMN "studentInternalId",
ADD COLUMN     "attendanceId" TEXT NOT NULL,
ADD COLUMN     "studentId" TEXT NOT NULL,
DROP COLUMN "mealType",
ADD COLUMN     "mealType" TEXT NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Department" ADD COLUMN     "departmentId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "passwordHash",
ADD COLUMN     "password" TEXT NOT NULL,
ADD COLUMN     "passwordResetExpires" TIMESTAMP(3),
ADD COLUMN     "passwordResetToken" TEXT,
DROP COLUMN "role",
ADD COLUMN     "role" TEXT NOT NULL,
ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "status" DROP DEFAULT;

-- DropTable
DROP TABLE "UserActivityLog";

-- DropEnum
DROP TYPE "AttendanceStatus";

-- DropEnum
DROP TYPE "MealType";

-- DropEnum
DROP TYPE "UserRole";

-- DropEnum
DROP TYPE "UserStatus";

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "logId" TEXT NOT NULL,
    "userIdentifier" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "activityTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdCounter" (
    "type" TEXT NOT NULL,
    "count" INTEGER NOT NULL,

    CONSTRAINT "IdCounter_pkey" PRIMARY KEY ("type")
);

-- CreateIndex
CREATE UNIQUE INDEX "ActivityLog_logId_key" ON "ActivityLog"("logId");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_attendanceId_key" ON "AttendanceRecord"("attendanceId");

-- CreateIndex
CREATE UNIQUE INDEX "Department_departmentId_key" ON "Department"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "User_passwordResetToken_key" ON "User"("passwordResetToken");

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
