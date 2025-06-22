
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { format } from 'date-fns';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { qrCodeData, mealType } = body;

    if (!qrCodeData || !mealType) {
      return NextResponse.json({ message: 'QR Code Data and Meal Type are required.' }, { status: 400 });
    }

    const student = await prisma.student.findFirst({
      where: {
        OR: [
          { id: qrCodeData },
          { qrCodeData: qrCodeData },
        ],
      },
    });

    if (!student) {
      return NextResponse.json({ message: `Student with QR data '${qrCodeData}' not found.` }, { status: 404 });
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const existingRecord = await prisma.attendanceRecord.findFirst({
      where: {
        studentInternalId: student.id,
        recordDate: today,
        mealType: mealType,
      },
    });

    if (existingRecord) {
      return NextResponse.json({
          message: `${student.name} has already been recorded for ${mealType.toLowerCase()} today.`,
          status: 'already_recorded',
          student: student,
          record: existingRecord
      }, { status: 200 });
    }

    const newRecord = await prisma.attendanceRecord.create({
      data: {
        studentInternalId: student.id,
        recordDate: today,
        mealType: mealType,
        status: 'PRESENT',
        scannedAtTimestamp: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Attendance recorded successfully',
      status: 'new_record',
      student: student,
      record: newRecord,
    }, { status: 201 });

  } catch (error) {
    console.error('Error in scan API:', error);
    return NextResponse.json({ message: 'Failed to record attendance', error: (error as Error).message }, { status: 500 });
  }
}
