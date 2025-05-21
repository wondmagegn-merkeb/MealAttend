
"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { StudentForm, type StudentFormData } from "@/components/admin/students/StudentForm";
import type { Student } from "@/types/student";
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { STUDENTS_STORAGE_KEY } from '@/lib/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { logUserActivity } from '@/lib/activityLogger';
import { useAuth } from '@/hooks/useAuth';

const parseClassString = (classStr: string | undefined): { classNumber: string, classAlphabet: string } => {
  if (!classStr) return { classNumber: "", classAlphabet: "" };
  const match = classStr.match(/^(\d+)([A-Za-z]*)$/);
  if (match) {
    return { classNumber: match[1], classAlphabet: match[2] };
  }
  const numericMatch = classStr.match(/^(\d+)$/);
  if (numericMatch) {
    return { classNumber: numericMatch[1], classAlphabet: "" };
  }
  return { classNumber: "", classAlphabet: classStr };
};


export default function EditStudentPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { currentUserId } = useAuth();
  
  const studentInternalId = typeof params.id === 'string' ? params.id : undefined;

  const [student, setStudent] = useState<Student | null>(null);
  const [initialFormValues, setInitialFormValues] = useState<Partial<StudentFormData> & { studentId?: string } | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (studentInternalId) {
      setIsFetching(true);
      try {
        const storedStudentsRaw = localStorage.getItem(STUDENTS_STORAGE_KEY);
        if (storedStudentsRaw) {
          const students: Student[] = JSON.parse(storedStudentsRaw);
          const foundStudent = students.find(s => s.id === studentInternalId);
          if (foundStudent) {
            setStudent(foundStudent);
            const { classNumber, classAlphabet } = parseClassString(foundStudent.class);
            setInitialFormValues({
              studentId: foundStudent.studentId,
              name: foundStudent.name,
              gender: foundStudent.gender,
              classNumber: classNumber,
              classAlphabet: classAlphabet,
              profileImageURL: foundStudent.profileImageURL,
            });
          } else {
            setNotFound(true);
          }
        } else {
          setNotFound(true); 
        }
      } catch (error) {
        console.error("Failed to load student from localStorage", error);
        setNotFound(true);
         toast({
          title: "Error",
          description: "Failed to load student data.",
          variant: "destructive",
        });
      } finally {
        setIsFetching(false);
      }
    } else {
      setNotFound(true); 
      setIsFetching(false);
    }
  }, [studentInternalId, toast]);

  const handleFormSubmit = (data: StudentFormData) => {
    if (!student) return;
    setIsLoading(true);

    setTimeout(() => {
      const combinedClass = `${data.classNumber}${data.classAlphabet}`;
      const updatedStudent: Student = {
        ...student,
        name: data.name,
        gender: data.gender,
        class: combinedClass,
        profileImageURL: data.profileImageURL,
        updatedAt: new Date().toISOString(),
      };
      
      try {
        const storedStudentsRaw = localStorage.getItem(STUDENTS_STORAGE_KEY);
        let students: Student[] = storedStudentsRaw ? JSON.parse(storedStudentsRaw) : [];
        students = students.map(s => s.id === student.id ? updatedStudent : s);
        localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(students));

        logUserActivity(currentUserId, "STUDENT_UPDATE_SUCCESS", `Updated student ID: ${updatedStudent.studentId}, Name: ${updatedStudent.name}`);
        toast({
          title: "Student Updated",
          description: `${data.name}'s record has been updated.`,
        });
        router.push('/admin/students');
      } catch (error) {
        console.error("Failed to update student in localStorage", error);
        logUserActivity(currentUserId, "STUDENT_UPDATE_FAILURE", `Attempted to update student ID: ${student.studentId}. Error: ${error instanceof Error ? error.message : String(error)}`);
        toast({
          title: "Error",
          description: "Failed to update student. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }, 1000);
  };

  if (isFetching) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading student data...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto text-center">
         <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl text-destructive">Student Not Found</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-4">The student record you are trying to edit could not be found.</p>
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
      {initialFormValues && (
        <StudentForm 
          onSubmit={handleFormSubmit} 
          initialData={initialFormValues}
          isLoading={isLoading}
          submitButtonText="Save Changes"
          isEditMode={true}
        />
      )}
    </div>
  );
}
