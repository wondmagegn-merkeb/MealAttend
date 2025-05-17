
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { WelcomeBanner } from "@/components/admin/WelcomeBanner";
import { DashboardMetrics } from "@/components/admin/DashboardMetrics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Users, CalendarDays, LineChart as LineChartIcon, FileDown, PieChart as PieChartLucideIcon, UserCheck } from "lucide-react";
import { LineChart, Line, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, Legend as RechartsLegend, PieChart, Pie, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart";
import type { Student } from '@/types/student';
import type { User } from '@/types/user';
import type { AttendanceRecord } from '@/components/admin/AttendanceTable';
import { STUDENTS_STORAGE_KEY, ATTENDANCE_RECORDS_STORAGE_KEY, USERS_STORAGE_KEY } from '@/lib/constants';
import { format, getDaysInMonth, getMonth, getYear, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const CURRENT_GREGORIAN_YEAR = new Date().getFullYear();
const CURRENT_GREGORIAN_MONTH = new Date().getMonth(); // 0-indexed (January is 0)

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const shortMonthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const PIE_CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--secondary))",
];


const getYearFromStudentId = (studentId: string): string | null => {
  if (typeof studentId !== 'string') return null;
  const parts = studentId.split('/');
  if (parts.length === 4 && /^\d{4}$/.test(parts[2])) {
    return parts[2];
  }
  return null;
};

export default function AdminDashboardPage() {
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allAttendanceRecords, setAllAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>(String(CURRENT_GREGORIAN_YEAR));
  const [selectedMonth, setSelectedMonth] = useState<number>(CURRENT_GREGORIAN_MONTH); 
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
    try {
      const storedStudentsRaw = localStorage.getItem(STUDENTS_STORAGE_KEY);
      if (storedStudentsRaw) setAllStudents(JSON.parse(storedStudentsRaw));

      const storedUsersRaw = localStorage.getItem(USERS_STORAGE_KEY);
      if (storedUsersRaw) setAllUsers(JSON.parse(storedUsersRaw));
      
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
    return sortedYears.length > 0 ? sortedYears : [String(CURRENT_GREGORIAN_YEAR)];
  }, [allStudents]);

  const totalStudentsInSelectedYear = useMemo(() => {
    if (selectedYear === 'all_years') { 
        return allStudents.length;
    }
    if (!allStudents.length) return 0;
    return allStudents.filter(student => getYearFromStudentId(student.studentId) === selectedYear).length;
  }, [allStudents, selectedYear]);

  const yearForCharts = useMemo(() => {
    return selectedYear === 'all_years' ? CURRENT_GREGORIAN_YEAR : parseInt(selectedYear);
  }, [selectedYear]);


  const dailyAttendanceData = useMemo(() => {
    const recordsInSelectedMonthAndYear = allAttendanceRecords.filter(record => {
      const recordDate = parseISO(record.date);
      return getYear(recordDate) === yearForCharts && getMonth(recordDate) === selectedMonth && record.status === 'Present';
    });

    const daysInSelectedMonth = getDaysInMonth(new Date(yearForCharts, selectedMonth));
    const dailyCounts: { day: string; count: number }[] = [];

    for (let i = 1; i <= daysInSelectedMonth; i++) {
      const dayStr = i.toString().padStart(2, '0');
      const count = recordsInSelectedMonthAndYear.filter(r => format(parseISO(r.date), 'dd') === dayStr).length;
      dailyCounts.push({ day: dayStr, count });
    }
    return dailyCounts;
  }, [allAttendanceRecords, yearForCharts, selectedMonth]);


  const monthlyAttendanceData = useMemo(() => {
    const recordsInSelectedYear = allAttendanceRecords.filter(record => {
      const recordDate = parseISO(record.date);
      return getYear(recordDate) === yearForCharts && record.status === 'Present';
    });

    const monthlyCounts: { month: string; count: number }[] = [];
    
    for (let i = 0; i < 12; i++) {
      const count = recordsInSelectedYear.filter(r => getMonth(parseISO(r.date)) === i).length;
      monthlyCounts.push({ month: shortMonthNames[i], count });
    }
    return monthlyCounts;
  }, [allAttendanceRecords, yearForCharts]);

  const studentGradeDistributionData = useMemo(() => {
    if (!allStudents.length) return [];
    const gradeCounts: { [key: string]: number } = {};
    allStudents.forEach(student => {
      const grade = student.class || "N/A";
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

  const attendanceChartConfig = {
    count: { label: "Attendance", color: "hsl(var(--primary))" },
  } satisfies ChartConfig;

  const gradeChartConfig = useMemo(() => {
    const config: ChartConfig = {};
    studentGradeDistributionData.forEach((item, index) => {
        config[item.name] = {
            label: item.name,
            color: PIE_CHART_COLORS[index % PIE_CHART_COLORS.length],
        };
    });
    return config;
  }, [studentGradeDistributionData]);

  const roleChartConfig = useMemo(() => {
     const config: ChartConfig = {};
     userRoleDistributionData.forEach((item, index) => {
        config[item.name] = {
            label: item.name,
            color: PIE_CHART_COLORS[index % PIE_CHART_COLORS.length],
        };
    });
    return config;
  }, [userRoleDistributionData]);


  const handleExportDashboardPdf = useCallback(() => {
    if (!isMounted) return;
    const doc = new jsPDF();
    const currentTimestamp = format(new Date(), "yyyy-MM-dd HH:mm");
    const yearDisplay = selectedYear === 'all_years' ? `All Years (Charts for ${CURRENT_GREGORIAN_YEAR})` : selectedYear;
    const monthDisplay = monthNames[selectedMonth];

    doc.setFontSize(18);
    doc.text(`Dashboard Export - Year: ${yearDisplay}, Month: ${monthDisplay}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Exported on: ${currentTimestamp}`, 14, 26);
    doc.setFontSize(12);
    doc.text(`Total Students (${selectedYear === 'all_years' ? 'All Time' : 'Admission Year ' + selectedYear}): ${totalStudentsInSelectedYear}`, 14, 36);
    doc.text(`Total Registered Users: ${allUsers.length}`, 14, 42);

    if (dailyAttendanceData.length > 0 && dailyAttendanceData.some(d => d.count > 0)) {
        doc.addPage();
        doc.setFontSize(14);
        doc.text(`Daily Attendance - ${monthDisplay} ${yearForCharts}`, 14, 20);
        autoTable(doc, {
            startY: 25,
            head: [['Day', 'Attendance Count']],
            body: dailyAttendanceData.map(d => [d.day, d.count]),
            theme: 'grid',
            headStyles: { fillColor: [22, 160, 133] },
        });
    }

    if (monthlyAttendanceData.length > 0 && monthlyAttendanceData.some(m => m.count > 0)) {
        doc.addPage();
        doc.setFontSize(14);
        doc.text(`Monthly Attendance - Year ${yearForCharts}`, 14, 20);
        autoTable(doc, {
            startY: 25,
            head: [['Month', 'Attendance Count']],
            body: monthlyAttendanceData.map(m => [m.month, m.count]),
            theme: 'grid',
            headStyles: { fillColor: [22, 160, 133] },
        });
    }

    if (studentGradeDistributionData.length > 0) {
        doc.addPage();
        doc.setFontSize(14);
        doc.text(`Student Distribution by Grade`, 14, 20);
        autoTable(doc, {
            startY: 25,
            head: [['Grade', 'Number of Students']],
            body: studentGradeDistributionData.map(g => [g.name, g.value]),
            theme: 'grid',
            headStyles: { fillColor: [22, 160, 133] },
        });
    }
     if (userRoleDistributionData.length > 0) {
        doc.addPage();
        doc.setFontSize(14);
        doc.text(`User Distribution by Role`, 14, 20);
        autoTable(doc, {
            startY: 25,
            head: [['Role', 'Number of Users']],
            body: userRoleDistributionData.map(r => [r.name, r.value]),
            theme: 'grid',
            headStyles: { fillColor: [22, 160, 133] },
        });
    }
    
    doc.save(`dashboard_export_${selectedYear}_${shortMonthNames[selectedMonth]}_${format(new Date(), "yyyyMMddHHmmss")}.pdf`);
    toast({ title: "PDF Exported", description: "Dashboard data summary exported." });
  }, [isMounted, selectedYear, selectedMonth, totalStudentsInSelectedYear, dailyAttendanceData, monthlyAttendanceData, studentGradeDistributionData, userRoleDistributionData, allUsers.length, yearForCharts, toast]);
  
  const handleExportDashboardExcel = useCallback(() => {
    if (!isMounted) return;
    const wb = XLSX.utils.book_new();
    const yearDisplay = selectedYear === 'all_years' ? `All Years (Charts for ${CURRENT_GREGORIAN_YEAR})` : selectedYear;
    const monthDisplay = monthNames[selectedMonth];

    // Summary Sheet
    const summaryData = [
        ["Dashboard Export Summary"],
        [`Year Selected: ${yearDisplay}`],
        [`Month Selected for Daily Chart: ${monthDisplay}`],
        [`Exported on: ${format(new Date(), "yyyy-MM-dd HH:mm")}`],
        [],
        [`Total Students (${selectedYear === 'all_years' ? 'All Time' : 'Admission Year ' + selectedYear})`, totalStudentsInSelectedYear],
        [`Total Registered Users`, allUsers.length],
    ];
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    summaryWs['!cols'] = [{wch:40}, {wch:20}];
    XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

    // Daily Attendance Sheet
    if (dailyAttendanceData.length > 0 && dailyAttendanceData.some(d => d.count > 0)) {
        const dailyDataForSheet = [
            [`Daily Attendance - ${monthDisplay} ${yearForCharts}`],
            ['Day', 'Attendance Count'],
            ...dailyAttendanceData.map(d => [d.day, d.count]),
        ];
        const dailyWs = XLSX.utils.aoa_to_sheet(dailyDataForSheet);
        dailyWs['!cols'] = [{wch:15}, {wch:20}];
        XLSX.utils.book_append_sheet(wb, dailyWs, "Daily Attendance");
    }

    // Monthly Attendance Sheet
    if (monthlyAttendanceData.length > 0 && monthlyAttendanceData.some(m => m.count > 0)) {
        const monthlyDataForSheet = [
            [`Monthly Attendance - Year ${yearForCharts}`],
            ['Month', 'Attendance Count'],
            ...monthlyAttendanceData.map(m => [m.month, m.count]),
        ];
        const monthlyWs = XLSX.utils.aoa_to_sheet(monthlyDataForSheet);
        monthlyWs['!cols'] = [{wch:15}, {wch:20}];
        XLSX.utils.book_append_sheet(wb, monthlyWs, "Monthly Attendance");
    }

    // Student Grade Distribution Sheet
    if (studentGradeDistributionData.length > 0) {
        const gradeDataForSheet = [
            [`Student Distribution by Grade`],
            ['Grade', 'Number of Students'],
            ...studentGradeDistributionData.map(g => [g.name, g.value]),
        ];
        const gradeWs = XLSX.utils.aoa_to_sheet(gradeDataForSheet);
        gradeWs['!cols'] = [{wch:20}, {wch:20}];
        XLSX.utils.book_append_sheet(wb, gradeWs, "Grade Distribution");
    }
    
    // User Role Distribution Sheet
    if (userRoleDistributionData.length > 0) {
        const roleDataForSheet = [
            [`User Distribution by Role`],
            ['Role', 'Number of Users'],
            ...userRoleDistributionData.map(r => [r.name, r.value]),
        ];
        const roleWs = XLSX.utils.aoa_to_sheet(roleDataForSheet);
        roleWs['!cols'] = [{wch:20}, {wch:20}];
        XLSX.utils.book_append_sheet(wb, roleWs, "User Role Distribution");
    }
    
    XLSX.writeFile(wb, `dashboard_export_${selectedYear}_${shortMonthNames[selectedMonth]}_${format(new Date(), "yyyyMMddHHmmss")}.xlsx`);
    toast({ title: "Excel Exported", description: "Dashboard data summary exported." });
  }, [isMounted, selectedYear, selectedMonth, totalStudentsInSelectedYear, dailyAttendanceData, monthlyAttendanceData, studentGradeDistributionData, userRoleDistributionData, allUsers.length, yearForCharts, toast]);


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
        <div className="flex flex-col sm:flex-row gap-2 items-center w-full sm:w-auto">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-full sm:w-[200px]" id="year-select">
                <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="all_years">All Years (Charts for Current Year)</SelectItem>
                {uniqueAdmissionYears.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
                </SelectContent>
            </Select>
            <Select value={String(selectedMonth)} onValueChange={(value) => setSelectedMonth(Number(value))}>
                <SelectTrigger className="w-full sm:w-[180px]" id="month-select">
                    <SelectValue placeholder="Select Month" />
                </SelectTrigger>
                <SelectContent>
                    {monthNames.map((month, index) => (
                        <SelectItem key={index} value={String(index)}>{month}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Button onClick={handleExportDashboardPdf} variant="outline" size="sm"><FileDown className="mr-2 h-4 w-4" />PDF</Button>
            <Button onClick={handleExportDashboardExcel} variant="outline" size="sm"><FileDown className="mr-2 h-4 w-4" />Excel</Button>
        </div>
      </div>
      
      <DashboardMetrics /> 

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
        <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Registered Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
            <div className="text-2xl font-bold">{allUsers.length}</div>
            <p className="text-xs text-muted-foreground">
                Across all departments and roles.
            </p>
            </CardContent>
        </Card>
         {/* Placeholder for one more key metric, or remove this card if only 2 are needed initially */}
        <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attendance Records</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
            <div className="text-2xl font-bold">{allAttendanceRecords.length}</div>
            <p className="text-xs text-muted-foreground">
                Overall meal scan entries.
            </p>
            </CardContent>
        </Card>
      </div>


      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                Daily Attendance: {monthNames[selectedMonth]} {yearForCharts}
            </CardTitle>
            <CardDescription>Daily meal attendance (Line Chart) for {monthNames[selectedMonth]}, {yearForCharts}.</CardDescription>
          </CardHeader>
          <CardContent>
            {dailyAttendanceData.length > 0 && dailyAttendanceData.some(d => d.count > 0) ? (
              <ChartContainer config={attendanceChartConfig} className="h-[300px] w-full">
                <LineChart data={dailyAttendanceData} accessibilityLayer margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3"/>
                  <XAxis dataKey="day" tickLine={false} tickMargin={10} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={30} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="var(--color-count)" 
                    strokeWidth={2}
                    dot={{ r: 4, fill: "var(--color-count)" }}
                    activeDot={{ r: 6, stroke: "var(--background)", fill: "var(--color-count)", strokeWidth: 2 }} 
                  />
                </LineChart>
              </ChartContainer>
            ) : (
              <p className="text-center text-muted-foreground py-10">No attendance data for {monthNames[selectedMonth]}, {yearForCharts}.</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <LineChartIcon className="h-5 w-5 text-primary" />
                Monthly Attendance: Year {yearForCharts}
            </CardTitle>
            <CardDescription>Monthly meal attendance (Line Chart) for the year {yearForCharts}.</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyAttendanceData.length > 0 && monthlyAttendanceData.some(m => m.count > 0) ? (
            <ChartContainer config={attendanceChartConfig} className="h-[300px] w-full">
              <LineChart data={monthlyAttendanceData} accessibilityLayer margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={30} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <RechartsLegend content={<ChartLegendContent />} />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="var(--color-count)" 
                  strokeWidth={2}
                  dot={{ r: 4, fill: "var(--color-count)" }}
                  activeDot={{ r: 6, stroke: "var(--background)", fill: "var(--color-count)", strokeWidth: 2 }}
                />
              </LineChart>
            </ChartContainer>
            ) : (
              <p className="text-center text-muted-foreground py-10">No attendance data for the year {yearForCharts}.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <PieChartLucideIcon className="h-5 w-5 text-primary" />
                Student Distribution by Grade
            </CardTitle>
            <CardDescription>Breakdown of students across different grades.</CardDescription>
          </CardHeader>
          <CardContent>
            {studentGradeDistributionData.length > 0 ? (
              <ChartContainer config={gradeChartConfig} className="h-[300px] w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey="value" hideLabel />} />
                  <Pie data={studentGradeDistributionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                    {studentGradeDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
                    ))}
                  </Pie>
                   <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                </PieChart>
              </ChartContainer>
            ) : (
              <p className="text-center text-muted-foreground py-10">No student data available for grade distribution.</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                User Distribution by Role
            </CardTitle>
            <CardDescription>Breakdown of users by their assigned roles.</CardDescription>
          </CardHeader>
          <CardContent>
            {userRoleDistributionData.length > 0 ? (
               <ChartContainer config={roleChartConfig} className="h-[300px] w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey="value" hideLabel />} />
                  <Pie data={userRoleDistributionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                    {userRoleDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                </PieChart>
              </ChartContainer>
            ) : (
              <p className="text-center text-muted-foreground py-10">No user data available for role distribution.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
    

    