
"use client";

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, AlertTriangle, Printer } from 'lucide-react';
import { StudentIdCard } from '@/components/admin/students/StudentIdCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
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
  const router = useRouter(); 
  const searchParams = useSearchParams();
  const { toast } = useToast();
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
    <div className="space-y-6 max-w-xl mx-auto py-8 px-4 print:py-0 print:px-0">
      <div className="flex items-center justify-between mb-6 print:hidden" id="page-header">
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

      <div className="flex justify-center mt-6 print:hidden" id="print-button-container">
        <Button onClick={handlePrint} size="lg">
          <Printer className="mr-2 h-4 w-4" /> Print ID Card
        </Button>
      </div>

      <style jsx global>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:py-0 {
            padding-top: 0 !important;
            padding-bottom: 0 !important;
          }
          .print\\:px-0 {
            padding-left: 0 !important;
            padding-right: 0 !important;
          }
          .max-w-xl {
            max-width: 100% !important;
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
