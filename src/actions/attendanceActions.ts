'use server';

import prisma from '@/lib/prisma';
import { generateNextId } from '@/lib/idGenerator';
import { startOfDay } from 'date-fns';
import type { MealType, Student } from '@/types';

// Result types to avoid returning raw prisma models or non-serializable objects
export interface AttendanceResult {
    success: boolean;
    message: string;
    type: 'success' | 'info' | 'error' | 'already_recorded';
    student?: Student; 
    record?: any; // serialized record
}

export async function checkAndRecordAttendance(identifier: { qrCodeData?: string; studentId?: string }, mealType: MealType): Promise<AttendanceResult> {
    
    const student = await prisma.student.findFirst({
        where: {
            OR: [
                { qrCodeData: identifier.qrCodeData },
                { studentId: identifier.studentId },
            ].filter(Boolean) as any[]
        }
    });

    if (!student) {
        return {
            success: false,
            message: `Student not found.`,
            type: 'error',
        };
    }
    
    // Serialize student data to be safe for client components
    const safeStudent = JSON.parse(JSON.stringify(student));

    const today = startOfDay(new Date());

    const existingRecord = await prisma.attendanceRecord.findFirst({
        where: {
            studentId: student.id,
            mealType: mealType,
            recordDate: today,
        }
    });

    // If it's a manual check (only studentId is provided)
    if (identifier.studentId && !identifier.qrCodeData) {
        if (existingRecord) {
            return {
                success: true,
                message: `${student.name} has already been recorded for this meal today.`,
                type: 'already_recorded',
                student: safeStudent,
                record: JSON.parse(JSON.stringify(existingRecord)),
            };
        } else {
             return {
                success: true,
                message: `${student.name} has not yet been recorded for this meal.`,
                type: 'info',
                student: safeStudent,
            };
        }
    }

    // If it's a scan and they are already recorded
    if (existingRecord) {
        return {
            success: true,
            message: `Already recorded for ${mealType}.`,
            type: 'already_recorded',
            student: safeStudent,
            record: JSON.parse(JSON.stringify(existingRecord)),
        };
    }

    // If it's a scan and they are not recorded yet, create a new record
    try {
        const newRecordId = await generateNextId('ATTENDANCE');
        const newRecord = await prisma.attendanceRecord.create({
            data: {
                id: newRecordId,
                studentId: student.id,
                mealType: mealType,
                status: 'PRESENT',
                recordDate: today,
            }
        });
        return {
            success: true,
            message: `Successfully recorded attendance for ${student.name}.`,
            type: 'success',
            student: safeStudent,
            record: JSON.parse(JSON.stringify(newRecord)),
        };

    } catch (error) {
        console.error("Failed to record attendance:", error);
        return {
            success: false,
            message: 'A database error occurred while recording attendance.',
            type: 'error',
        };
    }
}
