
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Printer, AlertTriangle } from 'lucide-react';
import { StudentIdCard } from '@/components/admin/students/StudentIdCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { Student } from '@/types';

const fetchStudents = async (): Promise<Student[]> => {
    const response = await fetch('/api/students');
    if (!response.ok) throw new Error('Failed to fetch students');
    return response.json();
};

const getYearFromStudentId = (studentId: string): string | null => {
  const parts = studentId.split('/'); 
  if (parts.length === 4 && /^\d{4}$/.test(parts[2])) {
    return parts[2];
  }
  return null;
};

const parseClass = (classStr: string | null | undefined): { number: number; letter: string } => {
  if (!classStr) return { number: Infinity, letter: '' };
  const match = classStr.match(/^(\d+)([A-Za-z]*)$/);
  if (match) {
    return { number: parseInt(match[1], 10), letter: match[2].toUpperCase() };
  }
  const numericMatch = classStr.match(/^(\d+)$/);
  if (numericMatch) {
     return { number: parseInt(numericMatch[1], 10), letter: '' };
  }
  return { number: Infinity, letter: classStr.toUpperCase() };
};

export default function ViewAllIdCardsPage() {
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);
  
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');

  const { data: allStudents = [], isLoading: isLoadingStudents, error: studentsError } = useQuery<Student[]>({
    queryKey: ['students'],
    queryFn: fetchStudents,
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !isLoadingStudents && allStudents.length === 0 && !studentsError) {
      toast({
        title: "No Students Found",
        description: "There are no student records to display ID cards for.",
        variant: "default",
      });
    }
  }, [isMounted, isLoadingStudents, allStudents.length, studentsError, toast]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const uniqueClasses = useMemo(() => {
    if (!allStudents) return [];
    const classSet = new Set<string>();
    allStudents.forEach(student => {
      if (student.classGrade) classSet.add(student.classGrade);
    });
    return Array.from(classSet).sort((a, b) => {
        const classA = parseClass(a);
        const classB = parseClass(b);
        if (classA.number !== classB.number) return classA.number - classB.number;
        return classA.letter.localeCompare(classB.letter);
    });
  }, [allStudents]);

  const uniqueYears = useMemo(() => {
    if (!allStudents) return [];
    const yearSet = new Set<string>();
    allStudents.forEach(student => {
      const year = getYearFromStudentId(student.studentId);
      if (year) yearSet.add(year);
    });
    return Array.from(yearSet).sort((a,b) => b.localeCompare(a));
  }, [allStudents]);

  const filteredAndSortedStudents = useMemo(() => {
    let tempStudents = [...allStudents];

    if (selectedClass !== 'all') {
      tempStudents = tempStudents.filter(student => student.classGrade === selectedClass);
    }

    if (selectedYear !== 'all') {
      tempStudents = tempStudents.filter(student => getYearFromStudentId(student.studentId) === selectedYear);
    }

    tempStudents.sort((a, b) => {
      const classA = parseClass(a.classGrade);
      const classB = parseClass(b.classGrade);

      if (classA.number !== classB.number) {
        return classA.number - classB.number;
      }
      if (classA.letter !== classB.letter) {
         return classA.letter.localeCompare(classB.letter);
      }
      return a.name.localeCompare(b.name);
    });

    return tempStudents;
  }, [allStudents, selectedClass, selectedYear]);

  if (!isMounted || isLoadingStudents) {
    return (
      <div className="flex flex-col justify-center items-center h-screen space-y-4 p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">Loading Student ID Cards...</p>
      </div>
    );
  }

  if (studentsError) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] p-4">
            <Card className="w-full max-w-md text-center shadow-lg">
                <CardHeader>
                    <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-2" />
                    <CardTitle className="text-2xl text-destructive">Error Loading Students</CardTitle>
                </CardHeader>
                <CardContent>
                    <CardDescription className="mb-6">
                        Failed to load student data: {(studentsError as Error).message}. Please try again later.
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
    <div className="p-4 md:p-8">
      <header className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div className="flex-grow">
          <h1 className="text-3xl font-semibold tracking-tight text-primary">All Student ID Cards</h1>
          <p className="text-muted-foreground">Filter by grade and year, then print the selection.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-end gap-2 w-full sm:w-auto">
          <div className="w-full sm:w-auto">
            <Label htmlFor="class-filter" className="text-sm font-medium">Filter by Grade</Label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger id="class-filter" className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select Grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                {uniqueClasses.map(cls => (
                  <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
           <div className="w-full sm:w-auto">
            <Label htmlFor="year-filter" className="text-sm font-medium">Filter by Admission Year</Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger id="year-filter" className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {uniqueYears.map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>
      <div className="flex flex-col sm:flex-row justify-end items-center gap-2 w-full sm:w-auto no-print mb-6">
        <Button variant="outline" asChild className="w-full sm:w-auto">
            <Link href="/admin/students">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to List
            </Link>
          </Button>
          <Button onClick={handlePrint} disabled={filteredAndSortedStudents.length === 0} className="w-full sm:w-auto">
            <Printer className="mr-2 h-4 w-4" />
            Print Filtered Cards ({filteredAndSortedStudents.length})
          </Button>
      </div>


      {filteredAndSortedStudents.length === 0 && !isLoadingStudents && (
        <Card className="shadow-lg mt-6">
          <CardHeader className="items-center text-center">
            <AlertTriangle className="h-10 w-10 text-amber-500 mb-2" />
            <CardTitle className="text-xl">
              {selectedClass !== 'all' || selectedYear !== 'all' ? "No Matching Students" : "No Student ID Cards"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-center">
              {selectedClass !== 'all' || selectedYear !== 'all'
                ? "No students match your current filter criteria." 
                : "There are currently no student records to display ID cards for."}
            </CardDescription>
          </CardContent>
        </Card>
      )}

      {filteredAndSortedStudents.length > 0 && (
        <div className="print-grid">
          {filteredAndSortedStudents.map(student => (
            <div key={student.id} className="id-card-container">
              <StudentIdCard student={student} />
            </div>
          ))}
        </div>
      )}

      <style jsx global>{`
        .print-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); 
          gap: 1.5rem; 
        }
        
        .id-card-container {
          /* Styles for individual card wrapper in the grid view */
        }

        @media print {
          body {
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
            margin: 0.5cm; 
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
          .print-grid {
            display: grid;
            grid-template-columns: 1fr 1fr; 
            gap: 10mm 5mm; 
            width: 100%;
          }
          .id-card-container {
            page-break-inside: avoid !important; 
            break-inside: avoid !important;
            border: 1px solid #eee; 
            transform: scale(0.95); 
            transform-origin: top left;
          }
          .id-card-container > div { 
             width: 100% !important;
             max-width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
