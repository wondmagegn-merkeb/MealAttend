
export interface User {
  id: string; // Unique identifier
  fullName: string;
  department: string;
  email: string;
  role: 'Admin' | 'User'; // Added role field
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}
