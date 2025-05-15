
export interface Student {
  id: string; // Unique identifier, typically a UUID
  studentId: string; // School-specific or custom student ID
  name: string; // Full name
  gender: 'Male' | 'Female' | 'Other' | ''; // Gender
  class: string; // Class or grade
  profileImageURL?: string; // Optional Data URL or http URL for profile picture
  qrCodeData?: string; // Optional: Data to be encoded in QR Code (e.g., student's unique ID)
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}
