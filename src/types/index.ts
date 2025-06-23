
export interface Department {
  id: string;
  name: string;
}

export interface User {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  role: 'Admin' | 'User';
  departmentId: string | null;
  passwordChangeRequired: boolean;
  profileImageURL: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserWithDepartment extends User {
  department: Department | null;
}

export interface Student {
  id: string;
  studentId: string;
  name: string;
  gender: 'Male' | 'Female' | 'Other' | '' | null;
  classGrade: string | null;
  profileImageURL: string | null;
  qrCodeData: string | null;
  createdAt: string;
  updatedAt: string;
}

export type MealType = "BREAKFAST" | "LUNCH" | "DINNER";

export interface AttendanceRecord {
    id: string;
    studentId: string;
    mealType: MealType;
    status: 'PRESENT' | 'ABSENT';
    recordDate: string;
    scannedAtTimestamp: string;
    student: Student;
}

export interface AttendanceRecordWithStudent extends AttendanceRecord {
    student: Student;
}

export interface UserActivityLog {
    id: string;
    userIdentifier: string;
    action: string;
    details: string | null;
    activityTimestamp: string;
}
