
"use client";

import type { Student } from "@/types/student";
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
import { CheckCircle, XCircle, ChevronsUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from '@/lib/utils';

export type MealType = "Breakfast" | "Lunch" | "Dinner";

export interface AttendanceRecord {
  id: string; 
  studentId: string; 
  studentName: string;
  studentAvatar?: string; 
  date: string; 
  mealType: MealType;
  scannedAt: string; 
  status: "Present" | "Absent";
}

export type SortableAttendanceKeys = 'studentId' | 'studentName' | 'date' | 'mealType' | 'scannedAt' | 'status';

export interface SortConfig {
  key: SortableAttendanceKeys | null;
  direction: 'ascending' | 'descending';
}

interface AttendanceTableProps {
  records: AttendanceRecord[];
  sortConfig?: SortConfig; 
  onSort?: (key: SortableAttendanceKeys) => void; 
  studentsMap?: Map<string, Student>; 
}

export function AttendanceTable({ 
  records, 
  sortConfig = { key: 'date', direction: 'descending' }, 
  onSort = () => {}, 
  studentsMap = new Map<string, Student>() 
}: AttendanceTableProps) {
  
  const renderSortIcon = (columnKey: SortableAttendanceKeys) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />;
    }
    return sortConfig.direction === 'ascending' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
  };

  const SortableTableHead = ({ columnKey, children, className }: { columnKey: SortableAttendanceKeys, children: React.ReactNode, className?: string }) => (
    <TableHead
      className={cn("cursor-pointer hover:bg-muted/50 transition-colors group", className)}
      onClick={() => onSort(columnKey)}
    >
      <div className="flex items-center">
        {children}
        {renderSortIcon(columnKey)}
      </div>
    </TableHead>
  );

  if (!records || records.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        No attendance records found.
      </div>
    );
  }

  return (
    <div className="rounded-lg border shadow-sm bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableTableHead columnKey="studentId" className="w-[120px]">Student ID</SortableTableHead>
            <SortableTableHead columnKey="studentName">Name</SortableTableHead>
            <SortableTableHead columnKey="date">Date</SortableTableHead>
            <SortableTableHead columnKey="mealType">Meal Type</SortableTableHead>
            <SortableTableHead columnKey="scannedAt">Scanned At</SortableTableHead>
            <SortableTableHead columnKey="status" className="text-right">Status</SortableTableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => {
            const student = studentsMap.get(record.studentId);
            const avatarUrl = student?.profileImageURL || record.studentAvatar || `https://placehold.co/40x40.png?text=${record.studentName.split(' ').map(n => n[0]).join('')}`;
            
            return (
              <TableRow key={record.id}>
                <TableCell className="font-medium">{record.studentId}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={avatarUrl} alt={record.studentName} data-ai-hint="student profile" />
                      <AvatarFallback>{record.studentName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{record.studentName}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{record.date}</TableCell>
                <TableCell>{record.mealType}</TableCell>
                <TableCell>{record.scannedAt}</TableCell>
                <TableCell className="text-right">
                  <Badge
                    variant={record.status === "Present" ? "default" : "destructive"}
                    className={`capitalize ${record.status === "Present" ? 'bg-green-500/20 text-green-700 border-green-500/30 hover:bg-green-500/30' : 'bg-red-500/20 text-red-700 border-red-500/30 hover:bg-red-500/30'}`}
                  >
                    {record.status === "Present" ? <CheckCircle className="mr-1 h-3 w-3" /> : <XCircle className="mr-1 h-3 w-3" />}
                    {record.status}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
  
