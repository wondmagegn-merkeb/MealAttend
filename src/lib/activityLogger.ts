
import { USER_ACTIVITY_LOG_KEY } from './constants';
import type { UserActivityLog } from '@/types/activity';
import { formatISO } from 'date-fns';

const MAX_LOGS = 500; // Limit the number of logs to prevent localStorage bloat

export function logUserActivity(userId: string | null, action: string, details?: string) {
  const effectiveUserId = userId || 'unknown_user'; // Use 'unknown_user' if userId is null

  try {
    const newLog: UserActivityLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      userId: effectiveUserId,
      timestamp: formatISO(new Date()),
      action,
      details,
    };

    const storedLogsRaw = localStorage.getItem(USER_ACTIVITY_LOG_KEY);
    let logs: UserActivityLog[] = storedLogsRaw ? JSON.parse(storedLogsRaw) : [];
    
    logs.unshift(newLog); // Add new log to the beginning

    if (logs.length > MAX_LOGS) {
      logs = logs.slice(0, MAX_LOGS);
    }

    localStorage.setItem(USER_ACTIVITY_LOG_KEY, JSON.stringify(logs));
  } catch (error) {
    console.error("Failed to log user activity:", error);
    // Optionally, add a toast notification here if logging fails, though it might be too noisy.
  }
}
