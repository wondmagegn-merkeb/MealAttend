"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { WelcomeBanner } from "@/components/admin/WelcomeBanner";
import { DashboardMetrics } from "@/components/admin/DashboardMetrics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Users, CalendarDays, BarChartBig, FileDown } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, Legend as RechartsLegend } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import type { Student } from '@/types/student';
import type { AttendanceRecord } from '@/components/admin/AttendanceTable'; // Assuming this is defined
import { STUDENTS_STORAGE_KEY, ATTENDANCE_RECORDS_STORAGE_KEY } from '@/lib/constants';
import { format, getDaysInMonth, getMonth, getYear, parseISO, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const CURRENT_GREGORIAN_YEAR = new Date().getFullYear();
const CURRENT_GREGORIAN_MONTH = new Date().getMonth(); // 0-indexed

// Helper to extract year from student ID (e.g., ADERA/STU/2024/00001 -> 2024)
const getYearFromStudentId = (studentId: string): string | null => {
  const parts = studentId.split('/');
  if (parts.length === 4 && /^\d{4}$/.test(parts[2])) {
    return parts[2];
  }
  return null;
};

export default function AdminDashboardPage() {
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [allAttendanceRecords, setAllAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>(String(CURRENT_GREGORIAN_YEAR));
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
    try {
      const storedStudentsRaw = localStorage.getItem(STUDENTS_STORAGE_KEY);
      if (storedStudentsRaw) setAllStudents(JSON.parse(storedStudentsRaw));

      const storedAttendanceRaw = localStorage.getItem(ATTENDANCE_RECORDS_STORAGE_KEY);
      if (storedAttendanceRaw) setAllAttendanceRecords(JSON.parse(storedAttendanceRaw));
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
      toast({ title: "Error", description: "Could not load data from local storage.", variant: "destructive" });
    }
  }, [toast]);

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
    return sortedYears;
  }, [allStudents]);

  const totalStudentsInSelectedYear = useMemo(() => {
    if (selectedYear === 'all_years' || !allStudents.length) {
      return allStudents.length;
    }
    return allStudents.filter(student => getYearFromStudentId(student.studentId) === selectedYear).length;
  }, [allStudents, selectedYear]);

  const yearToFilterForCharts = useMemo(() => {
    return selectedYear === 'all_years' ? CURRENT_GREGORIAN_YEAR : parseInt(selectedYear);
  }, [selectedYear]);

  // Data for "This Month's Attendance by Day"
  const dailyAttendanceData = useMemo(() => {
    const monthToFilter = selectedYear === 'all_years' ? CURRENT_GREGORIAN_MONTH : CURRENT_GREGORIAN_MONTH; // Always current month for this chart
    const yearForDailyChart = yearToFilterForCharts;

    const recordsInSelectedMonthAndYear = allAttendanceRecords.filter(record => {
      const recordDate = parseISO(record.date);
      return getYear(recordDate) === yearForDailyChart && getMonth(recordDate) === monthToFilter;
    });

    const daysInMonth = getDaysInMonth(new Date(yearForDailyChart, monthToFilter));
    const dailyCounts: { day: string; count: number }[] = [];

    for (let i = 1; i <= daysInMonth; i++) {
      const dayStr = i.toString().padStart(2, '0');
      const count = recordsInSelectedMonthAndYear.filter(r => format(parseISO(r.date), 'dd') === dayStr).length;
      dailyCounts.push({ day: dayStr, count });
    }
    return dailyCounts;
  }, [allAttendanceRecords, yearToFilterForCharts, selectedYear]);

  // Data for "[Selected Year]'s Attendance by Month"
  const monthlyAttendanceData = useMemo(() => {
    const recordsInSelectedYear = allAttendanceRecords.filter(record => {
      const recordDate = parseISO(record.date);
      return getYear(recordDate) === yearToFilterForCharts;
    });

    const monthlyCounts: { month: string; count: number }[] = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    for (let i = 0; i < 12; i++) {
      const count = recordsInSelectedYear.filter(r => getMonth(parseISO(r.date)) === i).length;
      monthlyCounts.push({ month: monthNames[i], count });
    }
    return monthlyCounts;
  }, [allAttendanceRecords, yearToFilterForCharts]);


  const chartConfig = {
    count: { label: "Attendance Count", color: "hsl(var(--primary))" },
  } satisfies ChartConfig;

  const handleExportDashboardPdf = useCallback(() => {
    if (!isMounted) return;
    const doc = new jsPDF();
    const currentTimestamp = format(new Date(), "yyyy-MM-dd HH:mm");
    const yearDisplay = selectedYear === 'all_years' ? 'All Years (Charts for Current Year)' : selectedYear;

    doc.setFontSize(18);
    doc.text(`Dashboard Export - Year: ${yearDisplay}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Exported on: ${currentTimestamp}`, 14, 26);
    doc.setFontSize(12);
    doc.text(`Total Students (${selectedYear === 'all_years' ? 'All Time' : 'Year ' + selectedYear}): ${totalStudentsInSelectedYear}`, 14, 36);

    if (dailyAttendanceData.length > 0) {
        doc.addPage();
        doc.setFontSize(14);
        doc.text(`Daily Attendance - ${format(new Date(yearToFilterForCharts, CURRENT_GREGORIAN_MONTH), 'MMMM yyyy')}`, 14, 20);
        autoTable(doc, {
            startY: 25,
            head: [['Day', 'Attendance Count']],
            body: dailyAttendanceData.map(d => [d.day, d.count]),
            theme: 'grid',
            headStyles: { fillColor: [22, 160, 133] },
        });
    }

    if (monthlyAttendanceData.length > 0) {
        doc.addPage();
        doc.setFontSize(14);
        doc.text(`Monthly Attendance - Year ${yearToFilterForCharts}`, 14, 20);
        autoTable(doc, {
            startY: 25,
            head: [['Month', 'Attendance Count']],
            body: monthlyAttendanceData.map(m => [m.month, m.count]),
            theme: 'grid',
            headStyles: { fillColor: [22, 160, 133] },
        });
    }
    
    doc.save(`dashboard_export_${selectedYear}_${format(new Date(), "yyyyMMddHHmmss")}.pdf`);
    toast({ title: "PDF Exported", description: "Dashboard data summary exported." });
  }, [isMounted, selectedYear, totalStudentsInSelectedYear, dailyAttendanceData, monthlyAttendanceData, yearToFilterForCharts, toast]);
  
  const handleExportDashboardExcel = useCallback(() => {
    if (!isMounted) return;
    const wb = XLSX.utils.book_new();
    const yearDisplay = selectedYear === 'all_years' ? 'All Years (Charts for Current Year)' : selectedYear;

    // Summary Sheet
    const summaryData = [
        ["Dashboard Export Summary"],
        [`Year Selected: ${yearDisplay}`],
        [`Exported on: ${format(new Date(), "yyyy-MM-dd HH:mm")}`],
        [],
        [`Total Students (${selectedYear === 'all_years' ? 'All Time' : 'Year ' + selectedYear})`, totalStudentsInSelectedYear],
    ];
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    summaryWs['!cols'] = [{wch:40}, {wch:20}];
    XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

    // Daily Attendance Sheet
    if (dailyAttendanceData.length > 0) {
        const dailyDataForSheet = [
            [`Daily Attendance - ${format(new Date(yearToFilterForCharts, CURRENT_GREGORIAN_MONTH), 'MMMM yyyy')}`],
            ['Day', 'Attendance Count'],
            ...dailyAttendanceData.map(d => [d.day, d.count]),
        ];
        const dailyWs = XLSX.utils.aoa_to_sheet(dailyDataForSheet);
        dailyWs['!cols'] = [{wch:15}, {wch:20}];
        XLSX.utils.book_append_sheet(wb, dailyWs, "Daily Attendance");
    }

    // Monthly Attendance Sheet
    if (monthlyAttendanceData.length > 0) {
        const monthlyDataForSheet = [
            [`Monthly Attendance - Year ${yearToFilterForCharts}`],
            ['Month', 'Attendance Count'],
            ...monthlyAttendanceData.map(m => [m.month, m.count]),
        ];
        const monthlyWs = XLSX.utils.aoa_to_sheet(monthlyDataForSheet);
        monthlyWs['!cols'] = [{wch:15}, {wch:20}];
        XLSX.utils.book_append_sheet(wb, monthlyWs, "Monthly Attendance");
    }
    
    XLSX.writeFile(wb, `dashboard_export_${selectedYear}_${format(new Date(), "yyyyMMddHHmmss")}.xlsx`);
    toast({ title: "Excel Exported", description: "Dashboard data summary exported." });
  }, [isMounted, selectedYear, totalStudentsInSelectedYear, dailyAttendanceData, monthlyAttendanceData, yearToFilterForCharts, toast]);


  if (!isMounted) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <WelcomeBanner />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-semibold tracking-tight text-primary">Dashboard Overview</h2>
        <div className="flex gap-2 items-center w-full sm:w-auto">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-full sm:w-[180px]" id="year-select">
                <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="all_years">All Years (Charts for Current)</SelectItem>
                {uniqueAdmissionYears.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
                </SelectContent>
            </Select>
            <Button onClick={handleExportDashboardPdf} variant="outline" size="sm"><FileDown className="mr-2 h-4 w-4" />PDF</Button>
            <Button onClick={handleExportDashboardExcel} variant="outline" size="sm"><FileDown className="mr-2 h-4 w-4" />Excel</Button>
        </div>
      </div>
      
      <DashboardMetrics /> {/* Existing generic metrics */}

      {/* Total Students for Selected Year Metric */}
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Students ({selectedYear === 'all_years' ? 'All Time' : `Admission Year: ${selectedYear}`})
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalStudentsInSelectedYear}</div>
          <p className="text-xs text-muted-foreground">
            {selectedYear === 'all_years' ? 'Overall student count' : `Students admitted in ${selectedYear}`}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {/* Daily Attendance Chart */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                Attendance: {format(new Date(yearToFilterForCharts, CURRENT_GREGORIAN_MONTH), 'MMMM yyyy')}
            </CardTitle>
            <CardDescription>Daily meal attendance counts for the current month of the selected/current year.</CardDescription>
          </CardHeader>
          <CardContent>
            {dailyAttendanceData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <BarChart data={dailyAttendanceData} accessibilityLayer>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="day" tickLine={false} tickMargin={10} axisLine={false} />
                  <YAxis allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                </BarChart>
              </ChartContainer>
            ) : (
              <p className="text-center text-muted-foreground py-10">No attendance data for this month.</p>
            )}
          </CardContent>
        </Card>

        {/* Monthly Attendance Chart */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <BarChartBig className="h-5 w-5 text-primary" />
                Attendance: Year {yearToFilterForCharts}
            </CardTitle>
            <CardDescription>Monthly meal attendance counts for the selected/current year.</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyAttendanceData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={monthlyAttendanceData} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                <YAxis allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <RechartsLegend content={<ChartLegendContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={4} />
              </BarChart>
            </ChartContainer>
            ) : (
              <p className="text-center text-muted-foreground py-10">No attendance data for this year.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
