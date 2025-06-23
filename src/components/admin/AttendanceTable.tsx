
"use client";

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
import { format, parseISO } from 'date-fns';
import type { AttendanceRecordWithStudent } from "@/types";

export type SortableAttendanceKeys = 'studentId' | 'studentName' | 'recordDate' | 'mealType' | 'scannedAtTimestamp' | 'status';

export interface SortConfig {
  key: SortableAttendanceKeys | null;
  direction: 'ascending' | 'descending';
}

interface AttendanceTableProps {
  records: AttendanceRecordWithStudent[];
  sortConfig?: SortConfig; 
  onSort?: (key: SortableAttendanceKeys) => void; 
}

export function AttendanceTable({ 
  records, 
  sortConfig = { key: 'recordDate', direction: 'descending' }, 
  onSort = () => {}
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
            <SortableTableHead columnKey="recordDate">Date</SortableTableHead>
            <SortableTableHead columnKey="mealType">Meal Type</SortableTableHead>
            <SortableTableHead columnKey="scannedAtTimestamp">Scanned At</SortableTableHead>
            <SortableTableHead columnKey="status" className="text-right">Status</SortableTableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id}>
              <TableCell className="font-medium">{record.student.studentId}</TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={record.student.profileImageURL || undefined} alt={record.student.name} data-ai-hint="student profile" />
                    <AvatarFallback>{record.student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{record.student.name}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>{format(parseISO(record.recordDate as unknown as string), 'yyyy-MM-dd')}</TableCell>
              <TableCell>{record.mealType.charAt(0) + record.mealType.slice(1).toLowerCase()}</TableCell>
              <TableCell>{record.scannedAtTimestamp ? format(parseISO(record.scannedAtTimestamp as unknown as string), 'hh:mm a') : 'N/A'}</TableCell>
              <TableCell className="text-right">
                <Badge
                  variant={record.status === "PRESENT" ? "default" : "destructive"}
                  className={`capitalize ${record.status === "PRESENT" ? 'bg-green-500/20 text-green-700 border-green-500/30 hover:bg-green-500/30' : 'bg-red-500/20 text-red-700 border-red-500/30 hover:bg-red-500/30'}`}
                >
                  {record.status === "PRESENT" ? <CheckCircle className="mr-1 h-3 w-3" /> : <XCircle className="mr-1 h-3 w-3" />}
                  {record.status.toLowerCase()}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
