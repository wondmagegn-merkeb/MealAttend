
"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { StudentForm, type StudentFormData } from "@/components/admin/students/StudentForm";
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { logUserActivity } from '@/lib/activityLogger';
import { useAuth } from '@/hooks/useAuth';
import { mockStudents } from '@/lib/demo-data';
import type { Student } from '@/types';

type ApiStudentUpdateData = {
  name: string;
  gender?: string | null;
  classGrade?: string | null;
  profileImageURL?: string | null;
};

export default function EditStudentPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { currentUserId } = useAuth();
  
  const studentInternalId = typeof params.id === 'string' ? params.id : undefined;

  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setIsLoading(true);
    if(studentInternalId) {
      setTimeout(() => {
        const foundStudent = mockStudents.find(s => s.id === studentInternalId);
        if (foundStudent) {
          setStudent(foundStudent);
        } else {
          setError(new Error('Student not found'));
        }
        setIsLoading(false);
      }, 500);
    } else {
      setError(new Error('No student ID provided'));
      setIsLoading(false);
    }
  }, [studentInternalId]);


  const handleFormSubmit = (data: Omit<StudentFormData, 'classNumber' | 'classAlphabet'> & { classGrade?: string }) => {
    if (!studentInternalId) return;
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      logUserActivity(currentUserId, "STUDENT_UPDATE_SUCCESS", `Updated student ID: ${student?.studentId}, Name: ${data.name}`);
      toast({
        title: "Student Updated (Demo)",
        description: `${data.name}'s record has been updated.`,
      });
      router.push('/admin/students');
      setIsSubmitting(false);
    }, 1000);
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
                  {error.message === 'Student not found' 
                    ? 'The student record you are trying to edit could not be found.'
                    : `Failed to load student data: ${error.message}`
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
          isLoading={isSubmitting}
          submitButtonText="Save Changes"
          isEditMode={true}
        />
      )}
    </div>
  );
}
