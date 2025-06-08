
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PlusCircle, Building2 as DepartmentIcon, Loader2, Search, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { DepartmentsTable } from "@/components/admin/departments/DepartmentsTable";
import type { Department } from "@/types/department";
import { useToast } from "@/hooks/use-toast";
import { logUserActivity } from '@/lib/activityLogger';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

type SortableDepartmentKeys = 'id' | 'name';
type SortDirection = 'ascending' | 'descending';

interface SortConfig {
  key: SortableDepartmentKeys | null;
  direction: SortDirection;
}

const ITEMS_PER_PAGE = 5;

async function fetchDepartments(): Promise<Department[]> {
  const response = await fetch('/api/departments');
  if (!response.ok) {
    throw new Error('Failed to fetch departments');
  }
  return response.json();
}

async function deleteDepartmentAPI(departmentId: string): Promise<void> {
  const response = await fetch(`/api/departments/${departmentId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to delete department' }));
    throw new Error(errorData.message || 'Failed to delete department');
  }
}

export default function DepartmentsPage() {
  const { toast } = useToast();
  const { currentUserId } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'ascending' });
  const [currentPage, setCurrentPage] = useState(1);
  
  const { data: departments = [], isLoading: isLoadingDepartments, error: departmentsError } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: fetchDepartments,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDepartmentAPI,
    onSuccess: (_, departmentIdToDelete) => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      const deletedDepartment = departments.find(d => d.id === departmentIdToDelete);
      logUserActivity(currentUserId, "DEPARTMENT_DELETE_SUCCESS", `Deleted department ID: ${departmentIdToDelete}, Name: ${deletedDepartment?.name || 'Unknown'}`);
      toast({
        title: "Department Deleted",
        description: "The department record has been successfully deleted.",
      });
    },
    onError: (error: Error, departmentIdToDelete) => {
      logUserActivity(currentUserId, "DEPARTMENT_DELETE_FAILURE", `Attempted to delete department ID: ${departmentIdToDelete}. Error: ${error.message}`);
      toast({
        title: "Error Deleting Department",
        description: error.message || "Failed to delete department. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleEditDepartment = (department: Department) => {
    router.push(`/admin/departments/${department.id}/edit`);
  };

  const handleDeleteDepartment = (departmentIdToDelete: string) => {
    deleteMutation.mutate(departmentIdToDelete);
  };

  const handleSort = (key: SortableDepartmentKeys) => {
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

  const filteredAndSortedDepartments = useMemo(() => {
    let processedDepartments = [...departments];

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      processedDepartments = processedDepartments.filter(dept =>
        dept.name.toLowerCase().includes(lowerSearchTerm) ||
        dept.id.toLowerCase().includes(lowerSearchTerm)
      );
    }

    if (sortConfig.key) {
      processedDepartments.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];
        
        let comparison = 0;
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = aValue.localeCompare(bValue);
        } else {
          comparison = String(aValue).localeCompare(String(bValue));
        }
        return sortConfig.direction === 'ascending' ? comparison : -comparison;
      });
    }
    return processedDepartments;
  }, [departments, searchTerm, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedDepartments.length / ITEMS_PER_PAGE));
  
  const currentTableData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredAndSortedDepartments.slice(startIndex, endIndex);
  }, [filteredAndSortedDepartments, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    } else if (currentPage < 1 && totalPages > 0) {
        setCurrentPage(1);
    } else if (filteredAndSortedDepartments.length === 0){
        setCurrentPage(1);
    }
  }, [currentPage, totalPages, filteredAndSortedDepartments.length]);


  if (isLoadingDepartments) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading departments...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-primary flex items-center">
            <DepartmentIcon className="mr-3 h-8 w-8" /> Manage Departments
          </h2>
          <p className="text-muted-foreground">Add, edit, or remove department records from the database.</p>
        </div>
        <Button asChild size="lg" className="shadow-md hover:shadow-lg transition-shadow">
          <Link href="/admin/departments/new">
            <PlusCircle className="mr-2 h-5 w-5" /> Add New Department
          </Link>
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Department List</CardTitle>
          <CardDescription>Browse and manage all departments.</CardDescription>
           <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by ID or name..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10 w-full sm:w-1/2 md:w-1/3"
            />
          </div>
        </CardHeader>
        <CardContent>
          {deleteMutation.isPending && (
            <div className="flex justify-center items-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2">Deleting department...</span>
            </div>
          )}
          {departmentsError && (
             <div className="text-center py-10 text-destructive">
                <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
                <p>Error loading departments: {departmentsError.message}</p>
            </div>
          )}
          {!isLoadingDepartments && !departmentsError && (
            <DepartmentsTable 
              departments={currentTableData} 
              onEdit={handleEditDepartment} 
              onDelete={handleDeleteDepartment}
              sortConfig={sortConfig}
              onSort={handleSort}
            />
          )}
          {filteredAndSortedDepartments.length > ITEMS_PER_PAGE && !isLoadingDepartments && (
            <div className="flex items-center justify-between pt-4 mt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages} ({filteredAndSortedDepartments.length} departments)
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
           {!isLoadingDepartments && filteredAndSortedDepartments.length === 0 && !departmentsError && (
             <p className="text-center text-muted-foreground py-4">No departments match your current search criteria or none exist in the database.</p>
           )}
        </CardContent>
      </Card>
    </div>
  );
}
