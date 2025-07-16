
import prisma from '@/lib/prisma';
import { AUTH_TOKEN_KEY } from './constants';
import type { User } from '@/types';

/**
 * Extracts the user's auth token from the request headers and retrieves the user from the database.
 * This is a simplified auth check for server-side API routes. In a real-world scenario,
 * this would involve decoding and verifying a JWT.
 * @param request The incoming Request object.
 * @returns The authenticated user object or null if not authenticated.
 */
export async function getAuthFromRequest(request: Request): Promise<User | null> {
  const authToken = request.headers.get('Authorization')?.split('Bearer ')[1];

  if (!authToken) {
    return null;
  }
  
  // The token is `mock-jwt-for-${user.userId}`
  const userId = authToken.replace('mock-jwt-for-', '');

  if (!userId) {
    return null;
  }
  
  try {
    const user = await prisma.user.findUnique({
      where: { userId },
    });
    return user;
  } catch (error) {
    console.error("Error retrieving user from token:", error);
    return null;
  }
}
