
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
  role: 'Admin' | 'User';
  status: 'Active' | 'Inactive';
  departmentId: string | null;
  passwordChangeRequired: boolean;
  profileImageURL: string | null;
  createdAt: string;
  updatedAt: string;
  passwordResetToken?: string | null;
  passwordResetExpires?: string | null;
}

export interface UserWithDepartment extends User {
  department: Department | null;
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
