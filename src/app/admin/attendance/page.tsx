import { AttendanceTable } from "@/components/admin/AttendanceTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Filter, PlusCircle } from "lucide-react";

export default function AttendancePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-primary">Attendance Records</h2>
          <p className="text-muted-foreground">View and manage all meal attendance records.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" /> Filter
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
           <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Record
          </Button>
        </div>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>All Records</CardTitle>
          <CardDescription>Detailed list of all attendance entries.</CardDescription>
        </CardHeader>
        <CardContent>
          <AttendanceTable />
          {/* Add pagination controls here if needed */}
        </CardContent>
      </Card>
    </div>
  );
}
