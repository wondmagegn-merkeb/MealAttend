
"use client";

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { WelcomeBanner } from "@/components/admin/WelcomeBanner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Users, CalendarDays, LineChart as LineChartIcon, FileDown, PieChart as PieChartLucideIcon, UserCheck, AlertTriangle, History, ArrowRight } from "lucide-react";
import { LineChart, Line, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, Legend as RechartsLegend, PieChart, Pie, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart";
import { format, formatDistanceToNow, getDaysInMonth, getMonth, getYear, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { QuickActions } from '@/components/admin/QuickActions';
import type { Student, User, AttendanceRecordWithStudent, UserActivityLog } from '@/types';
import { AuthGuard } from '@/components/auth/AuthGuard';

const fetchDashboardData = async (): Promise<{ students: Student[], users: User[], attendance: AttendanceRecordWithStudent[], activity: UserActivityLog[] }> => {
    const [studentsRes, usersRes, attendanceRes, activityRes] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/users'),
        fetch('/api/attendance'),
        fetch('/api/activity-log')
    ]);

    if (!studentsRes.ok || !usersRes.ok || !attendanceRes.ok || !activityRes.ok) {
        // Handle individual failures if necessary
        const getError = async (res: Response) => res.ok ? null : `${res.url}: ${res.statusText}`;
        const errors = await Promise.all([getError(studentsRes), getError(usersRes), getError(attendanceRes), getError(activityRes)]);
        throw new Error(`Failed to fetch dashboard data. Errors: ${errors.filter(e => e).join(', ')}`);
    }

    return {
        students: await studentsRes.json(),
        users: await usersRes.json(),
        attendance: await attendanceRes.json(),
        activity: await activityRes.json()
    };
};

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

function AdminDashboardPageContent() {
  const [selectedYear, setSelectedYear] = useState<string>(String(CURRENT_GREGORIAN_YEAR));
  const [selectedMonth, setSelectedMonth] = useState<number>(CURRENT_GREGORIAN_MONTH); 
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const { data, isLoading, error: dataError } = useQuery({
      queryKey: ['dashboardData'],
      queryFn: fetchDashboardData,
      enabled: !!currentUser?.canReadUsers && !!currentUser?.canReadStudents,
  });

  const allStudents = data?.students || [];
  const allUsers = data?.users || [];
  const allAttendanceRecords = data?.attendance || [];
  const allActivityLogs = data?.activity || [];
  
  const userActivity = useMemo(() => {
    if (!currentUser || !allActivityLogs.length) return [];
    return allActivityLogs
      .filter(log => log.userIdentifier === currentUser.userId)
      .slice(0, 3);
  }, [currentUser, allActivityLogs]);

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
  
  const handleExportDashboardPdf = useCallback(() => {
      const doc = new jsPDF();
      const title = `MealAttend Dashboard Summary - ${format(new Date(), 'yyyy-MM-dd')}`;
      doc.setFontSize(18);
      doc.text(title, 14, 20);

      const summaryData = [
          ['Metric', 'Value'],
          [`Total Students (${selectedYear === 'all_years' ? 'All Time' : `Adm. Year: ${selectedYear}`})`, String(totalStudentsInSelectedYear)],
          ['Total Registered Users', String(allUsers.length)],
          ['Total Attendance Records', String(allAttendanceRecords.length)],
      ];
      autoTable(doc, { startY: 30, head: [['Summary', '']], body: summaryData});

      autoTable(doc, { head: [['Day', 'Attendance']], body: dailyAttendanceData.map(d => [d.day, d.count]),
          didDrawPage: (data) => { doc.text(`Daily Attendance: ${monthNames[selectedMonth]} ${yearForCharts}`, 14, data.cursor?.y ? data.cursor.y - 10 : 0); }
      });
      autoTable(doc, { head: [['Month', 'Attendance']], body: monthlyAttendanceData.map(m => [m.month, m.count]),
          didDrawPage: (data) => { doc.text(`Monthly Attendance: ${yearForCharts}`, 14, data.cursor?.y ? data.cursor.y - 10 : 0); }
      });
      autoTable(doc, { head: [['Grade', 'Student Count']], body: studentGradeDistributionData.map(g => [g.name, g.value]),
          didDrawPage: (data) => { doc.text('Student Grade Distribution', 14, data.cursor?.y ? data.cursor.y - 10 : 0); }
      });
      autoTable(doc, { head: [['Role', 'User Count']], body: userRoleDistributionData.map(r => [r.name, r.value]),
          didDrawPage: (data) => { doc.text('User Role Distribution', 14, data.cursor?.y ? data.cursor.y - 10 : 0); }
      });

      doc.save(`MealAttend_Dashboard_${format(new Date(), 'yyyyMMdd')}.pdf`);
      toast({ title: 'PDF Exported', description: 'Dashboard summary has been exported.' });
  }, [selectedYear, selectedMonth, totalStudentsInSelectedYear, dailyAttendanceData, monthlyAttendanceData, studentGradeDistributionData, userRoleDistributionData, allUsers.length, allAttendanceRecords.length, yearForCharts, toast]);

  const handleExportDashboardExcel = useCallback(() => {
      const wb = XLSX.utils.book_new();

      const summaryWS = XLSX.utils.aoa_to_sheet([
          ['Metric', 'Value'],
          [`Total Students (${selectedYear === 'all_years' ? 'All Time' : `Adm. Year: ${selectedYear}`})`, totalStudentsInSelectedYear],
          ['Total Registered Users', allUsers.length],
          ['Total Attendance Records', allAttendanceRecords.length],
      ]);
      XLSX.utils.book_append_sheet(wb, summaryWS, 'Summary');

      const dailyWS = XLSX.utils.json_to_sheet(dailyAttendanceData);
      XLSX.utils.book_append_sheet(wb, dailyWS, `Daily Attendance - ${monthNames[selectedMonth]}`);
      
      const monthlyWS = XLSX.utils.json_to_sheet(monthlyAttendanceData);
      XLSX.utils.book_append_sheet(wb, monthlyWS, `Monthly Attendance - ${yearForCharts}`);

      const gradeWS = XLSX.utils.json_to_sheet(studentGradeDistributionData);
      XLSX.utils.book_append_sheet(wb, gradeWS, 'Grade Distribution');
      
      const roleWS = XLSX.utils.json_to_sheet(userRoleDistributionData);
      XLSX.utils.book_append_sheet(wb, roleWS, 'Role Distribution');

      XLSX.writeFile(wb, `MealAttend_Dashboard_${format(new Date(), 'yyyyMMdd')}.xlsx`);
      toast({ title: 'Excel Exported', description: 'Dashboard data has been exported.' });
  }, [selectedYear, selectedMonth, totalStudentsInSelectedYear, dailyAttendanceData, monthlyAttendanceData, studentGradeDistributionData, userRoleDistributionData, allUsers.length, allAttendanceRecords.length, yearForCharts, toast]);


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

  // If a user doesn't have permissions for the dashboard, show a welcome/info page instead.
  if (!currentUser?.canReadUsers) {
    return (
       <div className="space-y-6">
        <WelcomeBanner />
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Welcome to MealAttend</CardTitle>
                <CardDescription>Your central hub for student management.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                    Use the navigation menu on the left to access the features you have permission for, such as managing students.
                </p>
                <QuickActions />
            </CardContent>
        </Card>
       </div>
    )
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
      
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Students ({selectedYear === 'all_years' ? 'All Time' : `Adm. Year: ${selectedYear}`})</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader>
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
            <QuickActions />
        </div>
        <div className="lg:col-span-4">
             <Card className="shadow-lg h-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><History className="h-5 w-5 text-primary"/> Your Recent Activity</CardTitle>
                    <CardDescription>Your last 3 actions in the system.</CardDescription>
                </CardHeader>
                <CardContent>
                    {userActivity.length > 0 ? (
                        <ul className="space-y-4">
                            {userActivity.map(log => (
                                <li key={log.id} className="flex items-start gap-3">
                                    <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary/80" />
                                    <div className="flex-grow min-w-0">
                                        <p className="text-sm font-medium leading-tight">{log.action.replace(/_/g, ' ')}</p>
                                        <p className="text-xs text-muted-foreground truncate" title={log.details || undefined}>{log.details || 'No additional details'}</p>
                                        <p className="text-xs text-muted-foreground/80">{formatDistanceToNow(parseISO(log.activityTimestamp as unknown as string), { addSuffix: true })}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (<p className="text-center text-sm text-muted-foreground py-10">No recent activity found.</p>)}
                     <Button variant="link" asChild className="p-0 h-auto mt-4 text-sm">
                        <Link href="/admin/activity-log">View All Activity <ArrowRight className="ml-1 h-4 w-4"/></Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader><CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-primary" />Daily Attendance: {monthNames[selectedMonth]} {yearForCharts}</CardTitle><CardDescription>Daily meal attendance (Line Chart) for {monthNames[selectedMonth]}, {yearForCharts}.</CardDescription></CardHeader>
          <CardContent>
            {dailyAttendanceData.length > 0 && dailyAttendanceData.some(d => d.count > 0) ? (
              <ChartContainer config={attendanceChartConfig} className="h-[300px] w-full">
                <LineChart data={dailyAttendanceData} accessibilityLayer margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
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
              <LineChart data={monthlyAttendanceData} accessibilityLayer margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
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

export default function AdminDashboardPage() {
    return (
        <AuthGuard>
            <AdminDashboardPageContent />
        </AuthGuard>
    )
}
