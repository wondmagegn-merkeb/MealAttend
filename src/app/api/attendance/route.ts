
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';
import { getAuthFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET all attendance records, with optional filters and role-based access control
export async function GET(request: Request) {
  try {
    const user = await getAuthFromRequest(request);
    if (!user) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentIdParam = searchParams.get('studentId');
    const classGrade = searchParams.get('classGrade');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    const where: any = {};

    // Role-based filtering for students
    if (user.role === 'Admin' || user.role === 'User') {
      const allowedStudents = await prisma.student.findMany({
        where: { createdById: user.id },
        select: { id: true },
      });
      const allowedStudentIds = allowedStudents.map(s => s.id);
      
      where.studentId = { in: allowedStudentIds };
    }
    
    // Apply additional filters from query params
    if (studentIdParam) {
      where.student = { ...where.student, studentId: studentIdParam };
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
        scannedBy: {
          select: {
            id: true,
            userId: true,
            fullName: true,
          }
        }
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
