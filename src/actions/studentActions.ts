'use server';

import prisma from '@/lib/prisma';

export async function getStudentsForScanner() {
  try {
    const students = await prisma.student.findMany({
      select: {
        id: true,
        studentId: true,
        name: true,
        gender: true,
        classGrade: true,
        profileImageURL: true,
        qrCodeData: true,
        createdAt: true,
        updatedAt: true,
      }
    });
    // This is a hack because server actions can't return Date objects directly without client error
    // It's better to serialize them to strings.
    return JSON.parse(JSON.stringify(students));
  } catch (error) {
    console.error("Failed to fetch students for scanner:", error);
    return [];
  }
}
