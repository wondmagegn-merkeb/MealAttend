
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AttendanceTable, type AttendanceRecord, type SortConfig, type SortableAttendanceKeys, type MealType } from "@/components/admin/AttendanceTable";
import type { Student } from "@/types/student";
import { STUDENTS_STORAGE_KEY, ATTENDANCE_RECORDS_STORAGE_KEY } from '@/lib/constants';
import { Search, BookCopy, Calendar as CalendarIcon, ChevronLeft, ChevronRight, FilterX, FileText, FileSpreadsheet, Utensils } from "lucide-react";
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const seedAttendanceRecords: AttendanceRecord[] = [
  // Student S1001 - Alice Johnson (internal id: clxkxk001)
  { id: 'att_001', studentId: 'ADERA/STU/2024/00001', studentName: 'Alice Johnson', date: '2024-07-28', mealType: 'Lunch', scannedAt: '12:35 PM', status: 'Present' },
  { id: 'att_002', studentId: 'ADERA/STU/2024/00001', studentName: 'Alice Johnson', date: '2024-07-29', mealType: 'Lunch', scannedAt: '12:30 PM', status: 'Present' },
  { id: 'att_003', studentId: 'ADERA/STU/2024/00001', studentName: 'Alice Johnson', date: '2024-07-30', mealType: 'Lunch', scannedAt: 'N/A', status: 'Absent' },
  // Student S1002 - Bob Williams (internal id: clxkxk002)
  { id: 'att_004', studentId: 'ADERA/STU/2024/00002', studentName: 'Bob Williams', date: '2024-07-28', mealType: 'Lunch', scannedAt: '12:40 PM', status: 'Present' },
  { id: 'att_005', studentId: 'ADERA/STU/2024/00002', studentName: 'Bob Williams', date: '2024-07-29', mealType: 'Lunch', scannedAt: 'N/A', status: 'Absent' },
  { id: 'att_006', studentId: 'ADERA/STU/2024/00002', studentName: 'Bob Williams', date: '2024-07-30', mealType: 'Breakfast', scannedAt: '08:05 AM', status: 'Present' },
  // Student S1003 - Carol Davis (internal id: clxkxk003)
  { id: 'att_007', studentId: 'ADERA/STU/2023/00001', studentName: 'Carol Davis', date: '2024-07-28', mealType: 'Lunch', scannedAt: 'N/A', status: 'Absent' },
  { id: 'att_008', studentId: 'ADERA/STU/2023/00001', studentName: 'Carol Davis', date: '2024-07-29', mealType: 'Dinner', scannedAt: '07:10 PM', status: 'Present' },
  // Student S1004 - David Brown (internal id: clxkxk004)
  { id: 'att_009', studentId: 'ADERA/STU/2023/00002', studentName: 'David Brown', date: '2024-07-27', mealType: 'Dinner', scannedAt: '07:15 PM', status: 'Present' },
  { id: 'att_010', studentId: 'ADERA/STU/2023/00002', studentName: 'David Brown', date: '2024-07-30', mealType: 'Lunch', scannedAt: '12:55 PM', status: 'Present' },
  // Student S1005 - Eva Green (internal id: clxkxk005)
  { id: 'att_011', studentId: 'ADERA/STU/2022/00001', studentName: 'Eva Green', date: '2024-07-29', mealType: 'Lunch', scannedAt: '01:00 PM', status: 'Present' },
  { id: 'att_012', studentId: 'ADERA/STU/2022/00001', studentName: 'Eva Green', date: '2024-07-30', mealType: 'Dinner', scannedAt: 'N/A', status: 'Absent' },
  { id: 'att_013', studentId: 'ADERA/STU/2024/00001', studentName: 'Alice Johnson', date: '2024-08-01', mealType: 'Breakfast', scannedAt: '08:15 AM', status: 'Present' },
  { id: 'att_014', studentId: 'ADERA/STU/2024/00002', studentName: 'Bob Williams', date: '2024-08-01', mealType: 'Lunch', scannedAt: '12:30 PM', status: 'Present' },
  { id: 'att_015', studentId: 'ADERA/STU/2023/00001', studentName: 'Carol Davis', date: '2024-08-02', mealType: 'Lunch', scannedAt: 'N/A', status: 'Absent' },
];

const ITEMS_PER_PAGE = 5;
const ALL_MEAL_TYPES: MealType[] = ["Breakfast", "Lunch", "Dinner"];

interface ExportAttendanceRecord {
  studentId: string;
  studentName: string;
  date: string;
  breakfast: string;
  lunch: string;
  dinner: string;
}

const transformAttendanceForExport = (records: AttendanceRecord[]): ExportAttendanceRecord[] => {
  const groupedRecords: Record<string, Partial<ExportAttendanceRecord> & { studentName?: string }> = {};

  records.forEach(record => {
    const key = `${record.studentId}-${record.date}`;
    if (!groupedRecords[key]) {
      groupedRecords[key] = {
        studentId: record.studentId,
        studentName: record.studentName,
        date: record.date,
        breakfast: "N/A",
        lunch: "N/A",
        dinner: "N/A",
      };
    }

    let mealStatus;
    if (record.status === "Present") {
      mealStatus = `Present (${record.scannedAt})`;
    } else if (record.status === "Absent") {
      mealStatus = `Absent (N/A)`;
    } else {
      mealStatus = "N/A"; // Should not happen with current data model, but good fallback
    }
    
    if (record.mealType === "Breakfast") {
      groupedRecords[key].breakfast = mealStatus;
    } else if (record.mealType === "Lunch") {
      groupedRecords[key].lunch = mealStatus;
    } else if (record.mealType === "Dinner") {
      groupedRecords[key].dinner = mealStatus;
    }
  });

  return Object.values(groupedRecords).map(item => item as ExportAttendanceRecord)
    .sort((a, b) => { // Sort by date, then by student name
        if (a.date < b.date) return -1;
        if (a.date > b.date) return 1;
        if (a.studentName < b.studentName) return -1;
        if (a.studentName > b.studentName) return 1;
        return 0;
    });
};


export default function AttendancePage() {
  const [allAttendanceRecords, setAllAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentsMap, setStudentsMap] = useState<Map<string, Student>>(new Map());
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'date', direction: 'descending' });
  const [currentPage, setCurrentPage] = useState(1);

  const [reportStudentId, setReportStudentId] = useState<string | undefined>(undefined);
  const [reportDateRange, setReportDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedMealTypes, setSelectedMealTypes] = useState<Set<MealType>>(new Set(ALL_MEAL_TYPES));
  const [isReportView, setIsReportView] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const storedStudentsRaw = localStorage.getItem(STUDENTS_STORAGE_KEY);
      if (storedStudentsRaw) {
        const loadedStudents: Student[] = JSON.parse(storedStudentsRaw);
        setStudents(loadedStudents);
        const map = new Map<string, Student>();
        loadedStudents.forEach(s => map.set(s.studentId, s)); 
        setStudentsMap(map);
      }
    } catch (error) {
      console.error("Failed to load students from localStorage", error);
      toast({ title: "Error", description: "Could not load student data.", variant: "destructive" });
    }

    try {
      const storedAttendanceRaw = localStorage.getItem(ATTENDANCE_RECORDS_STORAGE_KEY);
      if (storedAttendanceRaw) {
        setAllAttendanceRecords(JSON.parse(storedAttendanceRaw));
      } else {
        setAllAttendanceRecords(seedAttendanceRecords);
        localStorage.setItem(ATTENDANCE_RECORDS_STORAGE_KEY, JSON.stringify(seedAttendanceRecords));
      }
    } catch (error) {
      console.error("Failed to load attendance records from localStorage", error);
      setAllAttendanceRecords(seedAttendanceRecords);
      toast({ title: "Error", description: "Could not load attendance records. Displaying default list.", variant: "destructive" });
    }
  }, [toast]);

   useEffect(() => {
    if (!isMounted) return;

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === ATTENDANCE_RECORDS_STORAGE_KEY && event.newValue) {
        try {
          setAllAttendanceRecords(JSON.parse(event.newValue));
          toast({ title: "Attendance Updated", description: "Attendance records have been updated.", variant: "default" });
        } catch (error) {
          console.error("Error parsing updated attendance records from storage event:", error);
        }
      }
       if (event.key === STUDENTS_STORAGE_KEY && event.newValue) {
        try {
          const loadedStudents: Student[] = JSON.parse(event.newValue);
          setStudents(loadedStudents);
          const map = new Map<string, Student>();
          loadedStudents.forEach(s => map.set(s.studentId, s));
          setStudentsMap(map);
        } catch (error) {
          console.error("Error parsing updated students from storage event:", error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isMounted, toast]);


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
    // Reset to page 1 when meal type filter changes if not in report view
    if (!isReportView) {
      setCurrentPage(1);
    }
  };
  
  const handleGenerateReport = () => {
    if (!reportStudentId && !reportDateRange?.from && selectedMealTypes.size === 0) { 
        toast({
          title: "Filter Required",
          description: "Please select a student, date range, or at least one meal type to generate a report.",
          variant: "default"
        });
        return;
    }
    setIsReportView(true);
    setCurrentPage(1); 
  };

  const clearReportFilters = () => {
    setReportStudentId(undefined);
    setReportDateRange(undefined);
    // setSelectedMealTypes(new Set(ALL_MEAL_TYPES)); // Keep selected meal types unless explicitly cleared by user from checkbox
    setIsReportView(false);
    // setSearchTerm(""); // Keep search term unless report view is also cleared for general searching
    setCurrentPage(1);
  };

  const processedRecords = useMemo(() => {
    let recordsToProcess = [...allAttendanceRecords];

    if (isReportView) {
      if (reportStudentId && reportStudentId !== 'all_students') { 
        recordsToProcess = recordsToProcess.filter(record => record.studentId === reportStudentId);
      }
      if (reportDateRange?.from) {
        recordsToProcess = recordsToProcess.filter(record => {
          const recordDate = startOfDay(parseISO(record.date));
          const fromDate = startOfDay(reportDateRange.from!);
          const toDate = reportDateRange.to ? endOfDay(reportDateRange.to) : endOfDay(reportDateRange.from!);
          return isWithinInterval(recordDate, { start: fromDate, end: toDate });
        });
      }
       // Apply meal type filter if it's report view and specific meal types are selected
      if (selectedMealTypes.size > 0 && selectedMealTypes.size < ALL_MEAL_TYPES.length) {
        recordsToProcess = recordsToProcess.filter(record => selectedMealTypes.has(record.mealType));
      }
    } else { // Not in report view, apply search term and global meal type filters
      if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        recordsToProcess = recordsToProcess.filter(record =>
          record.studentId.toLowerCase().includes(lowerSearchTerm) ||
          record.studentName.toLowerCase().includes(lowerSearchTerm) ||
          record.mealType.toLowerCase().includes(lowerSearchTerm) ||
          record.date.includes(searchTerm) 
        );
      }
      // Apply meal type filter globally if not all types are selected
      if (selectedMealTypes.size > 0 && selectedMealTypes.size < ALL_MEAL_TYPES.length) {
        recordsToProcess = recordsToProcess.filter(record => selectedMealTypes.has(record.mealType));
      }
    }
    
    if (sortConfig.key) {
      recordsToProcess.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];
        let comparison = 0;
        if (aValue === null || aValue === undefined) comparison = 1;
        else if (bValue === null || bValue === undefined) comparison = -1;
        else if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = aValue.localeCompare(bValue);
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue;
        } else {
          comparison = String(aValue).localeCompare(String(bValue));
        }
        return sortConfig.direction === 'ascending' ? comparison : -comparison;
      });
    }
    return recordsToProcess;
  }, [allAttendanceRecords, searchTerm, sortConfig, isReportView, reportStudentId, reportDateRange, selectedMealTypes]);
  
  const reportContext = useMemo(() => {
    let studentNameForTitle = "All Students";
    if (reportStudentId && reportStudentId !== 'all_students') {
        studentNameForTitle = students.find(s => s.studentId === reportStudentId)?.name || reportStudentId;
    }

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
      mealTypeInfoForTitle = Array.from(selectedMealTypes).join(', ');
      mealTypeInfoForFile = Array.from(selectedMealTypes).join('_').replace(/\s+/g, '');
    }
    
    const baseFileName = "Attendance_Report";
    let dynamicFileName = baseFileName;
    let dynamicDocTitle = "Attendance Report";

    if (isReportView) {
        const studentPart = (reportStudentId && reportStudentId !== 'all_students') ? studentNameForTitle.replace(/\s+/g, '_') : "All_Students";
        const datePart = reportDateRange?.from ? dateInfoForFile.replace(/\s+/g, '_').replace(/-/g,'') : "All_Dates";
        const mealPart = mealTypeInfoForFile;
        dynamicFileName = `${baseFileName}_${studentPart}_${datePart}_${mealPart}`;
        dynamicDocTitle = `Attendance Report: ${studentNameForTitle} (${dateInfoForTitle}) - Meals: ${mealTypeInfoForTitle}`;
    } else if (searchTerm) {
        const mealPart = (selectedMealTypes.size > 0 && selectedMealTypes.size < ALL_MEAL_TYPES.length) ? mealTypeInfoForFile : "All_Meals";
        dynamicFileName = `Attendance_Search_${searchTerm.replace(/\s+/g, '_')}_${mealPart}`;
        dynamicDocTitle = `Attendance Records (Search: ${searchTerm}, Meals: ${mealTypeInfoForTitle})`;
    } else { // Default view, only meal types might be filtered
        const mealPart = (selectedMealTypes.size > 0 && selectedMealTypes.size < ALL_MEAL_TYPES.length) ? mealTypeInfoForFile : "All_Meals";
        dynamicFileName = `All_Attendance_Records_${mealPart}`;
        dynamicDocTitle = `All Attendance Records (Meals: ${mealTypeInfoForTitle})`;
    }
    return { fileNameBase: dynamicFileName, docTitle: dynamicDocTitle };

  }, [isReportView, reportStudentId, students, reportDateRange, searchTerm, selectedMealTypes]);

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
      head: [['Student ID', 'Name', 'Date', 'Breakfast', 'Lunch', 'Dinner']],
      body: recordsForExport.map(record => [
        record.studentId,
        record.studentName,
        record.date,
        record.breakfast,
        record.lunch,
        record.dinner,
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
      ['Student ID', 'Name', 'Date', 'Breakfast', 'Lunch', 'Dinner'], 
      ...recordsForExport.map(record => [
        record.studentId,
        record.studentName,
        record.date,
        record.breakfast,
        record.lunch,
        record.dinner,
      ]),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(dataToExport);
    
    if (worksheet['!merges']) {
        worksheet['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }); 
    } else {
        worksheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }];
    }
    worksheet['!cols'] = [
        { wch: 20 }, // Student ID
        { wch: 25 }, // Name
        { wch: 12 }, // Date
        { wch: 20 }, // Breakfast (to accommodate "Present (HH:MM AM/PM)")
        { wch: 20 }, // Lunch
        { wch: 20 }, // Dinner
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
          <CardDescription>Filter attendance records by student, date range. Meal type filters below are always active.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
          <div>
            <Label htmlFor="student-select" className="mb-1 block text-sm font-medium">Student</Label>
            <Select value={reportStudentId} onValueChange={(value) => setReportStudentId(value === 'all_students' ? undefined : value)}>
              <SelectTrigger id="student-select">
                <SelectValue placeholder="Select a student" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_students">All Students</SelectItem>
                {students.map(student => (
                  <SelectItem key={student.id} value={student.studentId}>
                    {student.name} ({student.studentId})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="date-range" className="mb-1 block text-sm font-medium">Date Range</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date-range"
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !reportDateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {reportDateRange?.from ? (
                    reportDateRange.to ? (
                      <>
                        {format(reportDateRange.from, "LLL dd, y")} -{" "}
                        {format(reportDateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(reportDateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={reportDateRange?.from}
                  selected={reportDateRange}
                  onSelect={setReportDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="md:col-span-2 lg:col-span-3 flex flex-col sm:flex-row gap-2 pt-2">
            <Button onClick={handleGenerateReport} className="w-full sm:w-auto">Generate Report View</Button>
             <Button onClick={clearReportFilters} variant="outline" className="w-full sm:w-auto" disabled={!isReportView && !reportStudentId && !reportDateRange?.from}>
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
                        {isReportView 
                        ? `Report for ${reportStudentId && reportStudentId !== 'all_students' ? (students.find(s => s.studentId === reportStudentId)?.name || 'selected student') : 'all students'}${reportDateRange?.from ? ` from ${format(reportDateRange.from, "LLL dd, y")}` : ''}${reportDateRange?.to ? ` to ${format(reportDateRange.to, "LLL dd, y")}` : reportDateRange?.from ? '' : ''}. Meals: ${selectedMealTypes.size === ALL_MEAL_TYPES.length ? 'All' : Array.from(selectedMealTypes).join(', ') || 'None'}. Found ${processedRecords.length} record(s).`
                        : `Displaying records. Meals: ${selectedMealTypes.size === ALL_MEAL_TYPES.length ? 'All' : Array.from(selectedMealTypes).join(', ') || 'None'}. ${searchTerm ? `Search: "${searchTerm}".` : ''} Found ${processedRecords.length} record(s).`}
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
                        <Input
                        type="search"
                        placeholder="Search records by ID, name, meal, date..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="pl-10 w-full"
                        />
                    </div>
                )}
                <div className="space-y-2 md:col-start-2 md:row-start-1">
                    <Label className="mb-1 block text-sm font-medium flex items-center gap-1"><Utensils className="h-4 w-4" />Global Meal Type Filters</Label>
                    <div className="flex flex-wrap gap-x-4 gap-y-2 items-center">
                    {ALL_MEAL_TYPES.map(mealType => (
                        <div key={mealType} className="flex items-center space-x-2">
                        <Checkbox
                            id={`meal-${mealType}`}
                            checked={selectedMealTypes.has(mealType)}
                            onCheckedChange={(checked) => handleMealTypeChange(mealType, !!checked)}
                        />
                        <Label htmlFor={`meal-${mealType}`} className="text-sm font-normal cursor-pointer">
                            {mealType}
                        </Label>
                        </div>
                    ))}
                    </div>
                </div>
            </div>
        </CardHeader>
        <CardContent>
          <AttendanceTable 
            records={currentTableData} 
            sortConfig={sortConfig}
            onSort={handleSort}
            studentsMap={studentsMap} 
          />
          {processedRecords.length === 0 && (
            <p className="text-center py-4 text-muted-foreground">
              {isReportView ? "No records match your report criteria." : "No attendance records found for the current filters."}
            </p>
          )}
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
        </CardContent>
      </Card>
    </div>
  );
}
    
