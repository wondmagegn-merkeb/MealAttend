
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Search, ChevronLeft, ChevronRight, ListChecks, AlertTriangle } from "lucide-react";
import { ActivityLogTable } from "@/components/admin/activity/ActivityLogTable";
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import type { UserActivityLog } from '@/types';

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

const ITEMS_PER_PAGE = 5;

export default function ActivityLogPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'activityTimestamp', direction: 'descending' });
  const [currentPage, setCurrentPage] = useState(1);
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

  const filteredAndSortedLogs = useMemo(() => {
    let processedLogs = [...logs];

    // Implement role-based filtering
    if (currentUser?.role === 'User') {
        processedLogs = processedLogs.filter(log => log.userIdentifier === currentUser.userId);
    }

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      processedLogs = processedLogs.filter(log =>
        log.userIdentifier.toLowerCase().includes(lowerSearchTerm) ||
        log.action.toLowerCase().includes(lowerSearchTerm) ||
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
  }, [logs, searchTerm, sortConfig, currentUser]);

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
          <CardTitle>Activity Records</CardTitle>
          <CardDescription>Browse activity logs.</CardDescription>
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={currentUser?.role === 'Admin' ? "Search by User ID, Action, or Details..." : "Search your actions or details..."}
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10 w-full sm:w-1/2 md:w-1/3"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingLogs ? (
            <div className="flex justify-center items-center py-4">
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
            <p className="text-center text-muted-foreground py-4">No activity logs match your current search criteria or no logs found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
