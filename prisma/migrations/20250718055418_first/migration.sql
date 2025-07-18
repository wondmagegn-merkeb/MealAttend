-- CreateTable
CREATE TABLE "AppSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "siteName" TEXT NOT NULL DEFAULT 'MealAttend',
    "idPrefix" TEXT NOT NULL DEFAULT 'ADERA',
    "schoolName" TEXT NOT NULL DEFAULT 'Tech University',
    "idCardTitle" TEXT NOT NULL DEFAULT 'STUDENT ID',
    "colorTheme" TEXT NOT NULL DEFAULT 'default',
    "showHomepage" BOOLEAN NOT NULL DEFAULT true,
    "showTeamSection" BOOLEAN NOT NULL DEFAULT true,
    "companyLogoUrl" TEXT,
    "idCardLogoUrl" TEXT,
    "defaultUserPassword" TEXT,
    "defaultAdminPassword" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "position" TEXT,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "passwordChangeRequired" BOOLEAN NOT NULL DEFAULT true,
    "profileImageURL" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "passwordResetToken" TEXT,
    "passwordResetExpires" TIMESTAMP(3),
    "createdById" TEXT,
    "canReadStudents" BOOLEAN NOT NULL DEFAULT false,
    "canWriteStudents" BOOLEAN NOT NULL DEFAULT false,
    "canCreateStudents" BOOLEAN NOT NULL DEFAULT false,
    "canDeleteStudents" BOOLEAN NOT NULL DEFAULT false,
    "canExportStudents" BOOLEAN NOT NULL DEFAULT false,
    "canReadAttendance" BOOLEAN NOT NULL DEFAULT false,
    "canExportAttendance" BOOLEAN NOT NULL DEFAULT false,
    "canReadActivityLog" BOOLEAN NOT NULL DEFAULT false,
    "canReadUsers" BOOLEAN NOT NULL DEFAULT false,
    "canWriteUsers" BOOLEAN NOT NULL DEFAULT false,
    "canReadDepartments" BOOLEAN NOT NULL DEFAULT false,
    "canWriteDepartments" BOOLEAN NOT NULL DEFAULT false,
    "canScanId" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gender" TEXT,
    "classGrade" TEXT,
    "profileImageURL" TEXT,
    "qrCodeData" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" TEXT NOT NULL,
    "attendanceId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "mealType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "recordDate" DATE NOT NULL,
    "scannedAtTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scannedById" TEXT,

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

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
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isCeo" BOOLEAN NOT NULL DEFAULT false,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdCounter" (
    "type" TEXT NOT NULL,
    "count" INTEGER NOT NULL,

    CONSTRAINT "IdCounter_pkey" PRIMARY KEY ("type")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_userId_key" ON "User"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_passwordResetToken_key" ON "User"("passwordResetToken");

-- CreateIndex
CREATE UNIQUE INDEX "Student_studentId_key" ON "Student"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_qrCodeData_key" ON "Student"("qrCodeData");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_attendanceId_key" ON "AttendanceRecord"("attendanceId");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_studentId_mealType_recordDate_key" ON "AttendanceRecord"("studentId", "mealType", "recordDate");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityLog_logId_key" ON "ActivityLog"("logId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_scannedById_fkey" FOREIGN KEY ("scannedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
