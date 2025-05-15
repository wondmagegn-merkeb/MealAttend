
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import type { Student } from '@/types/student';
import { StudentIdCard } from '@/components/admin/students/StudentIdCard';
import { STUDENTS_STORAGE_KEY } from '@/lib/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function StudentIdCardPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const studentId = typeof params.id === 'string' ? params.id : undefined;

  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (studentId) {
      setIsLoading(true);
      try {
        const storedStudentsRaw = localStorage.getItem(STUDENTS_STORAGE_KEY);
        if (storedStudentsRaw) {
          const students: Student[] = JSON.parse(storedStudentsRaw);
          const foundStudent = students.find(s => s.id === studentId);
          if (foundStudent) {
            setStudent(foundStudent);
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
          description: "Failed to load student data for ID card.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      setNotFound(true);
      setIsLoading(false);
    }
  }, [studentId, toast]);

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">Loading Student ID Card...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] p-4">
        <Card className="w-full max-w-md text-center shadow-lg">
            <CardHeader>
                <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-2" />
                <CardTitle className="text-2xl text-destructive">Student Not Found</CardTitle>
            </CardHeader>
            <CardContent>
                <CardDescription className="mb-6">
                The student record for this ID card could not be found.
                </CardDescription>
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
    <div className="space-y-6 max-w-xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-primary">Student ID Card</h2>
          <p className="text-muted-foreground">Viewing ID card for {student?.name}.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/students">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Link>
        </Button>
      </div>
      
      {student && <StudentIdCard student={student} />}

      {/* Add a print button if desired */}
      {/* <div className="flex justify-center mt-6">
        <Button onClick={() => window.print()} size="lg">
          <Printer className="mr-2 h-4 w-4" /> Print ID Card
        </Button>
      </div> */}
    </div>
  );
}
