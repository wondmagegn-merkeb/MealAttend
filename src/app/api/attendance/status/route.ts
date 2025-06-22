
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import type { MealType } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const mealType = searchParams.get('mealType');

    if (!studentId || !mealType) {
      return NextResponse.json({ message: 'studentId and mealType are required.' }, { status: 400 });
    }

    const student = await prisma.student.findUnique({
      where: { studentId },
    });

    if (!student) {
      return NextResponse.json({ message: `Student with ID '${studentId}' not found.` }, { status: 404 });
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const attendanceRecord = await prisma.attendanceRecord.findFirst({
      where: {
        studentInternalId: student.id,
        recordDate: today,
        mealType: mealType as MealType,
      },
    });

    return NextResponse.json({ student, attendanceRecord }, { status: 200 });

  } catch (error) {
    console.error('Error in status check API:', error);
    return NextResponse.json({ message: 'Failed to check attendance status', error: (error as Error).message }, { status: 500 });
  }
}
