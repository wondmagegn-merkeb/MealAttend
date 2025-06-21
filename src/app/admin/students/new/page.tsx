
"use client";

import { useRouter } from 'next/navigation';
import { StudentForm, type StudentFormData } from "@/components/admin/students/StudentForm";
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { logUserActivity } from '@/lib/activityLogger';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Student } from '@prisma/client';

// Type for the data sent to the API
type ApiStudentCreateData = {
  name: string;
  gender?: string | null;
  classGrade?: string | null;
  profileImageURL?: string | null;
};

async function createStudentAPI(data: ApiStudentCreateData): Promise<Student> {
  const response = await fetch('/api/students', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to create student' }));
    throw new Error(errorData.message || 'Failed to create student');
  }
  return response.json();
}

export default function NewStudentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentUserId } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createStudentAPI,
    onSuccess: (newStudent) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      logUserActivity(currentUserId, "STUDENT_CREATE_SUCCESS", `Created student ID: ${newStudent.studentId}, Name: ${newStudent.name}`);
      toast({
        title: "Student Added",
        description: `${newStudent.name} has been successfully added with ID ${newStudent.studentId}.`,
      });
      router.push('/admin/students');
    },
    onError: (error: Error) => {
      logUserActivity(currentUserId, "STUDENT_CREATE_FAILURE", `Error: ${error.message}`);
      toast({
        title: "Error Adding Student",
        description: error.message || "Failed to save student. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFormSubmit = (data: Omit<StudentFormData, 'classNumber' | 'classAlphabet'> & { classGrade?: string | null }) => {
    const apiData: ApiStudentCreateData = {
      name: data.name,
      gender: data.gender === 'unspecified' ? null : data.gender || null,
      classGrade: data.classGrade || null, // Ensure null if empty or undefined
      profileImageURL: data.profileImageURL || null, // Ensure null if empty string
    };
    mutation.mutate(apiData);
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
        isLoading={mutation.isPending}
        submitButtonText="Add Student"
        isEditMode={false}
      />
    </div>
  );
}
