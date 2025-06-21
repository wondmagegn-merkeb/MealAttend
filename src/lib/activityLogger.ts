
import type { UserActivityLog } from "@prisma/client";

export async function logUserActivity(userIdentifier: string | null, action: string, details?: string) {
  const effectiveUserId = userIdentifier || 'unknown_user';

  const logData: Partial<Omit<UserActivityLog, 'id' | 'createdAt'>> = {
    userIdentifier: effectiveUserId,
    action,
    details: details || null,
    activityTimestamp: new Date(),
  };

  try {
    await fetch('/api/activity-logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(logData),
    });
  } catch (error) {
    console.error("Failed to log user activity to API:", error);
  }
}
