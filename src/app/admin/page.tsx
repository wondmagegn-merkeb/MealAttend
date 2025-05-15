import { WelcomeBanner } from "@/components/admin/WelcomeBanner";
import { DashboardMetrics } from "@/components/admin/DashboardMetrics";
import { AttendanceTable } from "@/components/admin/AttendanceTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
          <AttendanceTable />
        </CardContent>
      </Card>
    </div>
  );
}
