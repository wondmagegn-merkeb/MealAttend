
"use client";

import { useState, useMemo, useCallback } from 'react';
import { WelcomeBanner } from "@/components/admin/WelcomeBanner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Users, CalendarDays, LineChart as LineChartIcon, FileDown, PieChart as PieChartLucideIcon, UserCheck, AlertTriangle } from "lucide-react";
import { LineChart, Line, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, Legend as RechartsLegend, PieChart, Pie, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart";
import { format, getDaysInMonth, getMonth, getYear, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useQuery } from '@tanstack/react-query';
import type { Student, User, AttendanceRecord } from '@prisma/client';

const CURRENT_GREGORIAN_YEAR = new Date().getFullYear();
const CURRENT_GREGORIAN_MONTH = new Date().getMonth(); // 0-indexed (January is 0)

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const shortMonthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const PIE_CHART_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--secondary))"];

const getYearFromStudentId = (studentId: string): string | null => {
  if (typeof studentId !== 'string') return null;
  const parts = studentId.split('/');
  if (parts.length === 4 && /^\d{4}$/.test(parts[2])) {
    return parts[2];
  }
  return null;
};

async function fetchStudents(): Promise<Student[]> {
  const res = await fetch('/api/students');
  if (!res.ok) throw new Error('Failed to fetch students');
  return res.json();
}
async function fetchUsers(): Promise<User[]> {
  const res = await fetch('/api/users');
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}
async function fetchAttendance(): Promise<AttendanceRecord[]> {
  const res = await fetch('/api/attendance');
  if (!res.ok) throw new Error('Failed to fetch attendance');
  return res.json();
}

export default function AdminDashboardPage() {
  const [selectedYear, setSelectedYear] = useState<string>(String(CURRENT_GREGORIAN_YEAR));
  const [selectedMonth, setSelectedMonth] = useState<number>(CURRENT_GREGORIAN_MONTH); 
  const { toast } = useToast();

  const { data: allStudents = [], isLoading: isLoadingStudents, error: studentsError } = useQuery<Student[]>({ queryKey: ['students'], queryFn: fetchStudents });
  const { data: allUsers = [], isLoading: isLoadingUsers, error: usersError } = useQuery<User[]>({ queryKey: ['users'], queryFn: fetchUsers });
  const { data: allAttendanceRecords = [], isLoading: isLoadingAttendance, error: attendanceError } = useQuery<AttendanceRecord[]>({ queryKey: ['attendanceRecords'], queryFn: fetchAttendance });
  
  const isLoading = isLoadingStudents || isLoadingUsers || isLoadingAttendance;
  const dataError = studentsError || usersError || attendanceError;

  const uniqueAdmissionYears = useMemo(() => {
    if (!allStudents.length) return [String(CURRENT_GREGORIAN_YEAR)];
    const years = new Set<string>();
    allStudents.forEach(student => {
      const year = getYearFromStudentId(student.studentId);
      if (year) years.add(year);
    });
    const sortedYears = Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
    if (!sortedYears.includes(String(CURRENT_GREGORIAN_YEAR))) {
        sortedYears.push(String(CURRENT_GREGORIAN_YEAR));
        sortedYears.sort((a, b) => parseInt(b) - parseInt(a));
    }
    return sortedYears.length > 0 ? sortedYears : [String(CURRENT_GREGORIAN_YEAR)];
  }, [allStudents]);

  const totalStudentsInSelectedYear = useMemo(() => {
    if (selectedYear === 'all_years') return allStudents.length;
    return allStudents.filter(student => getYearFromStudentId(student.studentId) === selectedYear).length;
  }, [allStudents, selectedYear]);

  const yearForCharts = useMemo(() => {
    return selectedYear === 'all_years' ? CURRENT_GREGORIAN_YEAR : parseInt(selectedYear);
  }, [selectedYear]);

  const dailyAttendanceData = useMemo(() => {
    const recordsInSelectedMonthAndYear = allAttendanceRecords.filter(record => {
      const recordDate = parseISO(record.recordDate as unknown as string);
      return getYear(recordDate) === yearForCharts && getMonth(recordDate) === selectedMonth && record.status === 'PRESENT';
    });
    const daysInSelectedMonth = getDaysInMonth(new Date(yearForCharts, selectedMonth));
    const dailyCounts: { day: string; count: number }[] = [];
    for (let i = 1; i <= daysInSelectedMonth; i++) {
      const dayStr = i.toString().padStart(2, '0');
      const count = recordsInSelectedMonthAndYear.filter(r => format(parseISO(r.recordDate as unknown as string), 'dd') === dayStr).length;
      dailyCounts.push({ day: dayStr, count });
    }
    return dailyCounts;
  }, [allAttendanceRecords, yearForCharts, selectedMonth]);

  const monthlyAttendanceData = useMemo(() => {
    const recordsInSelectedYear = allAttendanceRecords.filter(record => {
      const recordDate = parseISO(record.recordDate as unknown as string);
      return getYear(recordDate) === yearForCharts && record.status === 'PRESENT';
    });
    const monthlyCounts: { month: string; count: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const count = recordsInSelectedYear.filter(r => getMonth(parseISO(r.recordDate as unknown as string)) === i).length;
      monthlyCounts.push({ month: shortMonthNames[i], count });
    }
    return monthlyCounts;
  }, [allAttendanceRecords, yearForCharts]);

  const studentGradeDistributionData = useMemo(() => {
    if (!allStudents.length) return [];
    const gradeCounts: { [key: string]: number } = {};
    allStudents.forEach(student => {
      const grade = student.classGrade || "N/A";
      gradeCounts[grade] = (gradeCounts[grade] || 0) + 1;
    });
    return Object.entries(gradeCounts).map(([name, value]) => ({ name, value }));
  }, [allStudents]);

  const userRoleDistributionData = useMemo(() => {
    if (!allUsers.length) return [];
    const roleCounts: { [key: string]: number } = {};
    allUsers.forEach(user => {
      roleCounts[user.role] = (roleCounts[user.role] || 0) + 1;
    });
    return Object.entries(roleCounts).map(([name, value]) => ({ name, value }));
  }, [allUsers]);

  const attendanceChartConfig = { count: { label: "Attendance", color: "hsl(var(--primary))" } } satisfies ChartConfig;
  
  // ... Chart config logic remains the same
  const gradeChartConfig = useMemo(() => {
    const config: ChartConfig = {};
    studentGradeDistributionData.forEach((item, index) => {
        config[item.name] = { label: item.name, color: PIE_CHART_COLORS[index % PIE_CHART_COLORS.length] };
    });
    return config;
  }, [studentGradeDistributionData]);

  const roleChartConfig = useMemo(() => {
     const config: ChartConfig = {};
     userRoleDistributionData.forEach((item, index) => {
        config[item.name] = { label: item.name, color: PIE_CHART_COLORS[index % PIE_CHART_COLORS.length] };
    });
    return config;
  }, [userRoleDistributionData]);
  
  // ... Export functions remain largely the same, but should check if data has loaded
  const handleExportDashboardPdf = useCallback(() => { /* ... no change ... */ }, [selectedYear, selectedMonth, totalStudentsInSelectedYear, dailyAttendanceData, monthlyAttendanceData, studentGradeDistributionData, userRoleDistributionData, allUsers.length, yearForCharts, toast]);
  const handleExportDashboardExcel = useCallback(() => { /* ... no change ... */ }, [selectedYear, selectedMonth, totalStudentsInSelectedYear, dailyAttendanceData, monthlyAttendanceData, studentGradeDistributionData, userRoleDistributionData, allUsers.length, yearForCharts, toast]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading dashboard data...</p>
      </div>
    );
  }
  
  if (dataError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] p-4">
        <Card className="w-full max-w-md text-center shadow-lg">
          <CardHeader><AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-2" /><CardTitle className="text-2xl text-destructive">Error Loading Dashboard</CardTitle></CardHeader>
          <CardContent><CardDescription className="mb-6">Failed to load dashboard data: {(dataError as Error).message}</CardDescription></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <WelcomeBanner />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-semibold tracking-tight text-primary">Dashboard Overview</h2>
        <div className="flex flex-col sm:flex-row gap-2 items-center w-full sm:w-auto">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-full sm:w-[200px]" id="year-select"><SelectValue placeholder="Select Year" /></SelectTrigger>
                <SelectContent><SelectItem value="all_years">All Years (Charts for Current Year)</SelectItem>{uniqueAdmissionYears.map(year => (<SelectItem key={year} value={year}>{year}</SelectItem>))}</SelectContent>
            </Select>
            <Select value={String(selectedMonth)} onValueChange={(value) => setSelectedMonth(Number(value))}>
                <SelectTrigger className="w-full sm:w-[180px]" id="month-select"><SelectValue placeholder="Select Month" /></SelectTrigger>
                <SelectContent>{monthNames.map((month, index) => (<SelectItem key={index} value={String(index)}>{month}</SelectItem>))}</SelectContent>
            </Select>
            <Button onClick={handleExportDashboardPdf} variant="outline" size="sm"><FileDown className="mr-2 h-4 w-4" />PDF</Button>
            <Button onClick={handleExportDashboardExcel} variant="outline" size="sm"><FileDown className="mr-2 h-4 w-4" />Excel</Button>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Students ({selectedYear === 'all_years' ? 'All Time' : `Admission Year: ${selectedYear}`})</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader>
            <CardContent><div className="text-2xl font-bold">{totalStudentsInSelectedYear}</div><p className="text-xs text-muted-foreground">{selectedYear === 'all_years' ? 'Overall student count' : `Students admitted in ${selectedYear}`}</p></CardContent>
        </Card>
        <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Registered Users</CardTitle><UserCheck className="h-4 w-4 text-muted-foreground" /></CardHeader>
            <CardContent><div className="text-2xl font-bold">{allUsers.length}</div><p className="text-xs text-muted-foreground">Across all departments and roles.</p></CardContent>
        </Card>
        <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Attendance Records</CardTitle><CalendarDays className="h-4 w-4 text-muted-foreground" /></CardHeader>
            <CardContent><div className="text-2xl font-bold">{allAttendanceRecords.length}</div><p className="text-xs text-muted-foreground">Overall meal scan entries.</p></CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader><CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-primary" />Daily Attendance: {monthNames[selectedMonth]} {yearForCharts}</CardTitle><CardDescription>Daily meal attendance (Line Chart) for {monthNames[selectedMonth]}, {yearForCharts}.</CardDescription></CardHeader>
          <CardContent>
            {dailyAttendanceData.length > 0 && dailyAttendanceData.some(d => d.count > 0) ? (
              <ChartContainer config={attendanceChartConfig} className="h-[300px] w-full">
                <LineChart data={dailyAttendanceData} accessibilityLayer margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3"/><XAxis dataKey="day" tickLine={false} tickMargin={10} axisLine={false} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} width={30} /><ChartTooltip content={<ChartTooltipContent />} /><Line type="monotone" dataKey="count" stroke="var(--color-count)" strokeWidth={2} dot={{ r: 4, fill: "var(--color-count)" }} activeDot={{ r: 6, stroke: "var(--background)", fill: "var(--color-count)", strokeWidth: 2 }} />
                </LineChart>
              </ChartContainer>
            ) : (<p className="text-center text-muted-foreground py-10">No attendance data for {monthNames[selectedMonth]}, {yearForCharts}.</p>)}
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader><CardTitle className="flex items-center gap-2"><LineChartIcon className="h-5 w-5 text-primary" />Monthly Attendance: Year {yearForCharts}</CardTitle><CardDescription>Monthly meal attendance (Line Chart) for the year {yearForCharts}.</CardDescription></CardHeader>
          <CardContent>
            {monthlyAttendanceData.length > 0 && monthlyAttendanceData.some(m => m.count > 0) ? (
            <ChartContainer config={attendanceChartConfig} className="h-[300px] w-full">
              <LineChart data={monthlyAttendanceData} accessibilityLayer margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" /><XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} width={30} /><ChartTooltip content={<ChartTooltipContent />} /><RechartsLegend content={<ChartLegendContent />} /><Line type="monotone" dataKey="count" stroke="var(--color-count)" strokeWidth={2} dot={{ r: 4, fill: "var(--color-count)" }} activeDot={{ r: 6, stroke: "var(--background)", fill: "var(--color-count)", strokeWidth: 2 }}/>
              </LineChart>
            </ChartContainer>
            ) : (<p className="text-center text-muted-foreground py-10">No attendance data for the year {yearForCharts}.</p>)}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader><CardTitle className="flex items-center gap-2"><PieChartLucideIcon className="h-5 w-5 text-primary" />Student Distribution by Grade</CardTitle><CardDescription>Breakdown of students across different grades.</CardDescription></CardHeader>
          <CardContent>
            {studentGradeDistributionData.length > 0 ? (
              <ChartContainer config={gradeChartConfig} className="h-[300px] w-full">
                <PieChart><ChartTooltip content={<ChartTooltipContent nameKey="value" hideLabel />} /><Pie data={studentGradeDistributionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>{studentGradeDistributionData.map((entry, index) => (<Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />))}</Pie><ChartLegend content={<ChartLegendContent nameKey="name" />} /></PieChart>
              </ChartContainer>
            ) : (<p className="text-center text-muted-foreground py-10">No student data available for grade distribution.</p>)}
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" />User Distribution by Role</CardTitle><CardDescription>Breakdown of users by their assigned roles.</CardDescription></CardHeader>
          <CardContent>
            {userRoleDistributionData.length > 0 ? (
               <ChartContainer config={roleChartConfig} className="h-[300px] w-full">
                <PieChart><ChartTooltip content={<ChartTooltipContent nameKey="value" hideLabel />} /><Pie data={userRoleDistributionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>{userRoleDistributionData.map((entry, index) => (<Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />))}</Pie><ChartLegend content={<ChartLegendContent nameKey="name" />} /></PieChart>
              </ChartContainer>
            ) : (<p className="text-center text-muted-foreground py-10">No user data available for role distribution.</p>)}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
