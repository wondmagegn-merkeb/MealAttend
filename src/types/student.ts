
export interface Student {
  id: string; // Unique identifier, typically a UUID
  studentId: string; // School-specific or custom student ID
  name: string;
  email: string;
  // qrCodeData?: string; // Data to be encoded in a QR code, can be added later
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}
