
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateNextId } from '@/lib/idGenerator';
import { startOfDay } from 'date-fns';
import type { MealType } from '@/types';

export const dynamic = 'force-dynamic';

// Handle a QR code scan and record attendance
export async function POST(request: Request) {
  try {
    const { qrCodeData, mealType } = await request.json();

    if (!qrCodeData || !mealType) {
      return NextResponse.json({ message: 'Missing qrCodeData or mealType' }, { status: 400 });
    }

    const student = await prisma.student.findFirst({
        where: { qrCodeData: qrCodeData },
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
            message: `Already recorded for ${mealType}.`,
            student: student,
            record: existingRecord,
        });
    }

    const newRecordId = await generateNextId('ATTENDANCE');
    const newRecord = await prisma.attendanceRecord.create({
        data: {
            id: newRecordId,
            studentId: student.id,
            mealType: mealType,
            status: 'PRESENT',
            recordDate: today,
            scannedAtTimestamp: new Date(),
        }
    });

    return NextResponse.json({
        success: true,
        type: 'success',
        message: `Successfully recorded attendance for ${student.name}.`,
        student: student,
        record: newRecord,
    }, { status: 201 });

  } catch (error: any) {
    console.error("Failed to record attendance via scan:", error);
    return NextResponse.json(
      { success: false, message: 'A database error occurred while recording attendance.', error: error.message },
      { status: 500 }
    );
  }
}
