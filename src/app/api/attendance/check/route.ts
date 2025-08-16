
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { startOfDay } from 'date-fns';
import type { MealType } from '@/types';

// Handle a manual student ID check
export async function POST(request: Request) {
  try {
    const { studentId, mealType } = await request.json();

    if (!studentId || !mealType) {
      return NextResponse.json({ message: 'Missing studentId or mealType' }, { status: 400 });
    }

    const student = await prisma.student.findUnique({
        where: { studentId: studentId },
    });

    if (!student) {
        return NextResponse.json({ success: false, message: 'Student not found.' }, { status: 404 });
    }
    
    const today = startOfDay(new Date());

    const existingRecord = await prisma.attendanceRecord.findFirst({
        where: {
            studentId: student.id,
            mealType: mealType,
            recordDate: today,
        }
    });
    
    if (existingRecord) {
        return NextResponse.json({
            success: true,
            type: 'already_recorded',
            message: `${student.name} has already been recorded for this meal today.`,
            student: student,
            record: existingRecord,
        });
    } else {
         return NextResponse.json({
            success: true,
            type: 'info',
            message: `${student.name} has not yet been recorded for this meal.`,
            student: student,
        });
    }

  } catch (error: any) {
    console.error("Failed to check attendance:", error);
    return NextResponse.json(
      { success: false, message: 'A database error occurred while checking attendance.', error: error.message },
      { status: 500 }
    );
  }
}
