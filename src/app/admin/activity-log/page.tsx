
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Search, ChevronLeft, ChevronRight, ListChecks, AlertTriangle, Calendar as CalendarIcon, FilterX } from "lucide-react";
import { ActivityLogTable } from "@/components/admin/activity/ActivityLogTable";
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import type { UserActivityLog } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';
import { format, isWithinInterval, startOfDay, endOfDay, parseISO } from 'date-fns';
import { AuthGuard } from '@/components/auth/AuthGuard';

const fetchActivityLogs = async (): Promise<UserActivityLog[]> => {
  const response = await fetch('/api/activity-log');
  if (!response.ok) {
    throw new Error('Failed to fetch activity logs');
  }
  return response.json();
};

type SortableActivityLogKeys = 'activityTimestamp' | 'userIdentifier' | 'action';
type SortDirection = 'ascending' | 'descending';

interface SortConfig {
  key: SortableActivityLogKeys | null;
  direction: SortDirection;
}

const ITEMS_PER_PAGE = 10;
const ALL_ACTIONS = [
    "LOGIN_SUCCESS",
    "LOGIN_FAILURE",
    "LOGOUT_SUCCESS",
    "PASSWORD_CHANGE_SUCCESS",
    "PROFILE_UPDATE_SUCCESS",
    "ATTENDANCE_RECORD_SUCCESS",
    "ATTENDANCE_FAILURE",
    "STUDENT_CREATE_SUCCESS",
    "STUDENT_UPDATE_SUCCESS",
    "STUDENT_DELETE_SUCCESS",
    "USER_CREATE_SUCCESS",
    "USER_UPDATE_SUCCESS",
    "USER_DELETE_SUCCESS",
    "DEPARTMENT_CREATE_SUCCESS",
    "DEPARTMENT_UPDATE_SUCCESS",
    "DEPARTMENT_DELETE_SUCCESS",
];


function ActivityLogPageContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'activityTimestamp', direction: 'descending' });
  const [currentPage, setCurrentPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRange | undefined>(undefined);
  const { currentUser } = useAuth();
  
  const { data: logs = [], isLoading: isLoadingLogs, error: logsError } = useQuery<UserActivityLog[]>({
    queryKey: ['activityLogs'],
    queryFn: fetchActivityLogs,
  });

  const handleSort = (key: SortableActivityLogKeys) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };
  
  const handleActionFilterChange = (value: string) => {
    setActionFilter(value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setActionFilter('all');
    setDateRangeFilter(undefined);
    setCurrentPage(1);
  };


  const filteredAndSortedLogs = useMemo(() => {
    let processedLogs = [...logs];

    // For non-admins, only show their own activity
    if (currentUser?.role !== 'Admin') {
        processedLogs = processedLogs.filter(log => log.userIdentifier === currentUser?.userId);
    }
    
    if (actionFilter !== 'all') {
        processedLogs = processedLogs.filter(log => log.action === actionFilter);
    }
    
    if (dateRangeFilter?.from) {
        processedLogs = processedLogs.filter(log => {
          const logDate = parseISO(log.activityTimestamp as unknown as string);
          const fromDate = startOfDay(dateRangeFilter.from!);
          const toDate = dateRangeFilter.to ? endOfDay(dateRangeFilter.to) : endOfDay(dateRangeFilter.from!);
          return isWithinInterval(logDate, { start: fromDate, end: toDate });
        });
    }

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      processedLogs = processedLogs.filter(log =>
        log.userIdentifier.toLowerCase().includes(lowerSearchTerm) ||
        (log.details && log.details.toLowerCase().includes(lowerSearchTerm))
      );
    }

    if (sortConfig.key) {
      processedLogs.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];
        
        let comparison = 0;
        if (aValue === null || aValue === undefined) comparison = 1;
        else if (bValue === null || bValue === undefined) comparison = -1;
        else if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = aValue.localeCompare(bValue);
        } else if (aValue instanceof Date && bValue instanceof Date) {
          comparison = aValue.getTime() - bValue.getTime();
        } else { // Default to string comparison
          comparison = String(aValue).localeCompare(String(bValue));
        }
        return sortConfig.direction === 'ascending' ? comparison : -comparison;
      });
    }
    return processedLogs;
  }, [logs, searchTerm, sortConfig, currentUser, actionFilter, dateRangeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedLogs.length / ITEMS_PER_PAGE));
  
  const currentTableData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredAndSortedLogs.slice(startIndex, endIndex);
  }, [filteredAndSortedLogs, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    } else if (currentPage < 1 && totalPages > 0) {
        setCurrentPage(1);
    } else if (filteredAndSortedLogs.length === 0){
        setCurrentPage(1);
    }
  }, [currentPage, totalPages, filteredAndSortedLogs.length]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-primary flex items-center">
            <ListChecks className="mr-3 h-8 w-8" /> 
            {currentUser?.role === 'Admin' ? 'User Activity Log' : 'My Activity Log'}
          </h2>
          <p className="text-muted-foreground">
            {currentUser?.role === 'Admin' 
              ? 'View recorded user actions within the application.' 
              : 'A record of your actions within the application.'}
          </p>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Filter & Search Logs</CardTitle>
          <CardDescription>Use the filters below to narrow down the activity log records.</CardDescription>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 items-end">
            <div className="relative">
                <label className="text-sm font-medium text-muted-foreground">Search by User/Details</label>
                <Search className="absolute left-3 bottom-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                type="search"
                placeholder={currentUser?.role === 'Admin' ? "User ID or details..." : "Search details..."}
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10"
                />
            </div>
            <div>
                 <label htmlFor="action-filter" className="text-sm font-medium text-muted-foreground">Action Type</label>
                 <Select value={actionFilter} onValueChange={handleActionFilterChange}>
                    <SelectTrigger id="action-filter">
                        <SelectValue placeholder="Filter by action" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Actions</SelectItem>
                        {ALL_ACTIONS.map(action => (
                            <SelectItem key={action} value={action}>
                                {action.replace(/_/g, ' ')}
                            </SelectItem>
                        ))}
                    </SelectContent>
                 </Select>
            </div>
            <div>
                <label htmlFor="date-range" className="text-sm font-medium text-muted-foreground">Date Range</label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button id="date-range" variant={"outline"} className={cn("w-full justify-start text-left font-normal", !dateRangeFilter && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRangeFilter?.from ? (dateRangeFilter.to ? (<>{format(dateRangeFilter.from, "LLL dd, y")} - {format(dateRangeFilter.to, "LLL dd, y")}</>) : (format(dateRangeFilter.from, "LLL dd, y"))) : (<span>Pick a date range</span>)}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar initialFocus mode="range" defaultMonth={dateRangeFilter?.from} selected={dateRangeFilter} onSelect={setDateRangeFilter} numberOfMonths={2} />
                    </PopoverContent>
                </Popover>
            </div>
             <div className="flex gap-2">
                 <Button onClick={clearFilters} variant="outline" className="w-full">
                    <FilterX className="mr-2 h-4 w-4" /> Clear Filters
                </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingLogs ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2">Loading logs...</span>
            </div>
          ) : logsError ? (
             <div className="text-center py-10 text-destructive">
                <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
                <p>Error loading activity logs: {(logsError as Error).message}</p>
            </div>
          ) : (
            <ActivityLogTable 
              logs={currentTableData} 
              sortConfig={sortConfig}
              onSort={handleSort}
            />
          )}
          {filteredAndSortedLogs.length > ITEMS_PER_PAGE && !isLoadingLogs && !logsError && (
            <div className="flex items-center justify-between pt-4 mt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages} ({filteredAndSortedLogs.length} logs)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          {filteredAndSortedLogs.length === 0 && !isLoadingLogs && !logsError && (
            <p className="text-center text-muted-foreground py-10">No activity logs match your current search criteria or no logs found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ActivityLogPage() {
    return (
        <AuthGuard requiredRole="Admin">
            <ActivityLogPageContent />
        </AuthGuard>
    )
}
