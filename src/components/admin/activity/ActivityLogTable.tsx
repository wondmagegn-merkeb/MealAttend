
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronsUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { format, parseISO } from 'date-fns';
import { cn } from "@/lib/utils";
import type { UserActivityLog } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type SortableActivityLogKeys = 'activityTimestamp' | 'userIdentifier' | 'action';
type SortDirection = 'ascending' | 'descending';

interface SortConfig {
  key: SortableActivityLogKeys | null;
  direction: SortDirection;
}

interface ActivityLogTableProps {
  logs: UserActivityLog[];
  sortConfig: SortConfig;
  onSort: (key: SortableActivityLogKeys) => void;
}

export function ActivityLogTable({ logs, sortConfig, onSort }: ActivityLogTableProps) {
  
  const renderSortIcon = (columnKey: SortableActivityLogKeys) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />;
    }
    return sortConfig.direction === 'ascending' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
  };

  const SortableTableHead = ({ columnKey, children, className }: { columnKey: SortableActivityLogKeys, children: React.ReactNode, className?: string }) => (
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

  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        No activity logs found.
      </div>
    );
  }

  return (
    <>
      {/* Mobile View */}
      <div className="md:hidden space-y-4">
        {logs.map((log) => (
          <Card key={log.id} className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">{log.action}</CardTitle>
              <CardDescription>{format(parseISO(log.activityTimestamp as unknown as string), "MMM dd, yyyy, hh:mm:ss a")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="font-semibold text-muted-foreground">User: </span>
                <span>{log.userIdentifier}</span>
              </div>
              <div>
                <span className="font-semibold text-muted-foreground">Details: </span>
                <span className="text-muted-foreground">{log.details || 'N/A'}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block rounded-lg border shadow-sm bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead columnKey="activityTimestamp">Timestamp</SortableTableHead>
              <SortableTableHead columnKey="userIdentifier">User ID</SortableTableHead>
              <SortableTableHead columnKey="action">Action</SortableTableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-mono text-xs whitespace-nowrap">
                  {format(parseISO(log.activityTimestamp as unknown as string), "MMM dd, yyyy, hh:mm:ss a")}
                </TableCell>
                <TableCell className="font-medium">{log.userIdentifier}</TableCell>
                <TableCell>{log.action}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{log.details || 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
