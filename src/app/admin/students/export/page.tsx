
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Copy, Check } from 'lucide-react';
import type { Student } from '@/types/student';
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
  const numericMatch = classStr.match(/^(\d+)$/);
  if (numericMatch) {
     return { number: parseInt(numericMatch[1], 10), letter: '' };
  }
  return { number: Infinity, letter: classStr.toUpperCase() };
};

export default function ExportStudentsPage() {
  const { toast } = useToast();
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');

  useEffect(() => {
    setIsMounted(true);
    setIsLoading(true);
    try {
      const storedStudentsRaw = localStorage.getItem(STUDENTS_STORAGE_KEY);
      if (storedStudentsRaw) {
        const loadedStudents: Student[] = JSON.parse(storedStudentsRaw);
        setAllStudents(loadedStudents);
      } else {
        setAllStudents([]);
      }
    } catch (error) {
      console.error("Failed to load students from localStorage", error);
      setAllStudents([]);
      toast({
        title: "Error Loading Data",
        description: "Could not load student data from local storage.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const uniqueClasses = useMemo(() => {
    const classSet = new Set<string>();
    allStudents.forEach(student => {
      if (student.class) classSet.add(student.class);
    });
    return Array.from(classSet).sort((a, b) => {
      const classA = parseClass(a);
      const classB = parseClass(b);
      if (classA.number !== classB.number) return classA.number - classB.number;
      return classA.letter.localeCompare(classB.letter);
    });
  }, [allStudents]);

  const uniqueYears = useMemo(() => {
    const yearSet = new Set<string>();
    allStudents.forEach(student => {
      const year = getYearFromStudentId(student.studentId);
      if (year) yearSet.add(year);
    });
    return Array.from(yearSet).sort((a,b) => b.localeCompare(a));
  }, [allStudents]);

  const filteredStudents = useMemo(() => {
    let tempStudents = [...allStudents];

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
      if (classA.number !== classB.number) return classA.number - classB.number;
      if (classA.letter !== classB.letter) return classA.letter.localeCompare(classB.letter);
      return a.name.localeCompare(b.name);
    });

    return tempStudents;
  }, [allStudents, selectedClass, selectedYear]);

  const handleCopyToClipboard = useCallback(() => {
    if (filteredStudents.length === 0) {
      toast({ title: "No Data", description: "There is no data to copy.", variant: "default" });
      return;
    }

    // Headers for TSV
    const headers = ["Student ID", "Name", "Gender", "Class"];
    const dataRows = filteredStudents.map(student => 
      [student.studentId, student.name, student.gender, student.class].join('\t')
    );
    const tsvData = [headers.join('\t'), ...dataRows].join('\n');

    navigator.clipboard.writeText(tsvData).then(() => {
      toast({ title: "Copied to Clipboard", description: `${filteredStudents.length} student records copied.` });
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    }).catch(err => {
      console.error("Failed to copy to clipboard:", err);
      toast({ title: "Copy Failed", description: "Could not copy data to clipboard. See console for details.", variant: "destructive" });
    });
  }, [filteredStudents, toast]);


  if (!isMounted || isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen space-y-4 p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">Loading Student Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-primary">Export Student List</h1>
          <p className="text-muted-foreground">Filter students by class and/or year, then copy the data.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/students">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Student List
          </Link>
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Filter Options</CardTitle>
          <CardDescription>Select class and year to filter the student list for export.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="class-filter">Filter by Class</Label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger id="class-filter">
                <SelectValue placeholder="Select Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {uniqueClasses.map(cls => (
                  <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="year-filter">Filter by Year</Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger id="year-filter">
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
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Filtered Student Data ({filteredStudents.length} records)</CardTitle>
              <CardDescription>The table below shows students matching your filters.</CardDescription>
            </div>
            <Button onClick={handleCopyToClipboard} disabled={filteredStudents.length === 0}>
              {hasCopied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {hasCopied ? 'Copied!' : 'Copy Table Data'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredStudents.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No students match your filter criteria.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">Student ID</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">Name</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">Gender</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">Class</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-background">
                  {filteredStudents.map(student => (
                    <tr key={student.id}>
                      <td className="px-4 py-2 whitespace-nowrap">{student.studentId}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{student.name}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{student.gender}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{student.class}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

    