
export interface User {
  id: string; // Unique identifier
  userId: string; // Formatted ADERA ID: ADERA/USR/YYYY/SERIAL
  fullName: string;
  department: string;
  email: string;
  role: 'Admin' | 'User';
  profileImageURL?: string; // Optional Data URL or http URL for profile picture
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}
