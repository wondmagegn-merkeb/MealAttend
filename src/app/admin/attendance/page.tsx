
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AttendanceTable, type AttendanceRecord, type SortConfig, type SortableAttendanceKeys } from "@/components/admin/AttendanceTable";
import type { Student } from "@/types/student";
import { STUDENTS_STORAGE_KEY } from '@/lib/constants';
import { Search, BookCopy, Calendar as CalendarIcon, ChevronLeft, ChevronRight, FilterX } from "lucide-react";
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';

const initialAttendanceRecords: AttendanceRecord[] = [
  // Student S1001 - Alice Johnson
  { id: 'att_001', studentId: 'S1001', studentName: 'Alice Johnson', studentEmail: 'alice.johnson@example.com', date: '2024-07-28', mealType: 'Lunch', scannedAt: '12:35 PM', status: 'Present' },
  { id: 'att_002', studentId: 'S1001', studentName: 'Alice Johnson', studentEmail: 'alice.johnson@example.com', date: '2024-07-29', mealType: 'Lunch', scannedAt: '12:30 PM', status: 'Present' },
  { id: 'att_003', studentId: 'S1001', studentName: 'Alice Johnson', studentEmail: 'alice.johnson@example.com', date: '2024-07-30', mealType: 'Lunch', scannedAt: 'N/A', status: 'Absent' },
  // Student S1002 - Bob Williams
  { id: 'att_004', studentId: 'S1002', studentName: 'Bob Williams', studentEmail: 'bob.williams@example.com', date: '2024-07-28', mealType: 'Lunch', scannedAt: '12:40 PM', status: 'Present' },
  { id: 'att_005', studentId: 'S1002', studentName: 'Bob Williams', studentEmail: 'bob.williams@example.com', date: '2024-07-29', mealType: 'Lunch', scannedAt: 'N/A', status: 'Absent' },
  { id: 'att_006', studentId: 'S1002', studentName: 'Bob Williams', studentEmail: 'bob.williams@example.com', date: '2024-07-30', mealType: 'Breakfast', scannedAt: '08:05 AM', status: 'Present' },
  // Student S1003 - Carol Davis
  { id: 'att_007', studentId: 'S1003', studentName: 'Carol Davis', studentEmail: 'carol.davis@example.com', date: '2024-07-28', mealType: 'Lunch', scannedAt: 'N/A', status: 'Absent' },
  { id: 'att_008', studentId: 'S1003', studentName: 'Carol Davis', studentEmail: 'carol.davis@example.com', date: '2024-07-29', mealType: 'Dinner', scannedAt: '07:10 PM', status: 'Present' },
  // Student S1004 - David Brown
  { id: 'att_009', studentId: 'S1004', studentName: 'David Brown', studentEmail: 'david.brown@example.com', date: '2024-07-27', mealType: 'Dinner', scannedAt: '07:15 PM', status: 'Present' },
  { id: 'att_010', studentId: 'S1004', studentName: 'David Brown', studentEmail: 'david.brown@example.com', date: '2024-07-30', mealType: 'Lunch', scannedAt: '12:55 PM', status: 'Present' },
  // Student S1005 - Eva Green
  { id: 'att_011', studentId: 'S1005', studentName: 'Eva Green', studentEmail: 'eva.green@example.com', date: '2024-07-29', mealType: 'Lunch', scannedAt: '01:00 PM', status: 'Present' },
  { id: 'att_012', studentId: 'S1005', studentName: 'Eva Green', studentEmail: 'eva.green@example.com', date: '2024-07-30', mealType: 'Dinner', scannedAt: 'N/A', status: 'Absent' },
  { id: 'att_013', studentId: 'S1001', studentName: 'Alice Johnson', studentEmail: 'alice.johnson@example.com', date: '2024-08-01', mealType: 'Breakfast', scannedAt: '08:15 AM', status: 'Present' },
  { id: 'att_014', studentId: 'S1002', studentName: 'Bob Williams', studentEmail: 'bob.williams@example.com', date: '2024-08-01', mealType: 'Lunch', scannedAt: '12:30 PM', status: 'Present' },
  { id: 'att_015', studentId: 'S1003', studentName: 'Carol Davis', studentEmail: 'carol.davis@example.com', date: '2024-08-02', mealType: 'Lunch', scannedAt: 'N/A', status: 'Absent' },
];

const ITEMS_PER_PAGE = 10;

export default function AttendancePage() {
  const [allAttendanceRecords, setAllAttendanceRecords] = useState<AttendanceRecord[]>(initialAttendanceRecords);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentsMap, setStudentsMap] = useState<Map<string, Student>>(new Map());
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'date', direction: 'descending' });
  const [currentPage, setCurrentPage] = useState(1);

  // Report specific state
  const [reportStudentId, setReportStudentId] = useState<string | undefined>(undefined);
  const [reportDateRange, setReportDateRange] = useState<DateRange | undefined>(undefined);
  const [isReportView, setIsReportView] = useState(false);

  useEffect(() => {
    try {
      const storedStudentsRaw = localStorage.getItem(STUDENTS_STORAGE_KEY);
      if (storedStudentsRaw) {
        const loadedStudents: Student[] = JSON.parse(storedStudentsRaw);
        setStudents(loadedStudents);
        const map = new Map<string, Student>();
        loadedStudents.forEach(s => map.set(s.studentId, s)); // Assuming studentId is the key for student selection
        setStudentsMap(map);
      }
    } catch (error) {
      console.error("Failed to load students from localStorage", error);
    }
  }, []);

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
    setIsReportView(false); // Exit report view on new search
  };
  
  const handleGenerateReport = () => {
    if (!reportStudentId && !reportDateRange?.from) { // Check if at least one filter is applied
        alert("Please select a student or a date range to generate a report.");
        return;
    }
    setIsReportView(true);
    setCurrentPage(1); // Reset to first page for report view
  };

  const clearReportFilters = () => {
    setReportStudentId(undefined);
    setReportDateRange(undefined);
    setIsReportView(false);
    setCurrentPage(1);
  };

  const processedRecords = useMemo(() => {
    let recordsToProcess = [...allAttendanceRecords];

    // Apply report filters if in report view
    if (isReportView) {
      if (reportStudentId && reportStudentId !== 'all_students') { // Handle "All Students" selection for date range only
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
    } else {
    // Apply general search term if not in report view
      if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        recordsToProcess = recordsToProcess.filter(record =>
          record.studentId.toLowerCase().includes(lowerSearchTerm) ||
          record.studentName.toLowerCase().includes(lowerSearchTerm) ||
          (record.studentEmail && record.studentEmail.toLowerCase().includes(lowerSearchTerm)) ||
          record.mealType.toLowerCase().includes(lowerSearchTerm) ||
          record.date.includes(searchTerm) 
        );
      }
    }
    
    // Apply sorting
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
  }, [allAttendanceRecords, searchTerm, sortConfig, isReportView, reportStudentId, reportDateRange]);

  const totalPages = Math.max(1, Math.ceil(processedRecords.length / ITEMS_PER_PAGE));
  
  const currentTableData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return processedRecords.slice(startIndex, endIndex);
  }, [processedRecords, currentPage]);

   useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-primary">Attendance Records</h2>
          <p className="text-muted-foreground">View and manage all meal attendance records.</p>
        </div>
      </div>

      {/* Report Generation Section */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BookCopy className="h-5 w-5" /> Attendance Report</CardTitle>
          <CardDescription>Filter attendance records by student and/or date range.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <Label htmlFor="student-select" className="mb-1 block text-sm font-medium">Student</Label>
            <Select value={reportStudentId} onValueChange={(value) => setReportStudentId(value === 'all_students' ? undefined : value)}>
              <SelectTrigger id="student-select">
                <SelectValue placeholder="Select a student" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_students">All Students (for date range only)</SelectItem>
                {students.map(student => (
                  <SelectItem key={student.id} value={student.studentId}> {/* Assuming student.studentId is the value for filtering */}
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
          <div className="flex gap-2">
            <Button onClick={handleGenerateReport} className="w-full md:w-auto">Generate Report</Button>
            {(isReportView || reportStudentId || reportDateRange?.from) && ( // Show clear if any filter is active or report view is on
                 <Button onClick={clearReportFilters} variant="outline" className="w-full md:w-auto">
                    <FilterX className="mr-2 h-4 w-4" /> Clear
                </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>{isReportView ? "Report Results" : "All Records"}</CardTitle>
          <CardDescription>
            {isReportView 
              ? `Showing records for ${reportStudentId && reportStudentId !== 'all_students' ? (students.find(s => s.studentId === reportStudentId)?.name || 'selected student') : 'all students'}${reportDateRange?.from ? ` from ${format(reportDateRange.from, "LLL dd, y")}` : ''}${reportDateRange?.to ? ` to ${format(reportDateRange.to, "LLL dd, y")}` : reportDateRange?.from ? '' : ''}.`
              : "Detailed list of all attendance entries. Use search below or report filters above."}
          </CardDescription>
          {!isReportView && (
            <div className="mt-4 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                type="search"
                placeholder="Search records by ID, name, email, meal type, date..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10 w-full sm:w-1/2 md:w-2/3"
                />
            </div>
          )}
        </CardHeader>
        <CardContent>
          <AttendanceTable 
            records={currentTableData} 
            sortConfig={sortConfig}
            onSort={handleSort}
            studentsMap={studentsMap} // Pass studentsMap here
          />
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

