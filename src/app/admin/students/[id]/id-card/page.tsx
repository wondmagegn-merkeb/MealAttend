
"use client";

import { useCallback, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, AlertTriangle, Printer } from 'lucide-react';
import { StudentIdCard } from '@/components/admin/students/StudentIdCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Student } from '@/types';

const fetchStudent = async (id: string): Promise<Student> => {
    const response = await fetch(`/api/students/${id}`);
    if (!response.ok) {
        if (response.status === 404) throw new Error('Student not found');
        throw new Error('Failed to fetch student data');
    }
    return response.json();
};

export default function StudentIdCardPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const studentInternalId = typeof params.id === 'string' ? params.id : undefined;
  const [autoPrintTriggered, setAutoPrintTriggered] = useState(false);

  const { data: student, isLoading, error } = useQuery<Student>({
    queryKey: ['student', studentInternalId],
    queryFn: () => fetchStudent(studentInternalId!),
    enabled: !!studentInternalId,
  });

  const handlePrint = useCallback(() => {
    window.print();
  }, []);
  
  useEffect(() => {
    if (student && !isLoading && !error && !autoPrintTriggered) {
      const autoprintQueryParam = searchParams.get('autoprint');
      if (autoprintQueryParam === 'true') {
        handlePrint();
        setAutoPrintTriggered(true);
      }
    }
  }, [student, isLoading, error, searchParams, autoPrintTriggered, handlePrint]);


  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">Loading Student ID Card...</p>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] p-4">
        <Card className="w-full max-w-md text-center shadow-lg">
            <CardHeader>
                <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-2" />
                <CardTitle className="text-2xl text-destructive">Student Not Found</CardTitle>
            </CardHeader>
            <CardContent>
                <CardDescription className="mb-6">
                  {(error as Error)?.message === 'Student not found'
                    ? 'The student record for this ID card could not be found.'
                    : `Failed to load student data: ${(error as Error)?.message || 'Unknown error'}`
                  }
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
    <div className="space-y-6">
       <div className="flex items-center justify-between mb-6 print:hidden" id="page-header">
         <div>
          <h2 className="text-3xl font-semibold tracking-tight text-primary">Student ID Card</h2>
          <p className="text-muted-foreground">Viewing ID card for {student?.name}.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/admin/students">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to List
              </Link>
            </Button>
        </div>
      </div>
      
      <div id="printable-area" className="flex flex-col items-center justify-center">
        <div className="p-4 md:p-8 flex justify-center items-center">
            {student && <StudentIdCard student={student} />}
        </div>
        
        <div className="mt-6 flex justify-center print:hidden">
            <Button onClick={handlePrint} size="lg" className="text-lg py-6 px-8">
            <Printer className="mr-3 h-5 w-5" />
            Print This ID Card
            </Button>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body > * {
            display: none !important;
          }
          body > #printable-area, 
          body > #printable-area * {
            display: block !important;
          }
          #printable-area {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
          }
          .print\\:hidden { 
            display: none !important; 
          }
        }
      `}</style>
    </div>
  );
}
