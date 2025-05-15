
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Loader2, Printer, AlertTriangle, Search } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setIsMounted(true);
    setIsLoading(true);
    try {
      const storedStudentsRaw = localStorage.getItem(STUDENTS_STORAGE_KEY);
      if (storedStudentsRaw) {
        const loadedStudents: Student[] = JSON.parse(storedStudentsRaw);
        setStudents(loadedStudents);
      } else {
        setStudents([]); 
        // Toast for no students can be shown after loading if students array is empty
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

  useEffect(() => {
    if (isMounted && !isLoading && students.length === 0) {
      toast({
        title: "No Students Found",
        description: "There are no student records to display ID cards for.",
        variant: "default",
      });
    }
  }, [isMounted, isLoading, students.length, toast]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const filteredStudents = useMemo(() => {
    if (!searchTerm) {
      return students;
    }
    return students.filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.class.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

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
        <div className="flex-grow">
          <h1 className="text-3xl font-semibold tracking-tight text-primary">All Student ID Cards</h1>
          <p className="text-muted-foreground">View and print student ID cards. Use search to filter.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name, ID, class..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          <Button variant="outline" asChild className="w-full sm:w-auto">
            <Link href="/admin/students">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to List
            </Link>
          </Button>
          <Button onClick={handlePrint} disabled={filteredStudents.length === 0} className="w-full sm:w-auto">
            <Printer className="mr-2 h-4 w-4" />
            Print Filtered Cards
          </Button>
        </div>
      </header>

      {filteredStudents.length === 0 && !isLoading && (
        <Card className="shadow-lg mt-6">
          <CardHeader className="items-center text-center">
            <AlertTriangle className="h-10 w-10 text-amber-500 mb-2" />
            <CardTitle className="text-xl">
              {searchTerm ? "No Matching Students" : "No Student ID Cards"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-center">
              {searchTerm 
                ? "No students match your current search criteria." 
                : "There are currently no student records. Please add students first."}
            </CardDescription>
          </CardContent>
        </Card>
      )}

      {filteredStudents.length > 0 && (
        <div className="print-grid">
          {filteredStudents.map(student => (
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
            /* margin-bottom: 5mm; // Removed this to let grid gap control spacing */
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

