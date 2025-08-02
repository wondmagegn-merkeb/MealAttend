
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateNextId } from '@/lib/idGenerator';
import { startOfDay } from 'date-fns';
import type { MealType } from '@/types';

// Handle a QR code scan and record attendance
export async function POST(request: Request) {
  try {
    const { qrCodeData, mealType, studentId: manualStudentId, scannerId } = await request.json(); // scannerId is the user's internal ID

    if (!mealType || (!qrCodeData && !manualStudentId)) {
      return NextResponse.json({ message: 'Missing identifier (qrCodeData or studentId) or mealType' }, { status: 400 });
    }
     if (!scannerId) {
      return NextResponse.json({ message: 'Missing scannerId (user ID)' }, { status: 400 });
    }
    
    let findCondition;
    if (qrCodeData) {
      findCondition = { qrCodeData: qrCodeData };
    } else {
      // Find student by their internal ID ('stu_...'), not the human-readable one.
      findCondition = { id: manualStudentId };
    }

    const student = await prisma.student.findFirst({
        where: findCondition,
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
        },
        include: {
            scannedBy: {
                select: {
                    fullName: true,
                    userId: true,
                }
            }
        }
    });
    
    if (existingRecord) {
        return NextResponse.json({
            success: true,
            type: 'already_recorded',
            message: `Already recorded by ${existingRecord.scannedBy?.fullName || 'N/A'}.`,
            student: student,
            record: existingRecord,
        });
    }

    const newAttendanceId = await generateNextId('ATTENDANCE');
    const newRecord = await prisma.attendanceRecord.create({
        data: {
            attendanceId: newAttendanceId,
            studentId: student.id,
            mealType: mealType,
            status: 'PRESENT',
            recordDate: today,
            scannedAtTimestamp: new Date(),
            scannedById: scannerId,
        },
        include: {
            scannedBy: {
                select: {
                    fullName: true,
                    userId: true,
                }
            }
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
