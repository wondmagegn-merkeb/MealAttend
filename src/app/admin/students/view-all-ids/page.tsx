
"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Printer, AlertTriangle } from 'lucide-react';
import type { Student } from '@/types/student';
import { StudentIdCard } from '@/components/admin/students/StudentIdCard';
import { STUDENTS_STORAGE_KEY } from '@/lib/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function ViewAllIdCardsPage() {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setIsLoading(true);
    try {
      const storedStudentsRaw = localStorage.getItem(STUDENTS_STORAGE_KEY);
      if (storedStudentsRaw) {
        const loadedStudents: Student[] = JSON.parse(storedStudentsRaw);
        setStudents(loadedStudents);
      } else {
        setStudents([]); // No students in storage
        toast({
          title: "No Students Found",
          description: "There are no student records to display.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Failed to load students from localStorage", error);
      setStudents([]);
      toast({
        title: "Error Loading Data",
        description: "Could not load student data from local storage.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  if (!isMounted || isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen space-y-4 p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">Loading Student ID Cards...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <header className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 no-print">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-primary">All Student ID Cards</h1>
          <p className="text-muted-foreground">View all student ID cards. Ready for printing.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/students">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Student List
            </Link>
          </Button>
          <Button onClick={handlePrint} disabled={students.length === 0}>
            <Printer className="mr-2 h-4 w-4" />
            Print All Cards
          </Button>
        </div>
      </header>

      {students.length === 0 && !isLoading && (
        <Card className="shadow-lg">
          <CardHeader className="items-center text-center">
            <AlertTriangle className="h-10 w-10 text-amber-500 mb-2" />
            <CardTitle className="text-xl">No Student ID Cards to Display</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-center">
              There are currently no student records stored in the application. Please add students first.
            </CardDescription>
          </CardContent>
        </Card>
      )}

      {students.length > 0 && (
        <div className="print-grid">
          {students.map(student => (
            <div key={student.id} className="id-card-container">
              <StudentIdCard student={student} />
            </div>
          ))}
        </div>
      )}

      <style jsx global>{`
        .print-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); /* Adjust minmax for card size */
          gap: 1.5rem; /* Spacing between cards */
        }
        
        .id-card-container {
          /* Styles for individual card wrapper in the grid view */
        }

        @media print {
          body {
            -webkit-print-color-adjust: exact; /* Chrome, Safari, Edge */
            print-color-adjust: exact; /* Firefox */
            margin: 0.5cm; /* Add some margin for printing */
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
          .print-grid {
            display: grid;
            grid-template-columns: 1fr 1fr; /* Aim for 2 cards per row on print */
            gap: 10mm 5mm; /* Gap between cards on paper */
            width: 100%;
          }
          .id-card-container {
            page-break-inside: avoid !important; /* Try to keep each card on one page */
            break-inside: avoid !important;
            border: 1px solid #eee; /* Optional: add a light border for cutting guides */
            transform: scale(0.95); /* Slightly scale down to ensure fit, adjust as needed */
            transform-origin: top left;
            margin-bottom: 5mm; /* Space below each card if they stack vertically */
          }
          /* Ensure StudentIdCard itself scales appropriately if needed */
          .id-card-container > div { /* Assuming StudentIdCard is the direct child */
             width: 100% !important;
             max-width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}

