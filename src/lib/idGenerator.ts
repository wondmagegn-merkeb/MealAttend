
'use server';

import prisma from '@/lib/prisma';

type IdType = 'STUDENT' | 'USER' | 'DEPARTMENT' | 'ATTENDANCE' | 'ACTIVITY_LOG';

const typeToPrefixMap: Record<IdType, string> = {
  STUDENT: 'STU',
  USER: 'USR',
  DEPARTMENT: 'DEP',
  ATTENDANCE: 'ATT',
  ACTIVITY_LOG: 'LOG',
};

/**
 * Generates the next sequential ID for a given entity type.
 * Format: ADERA/<PREFIX>/<YEAR>/<5-DIGIT-NUMBER>
 * @param type The type of entity (STUDENT, USER, or DEPARTMENT).
 * @returns A promise that resolves to the next formatted ID string.
 */
export async function generateNextId(type: IdType): Promise<string> {
  try {
    // Prisma's interactive transaction ensures that the find/update operation is atomic.
    // This is crucial to prevent race conditions where two requests might get the same ID.
    const newCount = await prisma.$transaction(async (tx) => {
      const counter = await tx.idCounter.findUnique({
        where: { type },
      });

      if (counter) {
        const updatedCounter = await tx.idCounter.update({
          where: { type },
          data: { count: { increment: 1 } },
        });
        return updatedCounter.count;
      } else {
        // If no counter exists for this type, create one starting at 1.
        const newCounter = await tx.idCounter.create({
          data: { type, count: 1 },
        });
        return newCounter.count;
      }
    });

    const year = new Date().getFullYear();
    const prefix = typeToPrefixMap[type];
    const formattedId = `ADERA/${prefix}/${year}/${String(newCount).padStart(5, '0')}`;
    return formattedId;

  } catch (error) {
    console.error(`Failed to generate next ID for type ${type}:`, error);
    // In a real application, you might want more sophisticated error handling or a fallback mechanism.
    throw new Error('Could not generate the next ID. Please try again.');
  }
}
