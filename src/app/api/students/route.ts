import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import type { Student } from '@prisma/client'; // Import Prisma's generated Student type

// GET /api/students - Fetch all students
export async function GET(request: NextRequest) {
  try {
    const students = await prisma.student.findMany({
      orderBy: {
        createdAt: 'desc', // Optional: order by creation date
      },
    });
    return NextResponse.json(students, { status: 200 });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json({ message: 'Failed to fetch students', error: (error as Error).message }, { status: 500 });
  }
}

// POST /api/students - Create a new student
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, name, gender, classGrade, profileImageURL } = body as Partial<Student>;

    if (!studentId || !name) {
      return NextResponse.json({ message: 'Missing required fields: studentId and name are required.' }, { status: 400 });
    }

    // Check if studentId already exists
    const existingStudentById = await prisma.student.findUnique({
      where: { studentId },
    });

    if (existingStudentById) {
      return NextResponse.json({ message: `Student with ID ${studentId} already exists.` }, { status: 409 }); // 409 Conflict
    }
    
    const newStudent = await prisma.student.create({
      data: {
        studentId,
        name,
        gender,
        classGrade,
        profileImageURL,
      },
    });
    return NextResponse.json(newStudent, { status: 201 });
  } catch (error) {
    console.error('Error creating student:', error);
    if ((error as any).code === 'P2002' && (error as any).meta?.target?.includes('studentId')) {
        return NextResponse.json({ message: `Student with ID ${ (error as any).meta?.values?.[0] } already exists.` }, { status: 409 });
    }
    return NextResponse.json({ message: 'Failed to create student', error: (error as Error).message }, { status: 500 });
  }
}
