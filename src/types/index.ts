
import type { TeamMember as PrismaTeamMember, HomepageFeature as PrismaHomepageFeature, AppSettings as PrismaAppSettings } from '@prisma/client';

export interface Department {
  id: string;
  departmentId: string;
  name: string;
}

export interface User {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  position: string | null;
  role: 'Super Admin' | 'Admin' | 'User';
  status: 'Active' | 'Inactive';
  passwordChangeRequired: boolean;
  passwordResetRequested: boolean;
  profileImageURL: string | null;
  passwordResetToken?: string | null;
  passwordResetExpires?: string | null;
  createdById: string | null; // ID of the user who created this user
  
  // Permissions
  canReadDashboard: boolean;
  canScanId: boolean;
  canReadStudents: boolean;
  canWriteStudents: boolean;
  canCreateStudents: boolean;
  canDeleteStudents: boolean;
  canExportStudents: boolean;
  canReadAttendance: boolean;
  canExportAttendance: boolean;
  canReadActivityLog: boolean;
  canReadUsers: boolean;
  canWriteUsers: boolean;
  canReadDepartments: boolean;
  canWriteDepartments: boolean;
  canManageSiteSettings: boolean;
}

export interface UserWithCreator extends User {
  createdBy: {
    id: string;
    userId: string;
    fullName: string;
  } | null;
}

export interface Student {
  id: string;
  studentId: string;
  name: string;
  gender: 'Male' | 'Female' | null;
  classGrade: string | null;
  profileImageURL: string | null;
  qrCodeData: string | null;
  createdAt: string;
  updatedAt: string;
  createdById: string | null;
}

export interface StudentWithCreator extends Student {
  createdBy: {
    id: string;
    userId: string;
    fullName: string;
  } | null;
}

export type MealType = "BREAKFAST" | "LUNCH" | "DINNER";

export interface AttendanceRecord {
    id: string;
    attendanceId: string;
    studentId: string;
    mealType: MealType;
    status: 'PRESENT' | 'ABSENT';
    recordDate: string;
    scannedAtTimestamp: string | null;
    scannedById: string | null;
}

export interface AttendanceRecordWithStudent extends AttendanceRecord {
    student: Student;
    scannedBy: {
        id: string;
        userId: string;
        fullName: string;
    } | null;
}

export interface UserActivityLog {
    id:string;
    logId: string;
    userIdentifier: string;
    userId: string | null;
    action: string;
    details: string | null;
    activityTimestamp: string;
}

export type PermissionKey =
  | 'canReadDashboard'
  | 'canScanId'
  | 'canReadStudents'
  | 'canWriteStudents'
  | 'canCreateStudents'
  | 'canDeleteStudents'
  | 'canExportStudents'
  | 'canReadAttendance'
  | 'canExportAttendance'
  | 'canReadActivityLog'
  | 'canReadUsers'
  | 'canWriteUsers'
  | 'canReadDepartments'
  | 'canWriteDepartments'
  | 'canManageSiteSettings';

export type TeamMember = PrismaTeamMember;
export type HomepageFeature = PrismaHomepageFeature;
export type AppSettings = Omit<PrismaAppSettings, 'defaultUserPassword' | 'defaultAdminPassword' | 'defaultSuperAdminPassword'> & {
    defaultUserPassword?: string | null;
    defaultAdminPassword?: string | null;
    defaultSuperAdminPassword?: string | null;
};
