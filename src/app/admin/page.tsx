
import { WelcomeBanner } from "@/components/admin/WelcomeBanner";
import { DashboardMetrics } from "@/components/admin/DashboardMetrics";
import { AttendanceTable, type AttendanceRecord } from "@/components/admin/AttendanceTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Mock data for recent attendance on the dashboard
const recentAttendanceRecords: AttendanceRecord[] = [
  { id: 'dash_att_001', studentId: 'S1001', studentName: 'Alice Johnson', studentEmail: 'alice.johnson@example.com', date: '2024-07-30', mealType: 'Lunch', scannedAt: '12:35 PM', status: 'Present' },
  { id: 'dash_att_002', studentId: 'S1002', studentName: 'Bob Williams', studentEmail: 'bob.williams@example.com', date: '2024-07-30', mealType: 'Breakfast', scannedAt: '08:05 AM', status: 'Present' },
  { id: 'dash_att_003', studentId: 'S1003', studentName: 'Carol Davis', studentEmail: 'carol.davis@example.com', date: '2024-07-29', mealType: 'Dinner', scannedAt: '07:10 PM', status: 'Present' },
  { id: 'dash_att_004', studentId: 'S1001', studentName: 'Alice Johnson', studentEmail: 'alice.johnson@example.com', date: '2024-07-29', mealType: 'Lunch', scannedAt: 'N/A', status: 'Absent' },
  { id: 'dash_att_005', studentId: 'S1004', studentName: 'David Brown', studentEmail: 'david.brown@example.com', date: '2024-07-28', mealType: 'Lunch', scannedAt: '12:55 PM', status: 'Present' },
];


export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <WelcomeBanner />
      
      <h2 className="text-3xl font-semibold tracking-tight text-primary">Dashboard Overview</h2>
      
      <DashboardMetrics />
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Recent Attendance</CardTitle>
          <CardDescription>A quick look at the latest attendance records.</CardDescription>
        </CardHeader>
        <CardContent>
          <AttendanceTable records={recentAttendanceRecords} />
        </CardContent>
      </Card>
    </div>
  );
}
