
'use server';

import prisma from './prisma';
import { generateNextId } from './idGenerator';

export async function logUserActivity(userIdentifier: string | null, action: string, details?: string) {
  const effectiveUserId = userIdentifier || 'unknown_user';
  
  console.log(`[Activity Log] User: ${effectiveUserId}, Action: ${action}, Details: ${details || 'N/A'}`);

  try {
    const newLogId = await generateNextId('ACTIVITY_LOG');
    
    // Find the internal user ID based on the public userIdentifier
    let userInternalId: string | undefined = undefined;
    if(userIdentifier && action !== 'LOGIN_FAILURE') { // Don't try to find user if login failed
        const user = await prisma.user.findUnique({
            where: { userId: userIdentifier },
            select: { id: true }
        });
        if (user) {
          userInternalId = user.id;
        }
    } else if (action === 'LOGIN_FAILURE' && userIdentifier) {
        // For failed logins, the identifier is an email, not a userId
        const user = await prisma.user.findUnique({
            where: { email: userIdentifier },
            select: { id: true }
        });
        if (user) {
          userInternalId = user.id;
        }
    }

    await prisma.activityLog.create({
      data: {
        logId: newLogId,
        userIdentifier: effectiveUserId,
        action,
        details,
        // Conditionally add userId if found
        ...(userInternalId && { userId: userInternalId })
      },
    });
  } catch (error) {
    console.error('Failed to save activity log to database:', error);
  }
}
