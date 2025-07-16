
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PlusCircle, Users, Loader2, Search, ChevronLeft, ChevronRight, CreditCard, FileText, AlertTriangle } from "lucide-react";
import { StudentsTable } from "@/components/admin/students/StudentsTable";
import { useToast } from "@/hooks/use-toast";
import { logUserActivity } from '@/lib/activityLogger';
import { useAuth } from '@/hooks/useAuth';
import type { StudentWithCreator } from '@/types';

const fetchStudents = async (): Promise<StudentWithCreator[]> => {
  const response = await fetch('/api/students');
  if (!response.ok) throw new Error('Failed to fetch students');
  return response.json();
};

const deleteStudent = async (studentId: string) => {
  const response = await fetch(`/api/students/${studentId}`, { method: 'DELETE' });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to delete student');
  }
};

type SortableStudentKeys = 'studentId' | 'name' | 'classGrade' | 'gender' | 'createdAt' | 'createdBy';
type SortDirection = 'ascending' | 'descending';

interface SortConfig {
  key: SortableStudentKeys | null;
  direction: SortDirection;
}

const ITEMS_PER_PAGE = 5;

export default function StudentsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'createdAt', direction: 'descending' });
  const [currentPage, setCurrentPage] = useState(1);
  
  const { data: students = [], isLoading: isLoadingStudents, error: studentsError } = useQuery<StudentWithCreator[]>({
    queryKey: ['students'],
    queryFn: fetchStudents,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteStudent,
    onSuccess: (_, deletedStudentId) => {
        const deletedStudent = students.find(s => s.id === deletedStudentId);
        toast({ title: "Student Deleted", description: "The student record has been successfully deleted." });
        logUserActivity(currentUser?.userId, "STUDENT_DELETE_SUCCESS", `Deleted student ID: ${deletedStudent?.studentId || 'N/A'}, Name: ${deletedStudent?.name || 'Unknown'}`);
        queryClient.invalidateQueries({ queryKey: ['students'] });
    },
    onError: (error: Error) => {
        toast({ title: "Error Deleting Student", description: error.message, variant: "destructive" });
    }
  });

  const handleEditStudent = (student: StudentWithCreator) => {
    router.push(`/admin/students/${student.id}/edit`);
  };

  const handleDeleteStudent = (studentInternalId: string) => {
    deleteMutation.mutate(studentInternalId);
  };

  const handleSort = (key: SortableStudentKeys) => {
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

  const filteredAndSortedStudents = useMemo(() => {
    let processedStudents = [...students];
    
    // For non-admins, only show students they created
    if (currentUser?.role === 'User') {
        processedStudents = processedStudents.filter(student => student.createdById === currentUser.id);
    }


    if (searchTerm) {
      processedStudents = processedStudents.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.classGrade && student.classGrade.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (student.createdBy && student.createdBy.fullName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (sortConfig.key) {
      processedStudents.sort((a, b) => {
        const aValue = sortConfig.key === 'createdBy' ? a.createdBy?.fullName : a[sortConfig.key!];
        const bValue = sortConfig.key === 'createdBy' ? b.createdBy?.fullName : b[sortConfig.key!];

        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;
        
        let comparison = 0;
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = aValue.localeCompare(bValue);
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue;
        } else { 
          comparison = String(aValue).localeCompare(String(bValue));
        }

        return sortConfig.direction === 'ascending' ? comparison : -comparison;
      });
    }
    return processedStudents;
  }, [students, searchTerm, sortConfig, currentUser]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedStudents.length / ITEMS_PER_PAGE));
  
  const currentTableData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredAndSortedStudents.slice(startIndex, endIndex);
  }, [filteredAndSortedStudents, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) { 
      setCurrentPage(totalPages);
    } else if (currentPage < 1 && totalPages > 0) {
        setCurrentPage(1);
    } else if (filteredAndSortedStudents.length === 0){
        setCurrentPage(1);
    }
  }, [currentPage, totalPages, filteredAndSortedStudents.length]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-primary flex items-center">
            <Users className="mr-3 h-8 w-8" /> Manage Students
          </h2>
          <p className="text-muted-foreground">Add, edit, or remove student records.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
           <Button asChild size="lg" variant="outline" className="shadow-md hover:shadow-lg transition-shadow">
            <Link href="/admin/students/export">
              <FileText className="mr-2 h-5 w-5" /> Export Student List
            </Link>
          </Button>
           <Button asChild size="lg" variant="outline" className="shadow-md hover:shadow-lg transition-shadow">
            <Link href="/admin/students/view-all-ids">
              <CreditCard className="mr-2 h-5 w-5" /> View All ID Cards
            </Link>
          </Button>
          <Button asChild size="lg" className="shadow-md hover:shadow-lg transition-shadow">
            <Link href="/admin/students/new">
              <PlusCircle className="mr-2 h-5 w-5" /> Add New Student
            </Link>
          </Button>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Student List</CardTitle>
          <CardDescription>Browse and manage all registered students.</CardDescription>
           <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by ID, name, grade, or creator..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10 w-full sm:w-1/2 md:w-1/3"
            />
          </div>
        </CardHeader>
        <CardContent>
           {isLoadingStudents ? (
             <div className="flex justify-center items-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2">Loading students...</span>
            </div>
           ) : studentsError ? (
             <div className="text-center py-10 text-destructive">
                <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
                <p>Error loading students: {(studentsError as Error).message}</p>
            </div>
          ) : (
            <StudentsTable 
              students={currentTableData} 
              onEdit={handleEditStudent} 
              onDelete={handleDeleteStudent}
              sortConfig={sortConfig}
              onSort={handleSort}
            />
          )}
          {filteredAndSortedStudents.length > ITEMS_PER_PAGE && !isLoadingStudents && !studentsError && (
            <div className="flex items-center justify-between pt-4 mt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages} ({filteredAndSortedStudents.length} students)
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
           {!isLoadingStudents && filteredAndSortedStudents.length === 0 && !studentsError && (
             <p className="text-center text-muted-foreground py-4">No students match your current search criteria or none exist in the database.</p>
           )}
        </CardContent>
      </Card>
    </div>
  );
}

    