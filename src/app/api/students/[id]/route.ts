
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface RouteParams {
  params: {
    id: string; // This is the internal ID (e.g., ADERA/STU/...)
  };
}

// GET a single student
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const student = await prisma.student.findUnique({
      where: { id: params.id },
    });

    if (!student) {
      return NextResponse.json({ message: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json(student);
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Failed to fetch student', error: error.message },
      { status: 500 }
    );
  }
}

// UPDATE a student
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const data = await request.json();
    const { name, gender, classGrade, profileImageURL } = data;

    const updatedStudent = await prisma.student.update({
      where: { id: params.id },
      data: {
        name,
        gender,
        classGrade,
        profileImageURL,
      },
    });
    return NextResponse.json(updatedStudent);
  } catch (error: any) {
    if ((error as any).code === 'P2025') { // Record to update not found
      return NextResponse.json({ message: 'Student not found' }, { status: 404 });
    }
    return NextResponse.json(
      { message: 'Failed to update student', error: (error as any).message },
      { status: 500 }
    );
  }
}

// DELETE a student
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    // When deleting a student, we should also delete their attendance records.
    // This is handled with cascading deletes in the Prisma schema.
    await prisma.$transaction(async (tx) => {
        await tx.attendanceRecord.deleteMany({
            where: { studentId: params.id }
        });
        await tx.student.delete({
            where: { id: params.id },
        });
    });

    return NextResponse.json({ message: 'Student deleted successfully' }, { status: 200 });
  } catch (error: any) {
    if ((error as any).code === 'P2025') { // Record to delete not found
      return NextResponse.json({ message: 'Student not found' }, { status: 404 });
    }
    return NextResponse.json(
      { message: 'Failed to delete student', error: (error as any).message },
      { status: 500 }
    );
  }
}
