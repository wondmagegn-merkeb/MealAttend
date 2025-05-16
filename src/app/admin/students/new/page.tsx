
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StudentForm, type StudentFormData } from "@/components/admin/students/StudentForm";
import type { Student } from "@/types/student";
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { STUDENTS_STORAGE_KEY } from '@/lib/constants';

export default function NewStudentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleFormSubmit = (data: StudentFormData) => {
    setIsLoading(true);
    
    setTimeout(() => {
      const studentInternalId = `stud_${Date.now()}`; // Simple unique ID for internal use
      
      const currentYear = new Date().getFullYear();
      // Using a timestamp-based serial for client-side uniqueness
      const serialNumber = Date.now().toString().slice(-5).padStart(5, '0');
      const generatedStudentId = `ADERA/STU/${currentYear}/${serialNumber}`;
      
      const combinedClass = `${data.classNumber}${data.classAlphabet}`;

      const newStudent: Student = {
        id: studentInternalId, 
        studentId: generatedStudentId,
        name: data.name,
        gender: data.gender,
        class: combinedClass,
        profileImageURL: data.profileImageURL,
        qrCodeData: studentInternalId, 
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        const storedStudentsRaw = localStorage.getItem(STUDENTS_STORAGE_KEY);
        const students: Student[] = storedStudentsRaw ? JSON.parse(storedStudentsRaw) : [];
        students.unshift(newStudent); 
        localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(students));
        
        toast({
          title: "Student Added",
          description: `${data.name} has been successfully added with ID ${generatedStudentId}.`,
        });
        router.push('/admin/students');
      } catch (error) {
        console.error("Failed to save student to localStorage", error);
        toast({
          title: "Error",
          description: "Failed to save student. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-primary">Add New Student</h2>
          <p className="text-muted-foreground">Fill in the details to add a new student record. Student ID will be auto-generated.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/students">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Link>
        </Button>
      </div>
      <StudentForm 
        onSubmit={handleFormSubmit} 
        isLoading={isLoading}
        submitButtonText="Add Student"
        isEditMode={false}
      />
    </div>
  );
}
