
export interface Department {
  id: string; // Unique identifier
  name: string;
  description?: string; // Optional
  headOfDepartment?: string; // Optional, could be a user's name or ID
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}
