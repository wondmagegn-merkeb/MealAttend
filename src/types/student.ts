
export interface Student {
  id: string; // Unique identifier, typically a UUID
  studentId: string; // School-specific or custom student ID
  name: string; // Full name
  gender: 'Male' | 'Female' | 'Other' | ''; // Gender
  class: string; // Class or grade
  profileImageURL?: string; // Optional Data URL or http URL for profile picture
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}
