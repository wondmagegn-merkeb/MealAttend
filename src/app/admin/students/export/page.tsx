
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, FileText, FileSpreadsheet, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { mockStudents } from '@/lib/demo-data';
import type { Student } from '@/types';


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

const ITEMS_PER_PAGE_DISPLAY = 10;

export default function ExportStudentsPage() {
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);
  
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Using mock data instead of useQuery
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [studentsError, setStudentsError] = useState<Error | null>(null);

  useEffect(() => {
    setIsLoadingStudents(true);
    setTimeout(() => {
        setAllStudents(mockStudents);
        setIsLoadingStudents(false);
    }, 500);
  }, []);

  useEffect(() => {
    setIsMounted(true);
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

  const filteredStudents = useMemo(() => {
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
      if (classA.number !== classB.number) return classA.number - classB.number;
      if (classA.letter !== classB.letter) return classA.letter.localeCompare(classB.letter);
      return a.name.localeCompare(b.name);
    });

    return tempStudents;
  }, [allStudents, selectedClass, selectedYear]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / ITEMS_PER_PAGE_DISPLAY));

  const currentTableData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE_DISPLAY;
    const endIndex = startIndex + ITEMS_PER_PAGE_DISPLAY;
    return filteredStudents.slice(startIndex, endIndex);
  }, [filteredStudents, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedClass, selectedYear]);
  
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    } else if (currentPage < 1 && totalPages > 0) {
        setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const generatedHeaderTitle = useMemo(() => {
    const gradeText = selectedClass === 'all' ? 'All Grades' : `Grade ${selectedClass}`;
    const yearText = selectedYear === 'all' ? 'All Years' : `Admission Year ${selectedYear}`;
    return `Student List - ${gradeText} - ${yearText}`;
  }, [selectedClass, selectedYear]);

  const handleExportPDF = useCallback(() => {
    if (filteredStudents.length === 0) {
      toast({ title: "No Data", description: "There is no data to export to PDF.", variant: "default" });
      return;
    }
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(generatedHeaderTitle, 14, 15);
    
    autoTable(doc, {
      startY: 25,
      head: [['Student ID', 'Name', 'Gender', 'Grade']],
      body: filteredStudents.map(student => [
        student.studentId,
        student.name,
        student.gender || 'N/A',
        student.classGrade || 'N/A',
      ]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [22, 160, 133] },
      margin: { top: 20 },
    });

    const fileName = `student_list${selectedClass !== 'all' ? `_grade_${selectedClass.replace(/\s+/g, '_')}` : ''}${selectedYear !== 'all' ? `_year_${selectedYear}` : ''}.pdf`;
    doc.save(fileName);
    toast({ title: "PDF Exported", description: `Successfully exported ${filteredStudents.length} records to ${fileName}.` });
  }, [filteredStudents, generatedHeaderTitle, selectedClass, selectedYear, toast]);

  const handleExportExcel = useCallback(() => {
    if (filteredStudents.length === 0) {
      toast({ title: "No Data", description: "There is no data to export to Excel.", variant: "default" });
      return;
    }

    const dataToExport = [
      [generatedHeaderTitle], 
      [], 
      ['Student ID', 'Name', 'Gender', 'Grade'], 
      ...filteredStudents.map(student => [
        student.studentId,
        student.name,
        student.gender || 'N/A',
        student.classGrade || 'N/A',
      ]),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(dataToExport);
    
     if (worksheet['!merges']) {
        worksheet['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }); 
    } else {
        worksheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }];
    }
    worksheet['!cols'] = [{wch:20},{wch:30},{wch:10},{wch:10}];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
    
    const fileName = `student_list${selectedClass !== 'all' ? `_grade_${selectedClass.replace(/\s+/g, '_')}` : ''}${selectedYear !== 'all' ? `_year_${selectedYear}` : ''}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    toast({ title: "Excel Exported", description: `Successfully exported ${filteredStudents.length} records to ${fileName}.` });
  }, [filteredStudents, generatedHeaderTitle, selectedClass, selectedYear, toast]);


  if (!isMounted || isLoadingStudents) {
    return (
      <div className="flex flex-col justify-center items-center h-screen space-y-4 p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">Loading Student Data...</p>
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
                        Failed to load student data: {studentsError.message}. Please try again later.
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
    <div className="space-y-6 p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-primary">Export Student List</h1>
          <p className="text-muted-foreground">Filter students by grade and/or admission year, then export the data.</p>
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
          <CardDescription>Select grade and year to filter the student list for export.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="class-filter">Filter by Grade</Label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger id="class-filter">
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
          <div>
            <Label htmlFor="year-filter">Filter by Admission Year</Label>
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <CardTitle>Filtered Student Data</CardTitle>
              <CardDescription>
                Review the filtered student list. {filteredStudents.length} record(s) found. Export options below.
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button onClick={handleExportPDF} disabled={filteredStudents.length === 0} className="w-full sm:w-auto">
                    <FileText className="mr-2 h-4 w-4" />
                    Export to PDF
                </Button>
                <Button onClick={handleExportExcel} disabled={filteredStudents.length === 0} className="w-full sm:w-auto">
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Export to Excel
                </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 bg-muted/60 rounded-md border border-border">
            <h3 className="text-lg font-semibold text-primary text-center">{generatedHeaderTitle}</h3>
          </div>
          {filteredStudents.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No students match your filter criteria.</p>
          ) : (
            <>
            <div className="overflow-x-auto rounded-md border">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">Student ID</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">Name</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">Gender</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-background">
                  {currentTableData.map(student => (
                    <tr key={student.id}>
                      <td className="px-4 py-2 whitespace-nowrap">{student.studentId}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{student.name}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{student.gender || 'N/A'}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{student.classGrade || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredStudents.length > ITEMS_PER_PAGE_DISPLAY && (
              <div className="flex items-center justify-between pt-4 mt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages} ({filteredStudents.length} records)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
