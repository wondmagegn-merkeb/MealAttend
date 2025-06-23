
import type { UserWithDepartment, Department, Student, AttendanceRecordWithStudent, UserActivityLog } from '@/types';
import { subDays, formatISO } from 'date-fns';

// =========== DEPARTMENTS ===========
export const mockDepartments: Department[] = [
  { id: 'dept_1', name: 'Kitchen Staff' },
  { id: 'dept_2', name: 'Administration' },
  { id: 'dept_3', name: 'Teaching Faculty' },
  { id: 'dept_4', name: 'Security' },
];

// =========== USERS ===========
export const mockUsers: UserWithDepartment[] = [
  {
    id: 'user_1',
    userId: 'ADERA/USR/2024/00001',
    fullName: 'Admin User',
    email: 'admin@example.com',
    role: 'Admin',
    status: 'Active',
    departmentId: 'dept_2',
    department: mockDepartments[1],
    passwordChangeRequired: false,
    profileImageURL: 'https://placehold.co/100x100.png',
    createdAt: subDays(new Date(), 10).toISOString(),
    updatedAt: subDays(new Date(), 1).toISOString(),
  },
  {
    id: 'user_2',
    userId: 'ADERA/USR/2024/00002',
    fullName: 'Normal User',
    email: 'user@example.com',
    role: 'User',
    status: 'Inactive',
    departmentId: 'dept_1',
    department: mockDepartments[0],
    passwordChangeRequired: false,
    profileImageURL: 'https://placehold.co/100x100.png',
    createdAt: subDays(new Date(), 20).toISOString(),
    updatedAt: subDays(new Date(), 5).toISOString(),
  },
  {
    id: 'user_3',
    userId: 'ADERA/USR/2024/00003',
    fullName: 'Jane Doe',
    email: 'jane.doe@example.com',
    role: 'User',
    status: 'Active',
    departmentId: 'dept_3',
    department: mockDepartments[2],
    passwordChangeRequired: true, // This user needs to change password
    profileImageURL: 'https://placehold.co/100x100.png',
    createdAt: subDays(new Date(), 5).toISOString(),
    updatedAt: subDays(new Date(), 2).toISOString(),
  },
];

// =========== STUDENTS ===========
export const mockStudents: Student[] = [
  {
    id: 'stu_1',
    studentId: 'ADERA/STU/2023/00101',
    name: 'Alice Johnson',
    gender: 'Female',
    classGrade: '11A',
    profileImageURL: 'https://placehold.co/120x120.png',
    qrCodeData: 'qr_alice_j_202300101',
    createdAt: subDays(new Date(), 150).toISOString(),
    updatedAt: subDays(new Date(), 10).toISOString(),
  },
  {
    id: 'stu_2',
    studentId: 'ADERA/STU/2024/00205',
    name: 'Bob Williams',
    gender: 'Male',
    classGrade: '10B',
    profileImageURL: 'https://placehold.co/120x120.png',
    qrCodeData: 'qr_bob_w_202400205',
    createdAt: subDays(new Date(), 30).toISOString(),
    updatedAt: subDays(new Date(), 3).toISOString(),
  },
  {
    id: 'stu_3',
    studentId: 'ADERA/STU/2023/00115',
    name: 'Charlie Brown',
    gender: 'Male',
    classGrade: '11A',
    profileImageURL: null,
    qrCodeData: 'qr_charlie_b_202300115',
    createdAt: subDays(new Date(), 140).toISOString(),
    updatedAt: subDays(new Date(), 20).toISOString(),
  },
];

// =========== ATTENDANCE RECORDS ===========
export const mockAttendanceRecords: AttendanceRecordWithStudent[] = [
  {
    id: 'att_1',
    studentId: 'ADERA/STU/2023/00101',
    student: mockStudents[0],
    mealType: 'LUNCH',
    status: 'PRESENT',
    recordDate: formatISO(new Date(), { representation: 'date' }) + 'T00:00:00.000Z',
    scannedAtTimestamp: new Date().toISOString(),
  },
  {
    id: 'att_2',
    studentId: 'ADERA/STU/2024/00205',
    student: mockStudents[1],
    mealType: 'LUNCH',
    status: 'PRESENT',
    recordDate: formatISO(new Date(), { representation: 'date' }) + 'T00:00:00.000Z',
    scannedAtTimestamp: new Date().toISOString(),
  },
  {
    id: 'att_3',
    studentId: 'ADERA/STU/2023/00101',
    student: mockStudents[0],
    mealType: 'BREAKFAST',
    status: 'PRESENT',
    recordDate: formatISO(subDays(new Date(), 1), { representation: 'date' }) + 'T00:00:00.000Z',
    scannedAtTimestamp: subDays(new Date(), 1).toISOString(),
  },
];

// =========== ACTIVITY LOGS ===========
export const mockActivityLogs: UserActivityLog[] = [
  {
    id: 'log_1',
    userIdentifier: 'ADERA/USR/2024/00001',
    action: 'LOGIN_SUCCESS',
    details: null,
    activityTimestamp: new Date().toISOString(),
  },
  {
    id: 'log_2',
    userIdentifier: 'ADERA/USR/2024/00002',
    action: 'ATTENDANCE_RECORD_SUCCESS',
    details: 'Student: Bob Williams, Meal: LUNCH',
    activityTimestamp: subDays(new Date(), 1).toISOString(),
  },
  {
    id: 'log_3',
    userIdentifier: 'ADERA/USR/2024/00001',
    action: 'STUDENT_CREATE_SUCCESS',
    details: 'Created student ID: ADERA/STU/2024/00205, Name: Bob Williams',
    activityTimestamp: subDays(new Date(), 2).toISOString(),
  },
];
