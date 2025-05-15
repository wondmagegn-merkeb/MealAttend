
export interface Student {
  id: string; // Unique identifier, typically a UUID
  studentId: string; // School-specific or custom student ID
  name: string; // Full name
  email: string;
  gender: 'Male' | 'Female' | 'Other' | ''; // Gender
  class: string; // Class or grade
  profileImageURL?: string; // Optional URL for profile picture
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

