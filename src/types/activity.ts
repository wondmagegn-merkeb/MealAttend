
export interface UserActivityLog {
  id: string; // Unique log ID
  userId: string; // ADERA User ID of the user performing the action, or 'system'/'unknown_user'
  timestamp: string; // ISO date string
  action: string; // e.g., "LOGIN_SUCCESS", "LOGOUT", "PROFILE_UPDATE_SUCCESS"
  details?: string; // Optional: e.g., "Failed login for user: some_id"
}
