
import { PrismaClient } from '@prisma/client';
import { subDays, formatISO } from 'date-fns';
import { hashSync } from 'bcryptjs';

const prisma = new PrismaClient();
const saltRounds = 10;

const departments = [
  { id: 'dept_1', departmentId: 'ADERA/DEP/2024/00001', name: 'Kitchen Staff' },
  { id: 'dept_2', departmentId: 'ADERA/DEP/2024/00002', name: 'Administration' },
  { id: 'dept_3', departmentId: 'ADERA/DEP/2024/00003', name: 'Teaching Faculty' },
  { id: 'dept_4', departmentId: 'ADERA/DEP/2024/00004', name: 'Security' },
];

const users = [
  {
    id: 'user_super_admin',
    userId: 'ADERA/USR/2024/00001',
    fullName: 'Super Admin',
    email: 'superadmin@example.com',
    password: hashSync('password123', saltRounds),
    role: 'Super Admin',
    status: 'Active',
    departmentId: 'dept_2',
    passwordChangeRequired: false,
    profileImageURL: 'https://placehold.co/100x100.png',
    createdAt: subDays(new Date(), 30),
    updatedAt: subDays(new Date(), 1),
    createdById: null,
    // Super Admin has all permissions implicitly
    canReadStudents: true, canWriteStudents: true, canCreateStudents: true, canDeleteStudents: true, canExportStudents: true,
    canReadAttendance: true, canExportAttendance: true,
    canReadActivityLog: true,
    canReadUsers: true, canWriteUsers: true,
    canReadDepartments: true, canWriteDepartments: true,
  },
  {
    id: 'user_admin',
    userId: 'ADERA/USR/2024/00002',
    fullName: 'Admin User',
    email: 'admin@example.com',
    password: hashSync('password123', saltRounds),
    role: 'Admin',
    status: 'Active',
    departmentId: 'dept_2',
    passwordChangeRequired: false,
    profileImageURL: 'https://placehold.co/100x100.png',
    createdAt: subDays(new Date(), 10),
    updatedAt: subDays(new Date(), 1),
    createdById: 'user_super_admin',
    // Admin has all permissions for this demo
    canReadStudents: true, canWriteStudents: true, canCreateStudents: true, canDeleteStudents: true, canExportStudents: true,
    canReadAttendance: true, canExportAttendance: true,
    canReadActivityLog: true,
    canReadUsers: true, canWriteUsers: true,
    canReadDepartments: true, canWriteDepartments: true,
  },
  {
    id: 'user_normal',
    userId: 'ADERA/USR/2024/00003',
    fullName: 'Normal User',
    email: 'user@example.com',
    password: hashSync('password123', saltRounds),
    role: 'User',
    status: 'Inactive',
    departmentId: 'dept_1',
    passwordChangeRequired: false,
    profileImageURL: 'https://placehold.co/100x100.png',
    createdAt: subDays(new Date(), 20),
    updatedAt: subDays(new Date(), 5),
    createdById: 'user_admin',
    // Standard user has student permissions but no others
    canReadStudents: true, canWriteStudents: true, canCreateStudents: true, canDeleteStudents: true, canExportStudents: true,
    canReadAttendance: false, canExportAttendance: false,
    canReadActivityLog: false,
    canReadUsers: false, canWriteUsers: false,
    canReadDepartments: false, canWriteDepartments: false,
  },
  {
    id: 'user_password_change',
    userId: 'ADERA/USR/2024/00004',
    fullName: 'Jane Doe',
    email: 'jane.doe@example.com',
    password: hashSync('password', saltRounds), // Password for user that needs to change it
    role: 'User',
    status: 'Active',
    departmentId: 'dept_3',
    passwordChangeRequired: true,
    profileImageURL: 'https://placehold.co/100x100.png',
    createdAt: subDays(new Date(), 5),
    updatedAt: subDays(new Date(), 2),
    createdById: 'user_admin',
    // This user only has create/read access to students
    canReadStudents: true, canWriteStudents: false, canCreateStudents: true, canDeleteStudents: false, canExportStudents: false,
    canReadAttendance: false, canExportAttendance: false,
    canReadActivityLog: false,
    canReadUsers: false, canWriteUsers: false,
    canReadDepartments: false, canWriteDepartments: false,
  },
];

const students = [
  {
    id: 'stu_1',
    studentId: 'ADERA/STU/2023/00101',
    name: 'Alice Johnson',
    gender: 'Female',
    classGrade: '11A',
    profileImageURL: 'https://placehold.co/120x120.png',
    qrCodeData: 'qr_alice_j_202300101',
    createdAt: subDays(new Date(), 150),
    updatedAt: subDays(new Date(), 10),
    createdById: 'user_admin',
  },
  {
    id: 'stu_2',
    studentId: 'ADERA/STU/2024/00205',
    name: 'Bob Williams',
    gender: 'Male',
    classGrade: '10B',
    profileImageURL: 'https://placehold.co/120x120.png',
    qrCodeData: 'qr_bob_w_202400205',
    createdAt: subDays(new Date(), 30),
    updatedAt: subDays(new Date(), 3),
    createdById: 'user_normal',
  },
   {
    id: 'stu_3',
    studentId: 'ADERA/STU/2023/00115',
    name: 'Charlie Brown',
    gender: 'Male',
    classGrade: '11A',
    profileImageURL: null,
    qrCodeData: 'qr_charlie_b_202300115',
    createdAt: subDays(new Date(), 140),
    updatedAt: subDays(new Date(), 20),
    createdById: 'user_admin',
  },
];

const attendanceRecords = [
   {
    id: 'att_1',
    attendanceId: 'ADERA/ATT/2024/00001',
    studentId: 'stu_1',
    scannedById: 'user_admin',
    mealType: 'LUNCH',
    status: 'PRESENT',
    recordDate: new Date(formatISO(new Date(), { representation: 'date' }) + 'T00:00:00.000Z'),
    scannedAtTimestamp: new Date(),
  },
  {
    id: 'att_2',
    attendanceId: 'ADERA/ATT/2024/00002',
    studentId: 'stu_2',
    scannedById: 'user_normal',
    mealType: 'LUNCH',
    status: 'PRESENT',
    recordDate: new Date(formatISO(new Date(), { representation: 'date' }) + 'T00:00:00.000Z'),
    scannedAtTimestamp: new Date(),
  },
  {
    id: 'att_3',
    attendanceId: 'ADERA/ATT/2024/00003',
    studentId: 'stu_1',
    scannedById: 'user_admin',
    mealType: 'BREAKFAST',
    status: 'PRESENT',
    recordDate: new Date(formatISO(subDays(new Date(), 1), { representation: 'date' }) + 'T00:00:00.000Z'),
    scannedAtTimestamp: subDays(new Date(), 1),
  },
];

const activityLogs = [
  {
    id: 'log_1',
    logId: 'ADERA/LOG/2024/00001',
    userIdentifier: 'ADERA/USR/2024/00002',
    userId: 'user_admin',
    action: 'LOGIN_SUCCESS',
    details: null,
    activityTimestamp: new Date(),
  },
  {
    id: 'log_2',
    logId: 'ADERA/LOG/2024/00002',
    userIdentifier: 'ADERA/USR/2024/00003',
    action: 'ATTENDANCE_RECORD_SUCCESS',
    details: 'Student: Bob Williams, Meal: LUNCH',
    activityTimestamp: subDays(new Date(), 1),
  },
  {
    id: 'log_3',
    logId: 'ADERA/LOG/2024/00003',
    userIdentifier: 'ADERA/USR/2024/00002',
    userId: 'user_admin',
    action: 'STUDENT_CREATE_SUCCESS',
    details: 'Created student ID: ADERA/STU/2024/00205, Name: Bob Williams',
    activityTimestamp: subDays(new Date(), 2),
  },
];


async function main() {
  console.log('Start seeding...');

  // Seed Departments
  for (const dept of departments) {
    await prisma.department.upsert({
      where: { id: dept.id },
      update: {},
      create: dept,
    });
  }
  console.log('Seeded departments.');

  // Seed Users
  for (const user of users) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: user,
    });
  }
  console.log('Seeded users.');

  // Seed Students
  for (const student of students) {
    await prisma.student.upsert({
      where: { id: student.id },
      update: {},
      create: student,
    });
  }
  console.log('Seeded students.');
  
  // Seed Attendance Records
  for (const record of attendanceRecords) {
    await prisma.attendanceRecord.upsert({
      where: { id: record.id },
      update: {},
      create: record,
    });
  }
  console.log('Seeded attendance records.');

  // Seed Activity Logs
  for (const log of activityLogs) {
    await prisma.activityLog.upsert({
      where: { id: log.id },
      update: {},
      create: log,
    });
  }
  console.log('Seeded activity logs.');
  
  // Seed Site Settings
  await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      showFeaturesSection: true,
      showTeamSection: true,
    }
  });
  console.log('Seeded site settings.');

  // Seed ID Counters to prevent ID conflicts with generator
  await prisma.idCounter.upsert({ where: { type: 'DEPARTMENT' }, update: { count: 4 }, create: { type: 'DEPARTMENT', count: 4 } });
  await prisma.idCounter.upsert({ where: { type: 'USER' }, update: { count: 4 }, create: { type: 'USER', count: 4 } });
  await prisma.idCounter.upsert({ where: { type: 'STUDENT' }, update: { count: 205 }, create: { type: 'STUDENT', count: 205 } });
  await prisma.idCounter.upsert({ where: { type: 'ATTENDANCE' }, update: { count: 3 }, create: { type: 'ATTENDANCE', count: 3 } });
  await prisma.idCounter.upsert({ where: { type: 'ACTIVITY_LOG' }, update: { count: 3 }, create: { type: 'ACTIVITY_LOG', count: 3 } });
  console.log('Seeded ID counters.');

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
