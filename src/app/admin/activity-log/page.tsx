
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Search, ChevronLeft, ChevronRight, History, ListChecks } from "lucide-react";
import { ActivityLogTable } from "@/components/admin/activity/ActivityLogTable";
import type { UserActivityLog } from "@/types/activity";
import { USER_ACTIVITY_LOG_KEY } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { AuthGuard } from '@/components/auth/AuthGuard';

type SortableActivityLogKeys = 'timestamp' | 'userId' | 'action';
type SortDirection = 'ascending' | 'descending';

interface SortConfig {
  key: SortableActivityLogKeys | null;
  direction: SortDirection;
}

const ITEMS_PER_PAGE = 10;

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<UserActivityLog[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoadingTable, setIsLoadingTable] = useState(true); // Start true to show loader initially

  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'timestamp', direction: 'descending' });
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setIsMounted(true);
    setIsLoadingTable(true);
    try {
      const storedLogsRaw = localStorage.getItem(USER_ACTIVITY_LOG_KEY);
      if (storedLogsRaw) {
        setLogs(JSON.parse(storedLogsRaw));
      }
    } catch (error) {
      console.error("Failed to load activity logs from localStorage", error);
      // Optionally, show a toast error
    } finally {
      setIsLoadingTable(false);
    }
  }, []);

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

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      processedLogs = processedLogs.filter(log =>
        log.userId.toLowerCase().includes(lowerSearchTerm) ||
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
        } else if (typeof aValue === 'number' && typeof bValue === 'number') { // Should not happen for these keys
          comparison = aValue - bValue;
        } else { // Default to string comparison (e.g., for dates)
          comparison = String(aValue).localeCompare(String(bValue));
        }
        return sortConfig.direction === 'ascending' ? comparison : -comparison;
      });
    }
    return processedLogs;
  }, [logs, searchTerm, sortConfig]);

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


  if (!isMounted) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading activity log...</p>
      </div>
    );
  }

  return (
    <AuthGuard requiredRole="Admin">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-primary flex items-center">
              <ListChecks className="mr-3 h-8 w-8" /> User Activity Log
            </h2>
            <p className="text-muted-foreground">View recorded user actions within the application.</p>
          </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Activity Records</CardTitle>
            <CardDescription>Browse user activity logs. Data is stored in your browser's local storage.</CardDescription>
            <div className="mt-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by User ID, Action, or Details..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10 w-full sm:w-1/2 md:w-1/3"
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingTable ? (
              <div className="flex justify-center items-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2">Loading logs...</span>
              </div>
            ) : (
              <ActivityLogTable 
                logs={currentTableData} 
                sortConfig={sortConfig}
                onSort={handleSort}
              />
            )}
            {filteredAndSortedLogs.length > ITEMS_PER_PAGE && !isLoadingTable && (
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
            {filteredAndSortedLogs.length === 0 && !isLoadingTable && (
              <p className="text-center text-muted-foreground py-4">No activity logs match your current search criteria or no logs found.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}
