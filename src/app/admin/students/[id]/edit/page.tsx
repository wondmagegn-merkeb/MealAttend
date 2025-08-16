
"use client";

import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StudentForm, type StudentFormData } from "@/components/admin/students/StudentForm";
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { logUserActivity } from '@/lib/activityLogger';
import { useAuth } from '@/hooks/useAuth';
import type { Student } from '@/types';

type ApiStudentUpdateData = Omit<StudentFormData, 'classNumber' | 'classAlphabet'> & { classGrade?: string | null };

const fetchStudent = async (id: string): Promise<Student> => {
    const token = localStorage.getItem('mealAttendAuthToken_v1');
    const response = await fetch(`/api/students/${id}`,{
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) {
        if (response.status === 404) throw new Error('Student not found');
        throw new Error('Failed to fetch student');
    }
    return response.json();
};

const updateStudent = async ({ id, data }: { id: string, data: ApiStudentUpdateData }): Promise<Student> => {
    const response = await fetch(`/api/students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update student');
    }
    return response.json();
};

export default function EditStudentPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentUserId } = useAuth();
  
  const studentInternalId = typeof params.id === 'string' ? params.id : undefined;

  const { data: student, isLoading, error } = useQuery<Student>({
    queryKey: ['student', studentInternalId],
    queryFn: () => fetchStudent(studentInternalId!),
    enabled: !!studentInternalId,
  });

  const mutation = useMutation({
    mutationFn: updateStudent,
    onSuccess: (updatedData) => {
      toast({
        title: "Student Updated",
        description: `${updatedData.name}'s record has been updated.`,
      });
      logUserActivity(currentUserId, "STUDENT_UPDATE_SUCCESS", `Updated student ID: ${updatedData.studentId}, Name: ${updatedData.name}`);
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['student', studentInternalId] });
      router.push('/admin/students');
    },
    onError: (error: Error) => {
        toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    }
  });


  const handleFormSubmit = (data: ApiStudentUpdateData) => {
    if (!studentInternalId) return;
    mutation.mutate({ id: studentInternalId, data });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading student data...</p>
      </div>
    );
  }

  if (error) {
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
                  {(error as Error).message === 'Student not found' 
                    ? 'The student record you are trying to edit could not be found.'
                    : `Failed to load student data: ${(error as Error).message}`
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
      {student && (
        <StudentForm 
          onSubmit={handleFormSubmit} 
          initialData={student}
          isLoading={mutation.isPending}
          submitButtonText="Save Changes"
          isEditMode={true}
        />
      )}
    </div>
  );
}
