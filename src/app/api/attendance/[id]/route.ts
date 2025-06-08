
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import type { AttendanceRecord, MealType, AttendanceStatus } from '@prisma/client';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/attendance/[id] - Fetch a single attendance record by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  try {
    const attendanceRecord = await prisma.attendanceRecord.findUnique({
      where: { id },
      include: { student: true },
    });
    if (!attendanceRecord) {
      return NextResponse.json({ message: 'Attendance record not found' }, { status: 404 });
    }
    return NextResponse.json(attendanceRecord, { status: 200 });
  } catch (error) {
    console.error(`Error fetching attendance record with id ${id}:`, error);
    return NextResponse.json({ message: 'Failed to fetch attendance record', error: (error as Error).message }, { status: 500 });
  }
}

// PUT /api/attendance/[id] - Update an attendance record by ID
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  try {
    const body = await request.json() as Partial<Omit<AttendanceRecord, 'id' | 'createdAt' | 'updatedAt'>>;
    const { studentInternalId, recordDate, mealType, scannedAtTimestamp, status } = body;

    // Ensure recordDate is treated as a date without time for unique constraint logic
    let dateOnly;
    if (recordDate) {
        dateOnly = new Date(recordDate);
        dateOnly.setUTCHours(0,0,0,0);
    }
    
    const updatedAttendanceRecord = await prisma.attendanceRecord.update({
      where: { id },
      data: {
        studentInternalId,
        recordDate: dateOnly,
        mealType: mealType as MealType,
        scannedAtTimestamp: scannedAtTimestamp ? new Date(scannedAtTimestamp) : (scannedAtTimestamp === null ? null : undefined), // handle explicit null
        status: status as AttendanceStatus,
      },
      include: { student: true },
    });
    return NextResponse.json(updatedAttendanceRecord, { status: 200 });
  } catch (error) {
    console.error(`Error updating attendance record with id ${id}:`, error);
    if ((error as any).code === 'P2025') {
        return NextResponse.json({ message: 'Attendance record not found for update' }, { status: 404 });
    }
    if ((error as any).code === 'P2002' && (error as any).meta?.target?.includes('unique_attendance_constraint')) {
        return NextResponse.json({ message: 'Attendance record for this student, date, and meal type already exists.' }, { status: 409 });
    }
    if ((error as any).code === 'P2003') { // Foreign key constraint failed
        return NextResponse.json({ message: `Student with ID '${(error as any).meta?.field_name?.includes('studentInternalId') ? body.studentInternalId : 'unknown'}' not found.` }, { status: 404 });
    }
    return NextResponse.json({ message: 'Failed to update attendance record', error: (error as Error).message }, { status: 500 });
  }
}

// DELETE /api/attendance/[id] - Delete an attendance record by ID
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  try {
    await prisma.attendanceRecord.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Attendance record deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting attendance record with id ${id}:`, error);
     if ((error as any).code === 'P2025') {
        return NextResponse.json({ message: 'Attendance record not found for deletion' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Failed to delete attendance record', error: (error as Error).message }, { status: 500 });
  }
}
