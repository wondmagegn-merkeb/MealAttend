
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Printer, AlertTriangle } from 'lucide-react';
import type { Student } from '@/types/student';
import { StudentIdCard } from '@/components/admin/students/StudentIdCard';
import { STUDENTS_STORAGE_KEY } from '@/lib/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const getYearFromStudentId = (studentId: string): string | null => {
  const parts = studentId.split('/'); // "ADERA/STU/2024/00001"
  if (parts.length === 4 && /^\d{4}$/.test(parts[2])) {
    return parts[2];
  }
  return null;
};

const parseClass = (classStr: string): { number: number; letter: string } => {
  if (!classStr) return { number: Infinity, letter: '' };
  const match = classStr.match(/^(\d+)([A-Za-z]*)$/);
  if (match) {
    return { number: parseInt(match[1], 10), letter: match[2].toUpperCase() };
  }
  // Fallback for classes that don't match the number+letter pattern, or only numbers
  const numericMatch = classStr.match(/^(\d+)$/);
  if (numericMatch) {
     return { number: parseInt(numericMatch[1], 10), letter: '' };
  }
  return { number: Infinity, letter: classStr.toUpperCase() }; // Sort unparsable/non-standard last
};


export default function ViewAllIdCardsPage() {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');

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

  const uniqueClasses = useMemo(() => {
    const classSet = new Set<string>();
    students.forEach(student => {
      if (student.class) classSet.add(student.class);
    });
    return Array.from(classSet).sort((a, b) => {
        const classA = parseClass(a);
        const classB = parseClass(b);
        if (classA.number !== classB.number) return classA.number - classB.number;
        return classA.letter.localeCompare(classB.letter);
    });
  }, [students]);

  const uniqueYears = useMemo(() => {
    const yearSet = new Set<string>();
    students.forEach(student => {
      const year = getYearFromStudentId(student.studentId);
      if (year) yearSet.add(year);
    });
    return Array.from(yearSet).sort((a,b) => b.localeCompare(a)); // Sort years descending
  }, [students]);

  const filteredAndSortedStudents = useMemo(() => {
    let tempStudents = [...students];

    if (selectedClass !== 'all') {
      tempStudents = tempStudents.filter(student => student.class === selectedClass);
    }

    if (selectedYear !== 'all') {
      tempStudents = tempStudents.filter(student => getYearFromStudentId(student.studentId) === selectedYear);
    }

    // Sort by class (number then letter), then by name
    tempStudents.sort((a, b) => {
      const classA = parseClass(a.class);
      const classB = parseClass(b.class);

      if (classA.number !== classB.number) {
        return classA.number - classB.number;
      }
      if (classA.letter !== classB.letter) {
         return classA.letter.localeCompare(classB.letter); // Corrected typo here
      }
      return a.name.localeCompare(b.name); // Secondary sort by name
    });

    return tempStudents;
  }, [students, selectedClass, selectedYear]);

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
            <Label htmlFor="year-filter" className="text-sm font-medium">Filter by Year</Label>
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


      {filteredAndSortedStudents.length === 0 && !isLoading && (
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
                : "There are currently no student records. Please add students first."}
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
