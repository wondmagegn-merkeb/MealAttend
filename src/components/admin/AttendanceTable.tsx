
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type SortableAttendanceKeys = 'studentId' | 'studentName' | 'recordDate' | 'mealType' | 'scannedAtTimestamp' | 'status' | 'scannedBy';

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
      className={cn("cursor-pointer hover:bg-muted/50 transition-colors group whitespace-nowrap", className)}
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
    <>
      {/* Mobile View */}
      <div className="md:hidden space-y-4">
        {records.map((record) => (
          <Card key={record.id} className="shadow-md">
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={record.student.profileImageURL || undefined} alt={record.student.name} data-ai-hint="student profile" />
                  <AvatarFallback>{record.student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg">{record.student.name}</CardTitle>
                  <CardDescription>{record.student.studentId}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date:</span>
                <span>{format(parseISO(record.recordDate as unknown as string), 'yyyy-MM-dd')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Meal:</span>
                <span>{record.mealType.charAt(0) + record.mealType.slice(1).toLowerCase()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Scanned At:</span>
                <span>{record.scannedAtTimestamp ? format(parseISO(record.scannedAtTimestamp as unknown as string), 'hh:mm a') : 'N/A'}</span>
              </div>
               <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Scanned By:</span>
                <span>{record.scannedBy?.fullName || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status:</span>
                <Badge
                  variant={record.status === "PRESENT" ? "default" : "destructive"}
                  className={`capitalize ${record.status === "PRESENT" ? 'bg-green-500/20 text-green-700 border-green-500/30' : 'bg-red-500/20 text-red-700 border-red-500/30'}`}
                >
                  {record.status === "PRESENT" ? <CheckCircle className="mr-1 h-3 w-3" /> : <XCircle className="mr-1 h-3 w-3" />}
                  {record.status.toLowerCase()}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block rounded-lg border shadow-sm bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead columnKey="studentId">Student ID</SortableTableHead>
              <SortableTableHead columnKey="studentName">Name</SortableTableHead>
              <SortableTableHead columnKey="recordDate">Date</SortableTableHead>
              <SortableTableHead columnKey="mealType">Meal Type</SortableTableHead>
              <SortableTableHead columnKey="scannedAtTimestamp">Scanned At</SortableTableHead>
              <SortableTableHead columnKey="scannedBy">Scanned By</SortableTableHead>
              <SortableTableHead columnKey="status" className="text-right">Status</SortableTableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record.id}>
                <TableCell className="font-medium whitespace-nowrap">{record.student.studentId}</TableCell>
                <TableCell className="whitespace-nowrap">
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
                <TableCell className="whitespace-nowrap">{format(parseISO(record.recordDate as unknown as string), 'yyyy-MM-dd')}</TableCell>
                <TableCell className="whitespace-nowrap">{record.mealType.charAt(0) + record.mealType.slice(1).toLowerCase()}</TableCell>
                <TableCell className="whitespace-nowrap">{record.scannedAtTimestamp ? format(parseISO(record.scannedAtTimestamp as unknown as string), 'hh:mm a') : 'N/A'}</TableCell>
                <TableCell className="whitespace-nowrap">{record.scannedBy?.fullName || 'N/A'}</TableCell>
                <TableCell className="text-right whitespace-nowrap">
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
    </>
  );
}
