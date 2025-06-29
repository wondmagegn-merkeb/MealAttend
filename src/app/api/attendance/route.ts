
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';

export const dynamic = 'force-dynamic';

// GET all attendance records, with optional filters
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const classGrade = searchParams.get('classGrade');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    const where: any = {};

    if (studentId) {
      where.student = { studentId: studentId };
    }
    if (classGrade) {
      where.student = { ...where.student, classGrade: classGrade };
    }
    if (fromDate) {
      where.recordDate = {
        ...where.recordDate,
        gte: startOfDay(new Date(fromDate)),
      };
    }
    if (toDate) {
      where.recordDate = {
        ...where.recordDate,
        lte: endOfDay(new Date(toDate)),
      };
    }

    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where,
      include: {
        student: true, // Include related student data
      },
      orderBy: {
        scannedAtTimestamp: 'desc',
      },
    });
    return NextResponse.json(attendanceRecords);
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Failed to fetch attendance records', error: error.message },
      { status: 500 }
    );
  }
}
