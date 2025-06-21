
"use client";

import { useRouter, useParams } from 'next/navigation';
import { StudentForm, type StudentFormData } from "@/components/admin/students/StudentForm";
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { logUserActivity } from '@/lib/activityLogger';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Student } from '@prisma/client';

async function fetchStudentById(id: string): Promise<Student> {
  const response = await fetch(`/api/students/${id}`);
  if (!response.ok) {
    if (response.status === 404) throw new Error('Student not found');
    throw new Error('Failed to fetch student');
  }
  return response.json();
}

type ApiStudentUpdateData = {
  name: string;
  gender?: string | null;
  classGrade?: string | null;
  profileImageURL?: string | null;
  // studentId is not typically updated this way or is handled specially if allowed
};

async function updateStudentAPI({ id, data }: { id: string, data: ApiStudentUpdateData }): Promise<Student> {
  const response = await fetch(`/api/students/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to update student' }));
    throw new Error(errorData.message || 'Failed to update student');
  }
  return response.json();
}


export default function EditStudentPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { currentUserId } = useAuth();
  const queryClient = useQueryClient();
  
  const studentInternalId = typeof params.id === 'string' ? params.id : undefined;

  const { data: student, isLoading: isFetchingStudent, error: fetchError } = useQuery<Student, Error>({
    queryKey: ['student', studentInternalId],
    queryFn: () => fetchStudentById(studentInternalId!),
    enabled: !!studentInternalId,
  });

  const mutation = useMutation({
    mutationFn: updateStudentAPI,
    onSuccess: (updatedStudent) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['student', updatedStudent.id] });
      logUserActivity(currentUserId, "STUDENT_UPDATE_SUCCESS", `Updated student ID: ${updatedStudent.studentId}, Name: ${updatedStudent.name}`);
      toast({
        title: "Student Updated",
        description: `${updatedStudent.name}'s record has been updated.`,
      });
      router.push('/admin/students');
    },
    onError: (error: Error) => {
      logUserActivity(currentUserId, "STUDENT_UPDATE_FAILURE", `Attempted to update student ID: ${student?.studentId}. Error: ${error.message}`);
      toast({
        title: "Error Updating Student",
        description: error.message || "Failed to update student. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFormSubmit = (data: Omit<StudentFormData, 'classNumber' | 'classAlphabet'> & { classGrade?: string }) => {
    if (!studentInternalId) return;
    
    const apiData: ApiStudentUpdateData = {
      name: data.name,
      gender: data.gender === 'unspecified' ? null : data.gender || null,
      classGrade: data.classGrade || null,
      profileImageURL: data.profileImageURL || null,
    };
    mutation.mutate({ id: studentInternalId, data: apiData });
  };

  if (isFetchingStudent) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading student data...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto text-center">
         <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl text-destructive flex items-center justify-center">
                    <AlertTriangle className="mr-2 h-7 w-7" /> Error
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-4">
                  {fetchError.message === 'Student not found' 
                    ? 'The student record you are trying to edit could not be found.'
                    : `Failed to load student data: ${fetchError.message}`
                  }
                </p>
                <Button variant="outline" asChild>
                <Link href="/admin/students">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Student List
                </Link>
                </Button>
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-primary">Edit Student</h2>
          <p className="text-muted-foreground">Update the details for {student?.name}.</p>
        </div>
         <Button variant="outline" asChild>
          <Link href="/admin/students">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Link>
        </Button>
      </div>
      {student && ( // student from useQuery
        <StudentForm 
          onSubmit={handleFormSubmit} 
          initialData={student} // Pass the fetched student data
          isLoading={mutation.isPending}
          submitButtonText="Save Changes"
          isEditMode={true}
        />
      )}
    </div>
  );
}
