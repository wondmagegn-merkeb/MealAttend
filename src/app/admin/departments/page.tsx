
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PlusCircle, Building2 as DepartmentIcon, Loader2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { DepartmentsTable } from "@/components/admin/departments/DepartmentsTable";
import type { Department } from "@/types/department";
import { useToast } from "@/hooks/use-toast";
import { DEPARTMENTS_STORAGE_KEY } from '@/lib/constants';

// Initial seed data if localStorage is empty
const initialSeedDepartments: Department[] = [
  { id: 'dept_smp_001', name: 'Kitchen Staff', description: 'Responsible for meal preparation and kitchen operations.', headOfDepartment: 'Chef Ramsey', createdAt: new Date('2023-01-01T10:00:00Z').toISOString(), updatedAt: new Date('2023-01-01T10:00:00Z').toISOString() },
  { id: 'dept_smp_002', name: 'Serving Team', description: 'Manages meal distribution and dining hall services.', headOfDepartment: 'Alice Serverson', createdAt: new Date('2023-01-05T11:30:00Z').toISOString(), updatedAt: new Date('2023-01-05T11:30:00Z').toISOString() },
  { id: 'dept_smp_003', name: 'Logistics & Supply', description: 'Handles inventory, procurement, and supplies.', headOfDepartment: 'Bob Stockman', createdAt: new Date('2023-02-10T09:15:00Z').toISOString(), updatedAt: new Date('2023-02-10T09:15:00Z').toISOString() },
];

type SortableDepartmentKeys = 'name' | 'description' | 'headOfDepartment' | 'createdAt';
type SortDirection = 'ascending' | 'descending';

interface SortConfig {
  key: SortableDepartmentKeys | null;
  direction: SortDirection;
}

const ITEMS_PER_PAGE = 5;

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoadingTable, setIsLoadingTable] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'createdAt', direction: 'descending' });
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setIsMounted(true);
    try {
      const storedDepartmentsRaw = localStorage.getItem(DEPARTMENTS_STORAGE_KEY);
      if (storedDepartmentsRaw) {
        setDepartments(JSON.parse(storedDepartmentsRaw));
      } else {
        setDepartments(initialSeedDepartments);
        localStorage.setItem(DEPARTMENTS_STORAGE_KEY, JSON.stringify(initialSeedDepartments));
      }
    } catch (error) {
      console.error("Failed to load departments from localStorage", error);
      setDepartments(initialSeedDepartments); 
      toast({
        title: "Error",
        description: "Could not load department data. Displaying default list.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const handleEditDepartment = (department: Department) => {
    router.push(`/admin/departments/${department.id}/edit`);
  };

  const handleDeleteDepartment = (departmentIdToDelete: string) => {
    setIsLoadingTable(true);
    setTimeout(() => {
      try {
        const updatedDepartments = departments.filter(d => d.id !== departmentIdToDelete);
        setDepartments(updatedDepartments);
        localStorage.setItem(DEPARTMENTS_STORAGE_KEY, JSON.stringify(updatedDepartments));
        toast({
          title: "Department Deleted",
          description: "The department record has been successfully deleted.",
        });
        
        const totalPagesAfterDelete = Math.ceil(updatedDepartments.filter(dept =>
          dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (dept.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (dept.headOfDepartment || '').toLowerCase().includes(searchTerm.toLowerCase())
        ).length / ITEMS_PER_PAGE);

        if (currentPage > totalPagesAfterDelete && totalPagesAfterDelete > 0) {
          setCurrentPage(totalPagesAfterDelete);
        } else if (totalPagesAfterDelete === 0) {
          setCurrentPage(1);
        }

      } catch (error) {
        console.error("Failed to delete department from localStorage", error);
        toast({
          title: "Error",
          description: "Failed to delete department. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingTable(false);
      }
    }, 500);
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
      processedDepartments = processedDepartments.filter(dept =>
        dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (dept.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (dept.headOfDepartment || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (sortConfig.key) {
      processedDepartments.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];

        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;
        
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
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);


  if (!isMounted) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading department management...</p>
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
          <p className="text-muted-foreground">Add, edit, or remove department records.</p>
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
          <CardDescription>Browse and manage all departments. Data is stored in your browser's local storage.</CardDescription>
           <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name, description, or head..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10 w-full sm:w-1/2 md:w-1/3"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingTable && (
            <div className="flex justify-center items-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2">Updating table...</span>
            </div>
          )}
          <DepartmentsTable 
            departments={currentTableData} 
            onEdit={handleEditDepartment} 
            onDelete={handleDeleteDepartment}
            sortConfig={sortConfig}
            onSort={handleSort}
          />
          {filteredAndSortedDepartments.length > ITEMS_PER_PAGE && (
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
           {filteredAndSortedDepartments.length === 0 && !isLoadingTable && (
             <p className="text-center text-muted-foreground py-4">No departments match your current search criteria.</p>
           )}
        </CardContent>
      </Card>
    </div>
  );
}
