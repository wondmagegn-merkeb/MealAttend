import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, XCircle } from "lucide-react";

const attendanceData = [
  {
    id: "USR001",
    name: "Alice Wonderland",
    avatar: "https://placehold.co/40x40.png?text=AW",
    email: "alice@example.com",
    date: "2024-07-28",
    mealType: "Lunch",
    scannedAt: "12:35 PM",
    status: "Present",
  },
  {
    id: "USR002",
    name: "Bob The Builder",
    avatar: "https://placehold.co/40x40.png?text=BB",
    email: "bob@example.com",
    date: "2024-07-28",
    mealType: "Lunch",
    scannedAt: "12:40 PM",
    status: "Present",
  },
  {
    id: "USR003",
    name: "Charlie Brown",
    avatar: "https://placehold.co/40x40.png?text=CB",
    email: "charlie@example.com",
    date: "2024-07-28",
    mealType: "Lunch",
    scannedAt: "N/A",
    status: "Absent",
  },
  {
    id: "USR004",
    name: "Diana Prince",
    avatar: "https://placehold.co/40x40.png?text=DP",
    email: "diana@example.com",
    date: "2024-07-27",
    mealType: "Dinner",
    scannedAt: "07:15 PM",
    status: "Present",
  },
];

export function AttendanceTable() {
  return (
    <div className="rounded-lg border shadow-sm bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">User ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Meal Type</TableHead>
            <TableHead>Scanned At</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {attendanceData.map((record) => (
            <TableRow key={record.id}>
              <TableCell className="font-medium">{record.id}</TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={record.avatar} alt={record.name} data-ai-hint="person avatar" />
                    <AvatarFallback>{record.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{record.name}</div>
                    <div className="text-xs text-muted-foreground">{record.email}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>{record.date}</TableCell>
              <TableCell>{record.mealType}</TableCell>
              <TableCell>{record.scannedAt}</TableCell>
              <TableCell className="text-right">
                <Badge
                  variant={record.status === "Present" ? "default" : "destructive"}
                  className={`capitalize ${record.status === "Present" ? 'bg-green-500/20 text-green-700 border-green-500/30' : 'bg-red-500/20 text-red-700 border-red-500/30'}`}
                >
                  {record.status === "Present" ? <CheckCircle className="mr-1 h-3 w-3" /> : <XCircle className="mr-1 h-3 w-3" />}
                  {record.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
