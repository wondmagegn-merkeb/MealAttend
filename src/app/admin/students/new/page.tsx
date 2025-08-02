
"use client";

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { StudentForm, type StudentFormData } from "@/components/admin/students/StudentForm";
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { logUserActivity } from '@/lib/activityLogger';
import { useAuth } from '@/hooks/useAuth';

type CreateStudentPayload = Omit<StudentFormData, 'classNumber' | 'classAlphabet'> & { 
  classGrade?: string | null;
  createdById: string; 
};

const createStudent = async (data: CreateStudentPayload) => {
  const response = await fetch('/api/students', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create student');
  }
  return response.json();
};


export default function NewStudentPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentUser } = useAuth();
  
  const mutation = useMutation({
    mutationFn: createStudent,
    onSuccess: (newData) => {
      toast({
          title: "Student Added",
          description: `${newData.name} has been successfully added with ID ${newData.studentId}.`,
      });
      logUserActivity(currentUser?.userId, "STUDENT_CREATE_SUCCESS", `Created student ID: ${newData.studentId}, Name: ${newData.name}`);
      queryClient.invalidateQueries({ queryKey: ['students'] });
      router.push('/admin/students');
    },
    onError: (error: Error) => {
       toast({
          title: "Error Adding Student",
          description: error.message,
          variant: "destructive",
      });
    }
  });

  const handleFormSubmit = async (data: Omit<StudentFormData, 'classNumber' | 'classAlphabet'> & { classGrade?: string | null }) => {
    if (!currentUser?.id) {
        toast({ title: "Authentication Error", description: "Could not identify the current user.", variant: "destructive" });
        return;
    }

    const payload: CreateStudentPayload = {
      ...data,
      createdById: currentUser.id, // Add the creator's internal ID
    };

    mutation.mutate(payload);
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

    
