
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AttendanceTable, type SortConfig, type SortableAttendanceKeys } from "@/components/admin/AttendanceTable";
import { Search, BookCopy, Calendar as CalendarIcon, ChevronLeft, ChevronRight, FilterX, FileText, FileSpreadsheet, Utensils, AlertTriangle, Loader2, ChevronsUpDown, Check } from "lucide-react";
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { AttendanceRecordWithStudent, Student, MealType } from '@/types';
import { AuthGuard } from '@/components/auth/AuthGuard';

const fetchAttendanceRecords = async (): Promise<AttendanceRecordWithStudent[]> => {
  const response = await fetch('/api/attendance');
  if (!response.ok) throw new Error('Failed to fetch attendance records');
  return response.json();
};

const fetchStudents = async (): Promise<Student[]> => {
  const response = await fetch('/api/students');
  if (!response.ok) throw new Error('Failed to fetch students');
  return response.json();
};

const ALL_MEAL_TYPES: MealType[] = ["BREAKFAST", "LUNCH", "DINNER"];
const ITEMS_PER_PAGE = 5;

interface ExportAttendanceRecord {
  studentId: string;
  studentName: string;
  date: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  scannedBy: string;
}

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

const transformAttendanceForExport = (records: AttendanceRecordWithStudent[]): ExportAttendanceRecord[] => {
  const groupedRecords: Record<string, Partial<ExportAttendanceRecord> & { studentName?: string, scannedBySet: Set<string> }> = {};

  records.forEach(record => {
    const recordDateStr = format(parseISO(record.recordDate as unknown as string), 'yyyy-MM-dd');
    const key = `${record.student.studentId}-${recordDateStr}`;

    if (!groupedRecords[key]) {
      groupedRecords[key] = {
        studentId: record.student.studentId,
        studentName: record.student.name,
        date: recordDateStr,
        breakfast: "Absent",
        lunch: "Absent",
        dinner: "Absent",
        scannedBySet: new Set(),
      };
    }

    let mealStatus;
    if (record.status === "PRESENT") {
        mealStatus = record.scannedAtTimestamp ? `Present (${format(parseISO(record.scannedAtTimestamp as unknown as string), 'hh:mm a')})` : 'Present';
        if (record.scannedBy?.fullName) {
            groupedRecords[key].scannedBySet.add(record.scannedBy.fullName);
        }
    } else if (record.status === "ABSENT") {
        mealStatus = `Absent`;
    } else {
        mealStatus = "N/A";
    }

    if (record.mealType === "BREAKFAST") {
      groupedRecords[key].breakfast = mealStatus;
    } else if (record.mealType === "LUNCH") {
      groupedRecords[key].lunch = mealStatus;
    } else if (record.mealType === "DINNER") {
      groupedRecords[key].dinner = mealStatus;
    }
  });

  return Object.values(groupedRecords).map(item => ({
      ...item,
      scannedBy: item.scannedBySet.size > 0 ? Array.from(item.scannedBySet).join(', ') : 'N/A'
  } as ExportAttendanceRecord))
    .sort((a, b) => {
        if (a.date < b.date) return -1;
        if (a.date > b.date) return 1;
        if (a.studentName < b.studentName) return -1;
        if (a.studentName > b.studentName) return 1;
        return 0;
    });
};

function AttendancePageContent() {
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'recordDate', direction: 'descending' });
  const [currentPage, setCurrentPage] = useState(1);

  const [reportStudentId, setReportStudentId] = useState<string | undefined>(undefined);
  const [reportSelectedClass, setReportSelectedClass] = useState<string | undefined>(undefined);
  const [reportDateRange, setReportDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedMealTypes, setSelectedMealTypes] = useState<Set<MealType>>(new Set(ALL_MEAL_TYPES));
  const [isReportView, setIsReportView] = useState(false);

  // States for combobox functionality
  const [studentSearch, setStudentSearch] = useState('');
  const [isStudentPopoverOpen, setStudentPopoverOpen] = useState(false);
  const [classSearch, setClassSearch] = useState('');
  const [isClassPopoverOpen, setClassPopoverOpen] = useState(false);
  
  const { data: allAttendanceRecords = [], isLoading: isLoadingAttendance, error: attendanceError } = useQuery<AttendanceRecordWithStudent[]>({
    queryKey: ['attendanceRecords'],
    queryFn: fetchAttendanceRecords,
  });

  const { data: students = [], isLoading: isLoadingStudents, error: studentsError } = useQuery<Student[]>({
    queryKey: ['students'],
    queryFn: fetchStudents,
  });

  const isLoading = isLoadingAttendance || isLoadingStudents;
  const error = attendanceError || studentsError;


  const uniqueClasses = useMemo(() => {
    if (!students.length) return [];
    const classSet = new Set<string>();
    students.forEach(student => {
        if (student.classGrade) classSet.add(student.classGrade);
    });
    return Array.from(classSet).sort((a, b) => {
        const classA = parseClass(a);
        const classB = parseClass(b);
        if (classA.number !== classB.number) return classA.number - classB.number;
        return classA.letter.localeCompare(b.letter);
    });
  }, [students]);

  const handleSort = (key: SortableAttendanceKeys) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
    setIsReportView(false); 
  };

  const handleMealTypeChange = (mealType: MealType, checked: boolean) => {
    setSelectedMealTypes(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(mealType);
      } else {
        newSet.delete(mealType);
      }
      return newSet;
    });
    if (!isReportView) {
      setCurrentPage(1);
    }
  };
  
  const handleGenerateReport = () => {
    if (!reportStudentId && !reportSelectedClass && !reportDateRange?.from && selectedMealTypes.size === 0) { 
        toast({
          title: "Filter Required",
          description: "Please select a student, class, date range, or at least one meal type to generate a report.",
          variant: "default"
        });
        return;
    }
    setIsReportView(true);
    setCurrentPage(1); 
  };

  const clearReportFilters = () => {
    setReportStudentId(undefined);
    setReportSelectedClass(undefined);
    setReportDateRange(undefined);
    setIsReportView(false);
    setCurrentPage(1);
  };

  const processedRecords = useMemo(() => {
    let recordsToProcess = [...allAttendanceRecords];

    if (isReportView) {
      if (reportStudentId && reportStudentId !== 'all_students') { 
        recordsToProcess = recordsToProcess.filter(record => record.student.studentId === reportStudentId);
      }
      if (reportSelectedClass) {
        recordsToProcess = recordsToProcess.filter(record => record.student.classGrade === reportSelectedClass);
      }
      if (reportDateRange?.from) {
        recordsToProcess = recordsToProcess.filter(record => {
          const recordDate = startOfDay(parseISO(record.recordDate as unknown as string));
          const fromDate = startOfDay(reportDateRange.from!);
          const toDate = reportDateRange.to ? endOfDay(reportDateRange.to) : endOfDay(reportDateRange.from!);
          return isWithinInterval(recordDate, { start: fromDate, end: toDate });
        });
      }
      if (selectedMealTypes.size > 0 && selectedMealTypes.size < ALL_MEAL_TYPES.length) {
        recordsToProcess = recordsToProcess.filter(record => selectedMealTypes.has(record.mealType as MealType));
      }
    } else {
      if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        recordsToProcess = recordsToProcess.filter(record =>
          record.student.studentId.toLowerCase().includes(lowerSearchTerm) ||
          record.student.name.toLowerCase().includes(lowerSearchTerm) ||
          record.mealType.toLowerCase().includes(lowerSearchTerm) ||
          record.scannedBy?.fullName.toLowerCase().includes(lowerSearchTerm) ||
          format(parseISO(record.recordDate as unknown as string), 'yyyy-MM-dd').includes(searchTerm)
        );
      }
      if (selectedMealTypes.size > 0 && selectedMealTypes.size < ALL_MEAL_TYPES.length) {
        recordsToProcess = recordsToProcess.filter(record => selectedMealTypes.has(record.mealType as MealType));
      }
    }
    
    if (sortConfig.key) {
      recordsToProcess.sort((a, b) => {
        let aVal, bVal;
        switch(sortConfig.key) {
          case 'studentName':
            aVal = a.student.name;
            bVal = b.student.name;
            break;
          case 'studentId':
            aVal = a.student.studentId;
            bVal = b.student.studentId;
            break;
          case 'scannedBy':
            aVal = a.scannedBy?.fullName;
            bVal = b.scannedBy?.fullName;
            break;
          default:
            aVal = a[sortConfig.key!];
            bVal = b[sortConfig.key!];
        }
        
        let comparison = 0;
        if (aVal === null || aVal === undefined) comparison = 1;
        else if (bVal === null || bVal === undefined) comparison = -1;
        else if (typeof aVal === 'string' && typeof bVal === 'string') {
          comparison = aVal.localeCompare(bVal);
        } else if (aVal instanceof Date && bVal instanceof Date) {
          comparison = aVal.getTime() - bVal.getTime();
        } else {
          comparison = String(aVal).localeCompare(String(bVal));
        }
        return sortConfig.direction === 'ascending' ? comparison : -comparison;
      });
    }
    return recordsToProcess;
  }, [allAttendanceRecords, searchTerm, sortConfig, isReportView, reportStudentId, reportSelectedClass, reportDateRange, selectedMealTypes]);
  
  const reportContext = useMemo(() => {
    let studentNameForTitle = "All Students";
    if (reportStudentId && reportStudentId !== 'all_students') {
        studentNameForTitle = students.find(s => s.studentId === reportStudentId)?.name || reportStudentId;
    }
    const classInfoForTitle = reportSelectedClass ? `Class ${reportSelectedClass}` : "All Classes";
    const classInfoForFile = reportSelectedClass ? `Class_${reportSelectedClass.replace(/\s+/g, '_')}` : "All_Classes";
    
    let dateInfoForTitle = "All Dates";
    let dateInfoForFile = "All_Dates";
    if (reportDateRange?.from) {
        dateInfoForTitle = `From ${format(reportDateRange.from, "LLL dd, y")}`;
        dateInfoForFile = `From_${format(reportDateRange.from, "yyyy-MM-dd")}`;
        if (reportDateRange.to) {
            dateInfoForTitle += ` To ${format(reportDateRange.to, "LLL dd, y")}`;
            dateInfoForFile += `_To_${format(reportDateRange.to, "yyyy-MM-dd")}`;
        } else {
             dateInfoForTitle = `On ${format(reportDateRange.from, "LLL dd, y")}`; 
             dateInfoForFile = `On_${format(reportDateRange.from, "yyyy-MM-dd")}`;
        }
    }

    let mealTypeInfoForTitle = "All Meal Types";
    let mealTypeInfoForFile = "All_Meals";
    if (selectedMealTypes.size > 0 && selectedMealTypes.size < ALL_MEAL_TYPES.length) {
      mealTypeInfoForTitle = Array.from(selectedMealTypes).map(m => m.charAt(0) + m.slice(1).toLowerCase()).join(', ');
      mealTypeInfoForFile = Array.from(selectedMealTypes).join('_').replace(/\s+/g, '');
    }
    
    const baseFileName = "Attendance_Report";
    let dynamicFileName = baseFileName;
    let dynamicDocTitle = "Attendance Report";

    if (isReportView) {
        const studentPart = (reportStudentId && reportStudentId !== 'all_students') ? studentNameForTitle.replace(/\s+/g, '_') : "All_Students";
        const classPart = classInfoForFile;
        const datePart = reportDateRange?.from ? dateInfoForFile.replace(/\s+/g, '_').replace(/-/g,'') : "All_Dates";
        const mealPart = mealTypeInfoForFile;
        dynamicFileName = `${baseFileName}_${studentPart}_${classPart}_${datePart}_${mealPart}`;
        dynamicDocTitle = `Attendance Report: ${studentNameForTitle}, ${classInfoForTitle}, (${dateInfoForTitle}) - Meals: ${mealTypeInfoForTitle}`;
    } else if (searchTerm) {
        const mealPart = (selectedMealTypes.size > 0 && selectedMealTypes.size < ALL_MEAL_TYPES.length) ? mealTypeInfoForFile : "All_Meals";
        dynamicFileName = `Attendance_Search_${searchTerm.replace(/\s+/g, '_')}_${mealPart}`;
        dynamicDocTitle = `Attendance Records (Search: ${searchTerm}, Meals: ${mealTypeInfoForTitle})`;
    } else {
        const mealPart = (selectedMealTypes.size > 0 && selectedMealTypes.size < ALL_MEAL_TYPES.length) ? mealTypeInfoForFile : "All_Meals";
        dynamicFileName = `All_Attendance_Records_${mealPart}`;
        dynamicDocTitle = `All Attendance Records (Meals: ${mealTypeInfoForTitle})`;
    }
    return { fileNameBase: dynamicFileName, docTitle: dynamicDocTitle };
  }, [isReportView, reportStudentId, students, reportSelectedClass, reportDateRange, searchTerm, selectedMealTypes]);

  const handleExportPDF = useCallback(() => {
    const recordsForExport = transformAttendanceForExport(processedRecords);
    if (recordsForExport.length === 0) {
      toast({ title: "No Data", description: "There is no data to export to PDF.", variant: "default" });
      return;
    }
    const doc = new jsPDF();
    const { fileNameBase, docTitle } = reportContext;

    doc.setFontSize(16);
    doc.text(docTitle, 14, 15);
    
    autoTable(doc, {
      startY: 25,
      head: [['Student ID', 'Name', 'Date', 'Breakfast', 'Lunch', 'Dinner', 'Scanned By']],
      body: recordsForExport.map(record => [
        record.studentId,
        record.studentName,
        record.date,
        record.breakfast,
        record.lunch,
        record.dinner,
        record.scannedBy,
      ]),
      styles: { fontSize: 8 }, 
      headStyles: { fillColor: [22, 160, 133] }, 
      margin: { top: 20 },
    });

    doc.save(`${fileNameBase}.pdf`);
    toast({ title: "PDF Exported", description: `Successfully exported ${recordsForExport.length} daily records to ${fileNameBase}.pdf.` });
  }, [processedRecords, reportContext, toast]);

  const handleExportExcel = useCallback(() => {
    const recordsForExport = transformAttendanceForExport(processedRecords);
    if (recordsForExport.length === 0) {
      toast({ title: "No Data", description: "There is no data to export to Excel.", variant: "default" });
      return;
    }
    const { fileNameBase, docTitle } = reportContext;

    const dataToExport = [
      [docTitle], 
      [], 
      ['Student ID', 'Name', 'Date', 'Breakfast', 'Lunch', 'Dinner', 'Scanned By'], 
      ...recordsForExport.map(record => [
        record.studentId,
        record.studentName,
        record.date,
        record.breakfast,
        record.lunch,
        record.dinner,
        record.scannedBy,
      ]),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(dataToExport);
    
    if (worksheet['!merges']) {
        worksheet['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }); 
    } else {
        worksheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }];
    }
    worksheet['!cols'] = [
        { wch: 20 }, { wch: 25 }, { wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 25 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');
    
    XLSX.writeFile(workbook, `${fileNameBase}.xlsx`);
    toast({ title: "Excel Exported", description: `Successfully exported ${recordsForExport.length} daily records to ${fileNameBase}.xlsx.` });
  }, [processedRecords, reportContext, toast]);

  const totalPages = Math.max(1, Math.ceil(processedRecords.length / ITEMS_PER_PAGE));
  
  const currentTableData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return processedRecords.slice(startIndex, endIndex);
  }, [processedRecords, currentPage]);

   useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) { 
      setCurrentPage(totalPages);
    } else if (currentPage < 1 && totalPages > 0) {
        setCurrentPage(1);
    } else if (processedRecords.length === 0){
        setCurrentPage(1);
    }
  }, [currentPage, totalPages, processedRecords.length]);
  
  const filteredStudents = useMemo(() => {
    if (!students) return [];
    if (!studentSearch) return students;
    return students.filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase()));
  }, [students, studentSearch]);

  const filteredClasses = useMemo(() => {
    if (!uniqueClasses) return [];
    if (!classSearch) return uniqueClasses;
    return uniqueClasses.filter(c => c.toLowerCase().includes(classSearch.toLowerCase()));
  }, [uniqueClasses, classSearch]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-primary">Attendance Records</h2>
          <p className="text-muted-foreground">View and manage all meal attendance records.</p>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BookCopy className="h-5 w-5" /> Attendance Report Filters</CardTitle>
          <CardDescription>Filter attendance records by student, class, and date range. Meal type filters below are always active.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
          <div>
            <Label htmlFor="student-select" className="mb-1 block text-sm font-medium">Student</Label>
            <Popover open={isStudentPopoverOpen} onOpenChange={setStudentPopoverOpen}>
              <PopoverTrigger asChild>
                 <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isStudentPopoverOpen}
                    className="w-full justify-between"
                  >
                   <span className="truncate">
                    {reportStudentId
                      ? students.find((s) => s.studentId === reportStudentId)?.name
                      : "Select a student"}
                   </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                  <Input 
                      placeholder="Search student..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="m-1 w-[calc(100%-0.5rem)] border-0 shadow-none focus-visible:ring-0"
                  />
                  <ScrollArea className="h-48">
                    <div 
                      onClick={() => { setReportStudentId(undefined); setStudentPopoverOpen(false); }}
                      className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent"
                    >
                      All Students
                    </div>
                    {filteredStudents.map(student => (
                      <div 
                        key={student.id} 
                        onClick={() => { setReportStudentId(student.studentId); setStudentPopoverOpen(false); }}
                        className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent"
                      >
                         <Check className={cn("mr-2 h-4 w-4", reportStudentId === student.studentId ? "opacity-100" : "opacity-0")} />
                         {student.name} ({student.studentId})
                      </div>
                    ))}
                    {filteredStudents.length === 0 && <p className="p-2 text-center text-sm text-muted-foreground">No students found.</p>}
                  </ScrollArea>
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="class-select" className="mb-1 block text-sm font-medium">Class/Grade</Label>
            <Popover open={isClassPopoverOpen} onOpenChange={setClassPopoverOpen}>
               <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={isClassPopoverOpen} className="w-full justify-between">
                     <span className="truncate">
                      {reportSelectedClass
                        ? `Class ${reportSelectedClass}`
                        : "Select a class"}
                     </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                    <Input 
                        placeholder="Search class..."
                        value={classSearch}
                        onChange={(e) => setClassSearch(e.target.value)}
                        className="m-1 w-[calc(100%-0.5rem)] border-0 shadow-none focus-visible:ring-0"
                    />
                    <ScrollArea className="h-48">
                        <div onClick={() => { setReportSelectedClass(undefined); setClassPopoverOpen(false); }} className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent">
                          All Classes
                        </div>
                        {filteredClasses.map(cls => (
                           <div key={cls} onClick={() => { setReportSelectedClass(cls); setClassPopoverOpen(false); }} className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent">
                            <Check className={cn("mr-2 h-4 w-4", reportSelectedClass === cls ? "opacity-100" : "opacity-0")} />
                            {cls}
                           </div>
                        ))}
                        {filteredClasses.length === 0 && <p className="p-2 text-center text-sm text-muted-foreground">No classes found.</p>}
                    </ScrollArea>
                </PopoverContent>
            </Popover>
          </div>
          
          <div>
            <Label htmlFor="date-range" className="mb-1 block text-sm font-medium">Date Range</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button id="date-range" variant={"outline"} className={cn("w-full justify-start text-left font-normal", !reportDateRange && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {reportDateRange?.from ? (reportDateRange.to ? (<>{format(reportDateRange.from, "LLL dd, y")} - {format(reportDateRange.to, "LLL dd, y")}</>) : (format(reportDateRange.from, "LLL dd, y"))) : (<span>Pick a date range</span>)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar initialFocus mode="range" defaultMonth={reportDateRange?.from} selected={reportDateRange} onSelect={setReportDateRange} numberOfMonths={2} />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="md:col-span-2 lg:col-span-4 flex flex-col sm:flex-row gap-2 pt-2">
            <Button onClick={handleGenerateReport} className="w-full sm:w-auto">Generate Report View</Button>
             <Button onClick={clearReportFilters} variant="outline" className="w-full sm:w-auto" disabled={!isReportView && !reportStudentId && !reportSelectedClass && !reportDateRange?.from}>
                <FilterX className="mr-2 h-4 w-4" /> Clear Report Filters
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                    <CardTitle>{isReportView ? "Report Results" : "Filtered Records"}</CardTitle>
                    <CardDescription>
                      {isLoading ? "Loading records..." : (
                        isReportView 
                        ? `Report for ${reportStudentId && reportStudentId !== 'all_students' ? (students.find(s => s.studentId === reportStudentId)?.name || 'selected student') : 'all students'}${reportSelectedClass ? `, Class: ${reportSelectedClass}` : ''}${reportDateRange?.from ? ` from ${format(reportDateRange.from, "LLL dd, y")}` : ''}${reportDateRange?.to ? ` to ${format(reportDateRange.to, "LLL dd, y")}` : reportDateRange?.from ? '' : ''}. Meals: ${selectedMealTypes.size === ALL_MEAL_TYPES.length ? 'All' : Array.from(selectedMealTypes).map(m => m.charAt(0) + m.slice(1).toLowerCase()).join(', ') || 'None'}. Found ${processedRecords.length} record(s).`
                        : `Displaying records. Meals: ${selectedMealTypes.size === ALL_MEAL_TYPES.length ? 'All' : Array.from(selectedMealTypes).map(m => m.charAt(0) + m.slice(1).toLowerCase()).join(', ') || 'None'}. ${searchTerm ? `Search: "${searchTerm}".` : ''} Found ${processedRecords.length} record(s).`
                      )}
                    </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:ml-auto">
                    <Button onClick={handleExportPDF} disabled={processedRecords.length === 0} variant="outline" size="sm">
                        <FileText className="mr-2 h-4 w-4" /> Export PDF
                    </Button>
                    <Button onClick={handleExportExcel} disabled={processedRecords.length === 0} variant="outline" size="sm">
                        <FileSpreadsheet className="mr-2 h-4 w-4" /> Export Excel
                    </Button>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {!isReportView && (
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type="search" placeholder="Search records by ID, name, meal, scanner..." value={searchTerm} onChange={handleSearchChange} className="pl-10 w-full" />
                    </div>
                )}
                <div className="space-y-2 md:col-start-2 md:row-start-1">
                    <Label className="mb-1 block text-sm font-medium flex items-center gap-1"><Utensils className="h-4 w-4" />Global Meal Type Filters</Label>
                    <div className="flex flex-wrap gap-x-4 gap-y-2 items-center">
                    {ALL_MEAL_TYPES.map(mealType => (
                        <div key={mealType} className="flex items-center space-x-2">
                        <Checkbox id={`meal-${mealType}`} checked={selectedMealTypes.has(mealType)} onCheckedChange={(checked) => handleMealTypeChange(mealType, !!checked)} />
                        <Label htmlFor={`meal-${mealType}`} className="text-sm font-normal cursor-pointer">
                            {mealType.charAt(0) + mealType.slice(1).toLowerCase()}
                        </Label>
                        </div>
                    ))}
                    </div>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /><span className="ml-2">Loading attendance...</span></div>
            ) : error ? (
                <div className="text-center py-10 text-destructive"><AlertTriangle className="mx-auto h-8 w-8 mb-2" /><p>Error: {(error as Error).message}</p></div>
            ) : processedRecords.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">{isReportView ? "No records match your report criteria." : "No attendance records found for the current filters."}</p>
            ) : (
                <>
                    <AttendanceTable records={currentTableData} sortConfig={sortConfig} onSort={handleSort} />
                    {processedRecords.length > ITEMS_PER_PAGE && (
                        <div className="flex items-center justify-between pt-4 mt-4 border-t">
                            <p className="text-sm text-muted-foreground">
                                Page {currentPage} of {totalPages} ({processedRecords.length} records)
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


export default function AttendancePage() {
    return (
        <AuthGuard permission="canReadAttendance">
            <AttendancePageContent />
        </AuthGuard>
    )
}

    
