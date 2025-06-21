
import type { User as PrismaUser, Department } from '@prisma/client';

export interface User extends Omit<PrismaUser, 'departmentId' | 'passwordHash'> {
    department: Department | null;
}
