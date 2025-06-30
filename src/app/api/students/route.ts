
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateNextId } from '@/lib/idGenerator';

export const dynamic = 'force-dynamic';

// GET all students
export async function GET() {
  try {
    const students = await prisma.student.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(students);
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Failed to fetch students', error: error.message },
      { status: 500 }
    );
  }
}

// CREATE a new student
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { name, gender, classGrade, profileImageURL } = data;

    if (!name) {
      return NextResponse.json({ message: 'Missing required field: name' }, { status: 400 });
    }

    const newStudentId = await generateNextId('STUDENT');

    const newStudent = await prisma.student.create({
      data: {
        studentId: newStudentId,
        name,
        gender,
        classGrade,
        profileImageURL,
        // The QR code data can be the studentId itself or some other unique identifier.
        qrCodeData: newStudentId,
      },
    });

    return NextResponse.json(newStudent, { status: 201 });
  } catch (error: any) {
    if ((error as any).code === 'P2002') {
      return NextResponse.json(
        { message: 'A student with this ID already exists.', error: (error as any).message },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { message: 'Failed to create student', error: (error as any).message },
      { status: 500 }
    );
  }
}
