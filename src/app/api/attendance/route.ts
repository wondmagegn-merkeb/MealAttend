
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import type { AttendanceRecord, MealType, AttendanceStatus } from '@prisma/client';

// GET /api/attendance - Fetch all attendance records
export async function GET(request: NextRequest) {
  try {
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        student: true, // Include student details
      },
    });
    return NextResponse.json(attendanceRecords, { status: 200 });
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    return NextResponse.json({ message: 'Failed to fetch attendance records', error: (error as Error).message }, { status: 500 });
  }
}

// POST /api/attendance - Create a new attendance record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Partial<Omit<AttendanceRecord, 'id' | 'createdAt' | 'updatedAt'>>;
    const { studentInternalId, recordDate, mealType, scannedAtTimestamp, status } = body;

    if (!studentInternalId || !recordDate || !mealType || !status) {
      return NextResponse.json({ message: 'Missing required fields: studentInternalId, recordDate, mealType, and status are required.' }, { status: 400 });
    }
    
    // Ensure recordDate is treated as a date without time for unique constraint logic
    const dateOnly = new Date(recordDate);
    dateOnly.setUTCHours(0, 0, 0, 0);


    const newAttendanceRecord = await prisma.attendanceRecord.create({
      data: {
        studentInternalId,
        recordDate: dateOnly, // Use the date-only version
        mealType: mealType as MealType,
        scannedAtTimestamp: scannedAtTimestamp ? new Date(scannedAtTimestamp) : null,
        status: status as AttendanceStatus,
      },
      include: { student: true },
    });
    return NextResponse.json(newAttendanceRecord, { status: 201 });
  } catch (error) {
    console.error('Error creating attendance record:', error);
    if ((error as any).code === 'P2002' && (error as any).meta?.target?.includes('unique_attendance_constraint')) {
        return NextResponse.json({ message: 'Attendance record for this student, date, and meal type already exists.' }, { status: 409 });
    }
    if ((error as any).code === 'P2003') { // Foreign key constraint failed
        return NextResponse.json({ message: `Student with ID '${studentInternalId}' not found.` }, { status: 404 });
    }
    return NextResponse.json({ message: 'Failed to create attendance record', error: (error as Error).message }, { status: 500 });
  }
}
