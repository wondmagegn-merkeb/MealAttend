
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PlusCircle, Users, Loader2, Search, ChevronLeft, ChevronRight, CreditCard, FileText } from "lucide-react";
import { StudentsTable } from "@/components/admin/students/StudentsTable";
import type { Student } from "@/types/student";
import { useToast } from "@/hooks/use-toast";
import { STUDENTS_STORAGE_KEY } from '@/lib/constants';

// Initial seed data if localStorage is empty - Class format updated
const initialSeedStudents: Student[] = [
  { id: 'clxkxk001', studentId: 'ADERA/STU/2024/00001', name: 'Alice Johnson', gender: 'Female', class: '10A', profileImageURL: 'https://placehold.co/100x100.png?text=AJ', qrCodeData: 'clxkxk001', createdAt: new Date('2023-01-15T10:00:00Z').toISOString(), updatedAt: new Date('2023-01-15T10:00:00Z').toISOString() },
  { id: 'clxkxk002', studentId: 'ADERA/STU/2024/00002', name: 'Bob Williams', gender: 'Male', class: '9B', profileImageURL: 'https://placehold.co/100x100.png?text=BW', qrCodeData: 'clxkxk002', createdAt: new Date('2023-02-20T11:00:00Z').toISOString(), updatedAt: new Date('2023-02-20T11:00:00Z').toISOString() },
  { id: 'clxkxk003', studentId: 'ADERA/STU/2023/00003', name: 'Carol Davis', gender: 'Female', class: '11A', profileImageURL: 'https://placehold.co/100x100.png?text=CD', qrCodeData: 'clxkxk003', createdAt: new Date('2023-03-10T09:00:00Z').toISOString(), updatedAt: new Date('2023-03-10T09:00:00Z').toISOString() },
  { id: 'clxkxk004', studentId: 'ADERA/STU/2023/00004', name: 'David Brown', gender: 'Male', class: '10B', profileImageURL: 'https://placehold.co/100x100.png?text=DB', qrCodeData: 'clxkxk004', createdAt: new Date('2022-12-01T14:00:00Z').toISOString(), updatedAt: new Date('2022-12-01T14:00:00Z').toISOString() },
  { id: 'clxkxk005', studentId: 'ADERA/STU/2023/00005', name: 'Eva Green', gender: 'Female', class: '9A', profileImageURL: 'https://placehold.co/100x100.png?text=EG', qrCodeData: 'clxkxk005', createdAt: new Date('2023-04-05T16:00:00Z').toISOString(), updatedAt: new Date('2023-04-05T16:00:00Z').toISOString() },
  { id: 'clxkxk006', studentId: 'ADERA/STU/2024/00006', name: 'Frank Harris', gender: 'Male', class: '12A', profileImageURL: 'https://placehold.co/100x100.png?text=FH', qrCodeData: 'clxkxk006', createdAt: new Date('2023-05-01T08:00:00Z').toISOString(), updatedAt: new Date('2023-05-01T08:00:00Z').toISOString() },
  { id: 'clxkxk007', studentId: 'ADERA/STU/2024/00007', name: 'Grace Lee', gender: 'Female', class: '11B', profileImageURL: 'https://placehold.co/100x100.png?text=GL', qrCodeData: 'clxkxk007', createdAt: new Date('2023-06-12T13:00:00Z').toISOString(), updatedAt: new Date('2023-06-12T13:00:00Z').toISOString() },
  { id: 'clxkxk008', studentId: 'ADERA/STU/2023/00008', name: 'Henry Wilson', gender: 'Male', class: '10A', profileImageURL: 'https://placehold.co/100x100.png?text=HW', qrCodeData: 'clxkxk008', createdAt: new Date('2022-11-25T15:30:00Z').toISOString(), updatedAt: new Date('2022-11-25T15:30:00Z').toISOString() },
  { id: 'clxkxk009', studentId: 'ADERA/STU/2023/00009', name: 'Ivy Clark', gender: 'Female', class: '9C', profileImageURL: 'https://placehold.co/100x100.png?text=IC', qrCodeData: 'clxkxk009', createdAt: new Date('2023-07-02T10:30:00Z').toISOString(), updatedAt: new Date('2023-07-02T10:30:00Z').toISOString() },
  { id: 'clxkxk010', studentId: 'ADERA/STU/2024/00010', name: 'Jack Martinez', gender: 'Male', class: '12B', profileImageURL: 'https://placehold.co/100x100.png?text=JM', qrCodeData: 'clxkxk010', createdAt: new Date('2023-08-19T11:45:00Z').toISOString(), updatedAt: new Date('2023-08-19T11:45:00Z').toISOString() },
  { id: 'clxkxk011', studentId: 'ADERA/STU/2024/00011', name: 'Kate Adams', gender: 'Female', class: '10A', profileImageURL: 'https://placehold.co/100x100.png?text=KA', qrCodeData: 'clxkxk011', createdAt: new Date('2023-09-01T09:00:00Z').toISOString(), updatedAt: new Date('2023-09-01T09:00:00Z').toISOString() },
  { id: 'clxkxk012', studentId: 'ADERA/STU/2022/00012', name: 'Leo Garcia', gender: 'Male', class: '8A', profileImageURL: 'https://placehold.co/100x100.png?text=LG', qrCodeData: 'clxkxk012', createdAt: new Date('2022-08-15T14:30:00Z').toISOString(), updatedAt: new Date('2022-08-15T14:30:00Z').toISOString() },
];

type SortableStudentKeys = 'studentId' | 'name' | 'class' | 'gender' | 'createdAt';
type SortDirection = 'ascending' | 'descending';

interface SortConfig {
  key: SortableStudentKeys | null;
  direction: SortDirection;
}

const ITEMS_PER_PAGE = 5;

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
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
      const storedStudentsRaw = localStorage.getItem(STUDENTS_STORAGE_KEY);
      if (storedStudentsRaw) {
        let loadedStudents: Student[] = JSON.parse(storedStudentsRaw);
        let updated = false;
        loadedStudents = loadedStudents.map(s => {
          if (!s.qrCodeData) {
            updated = true;
            return { ...s, qrCodeData: s.id };
          }
          return s;
        });
        setStudents(loadedStudents);
        if (updated) {
          localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(loadedStudents));
        }
      } else {
        setStudents(initialSeedStudents);
        localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(initialSeedStudents));
      }
    } catch (error) {
      console.error("Failed to load students from localStorage", error);
      setStudents(initialSeedStudents); 
      toast({
        title: "Error",
        description: "Could not load student data. Displaying default list.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const handleEditStudent = (student: Student) => {
    router.push(`/admin/students/${student.id}/edit`);
  };

  const handleDeleteStudent = (studentIdToDelete: string) => {
    setIsLoadingTable(true);
    setTimeout(() => {
      try {
        const updatedStudents = students.filter(s => s.id !== studentIdToDelete);
        setStudents(updatedStudents);
        localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(updatedStudents));
        toast({
          title: "Student Deleted",
          description: "The student record has been successfully deleted.",
        });
        // If on last page and it becomes empty, go to previous page
        const totalPagesAfterDelete = Math.ceil(updatedStudents.filter(student =>
          student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.class.toLowerCase().includes(searchTerm.toLowerCase())
        ).length / ITEMS_PER_PAGE);
        if (currentPage > totalPagesAfterDelete && totalPagesAfterDelete > 0) {
          setCurrentPage(totalPagesAfterDelete);
        } else if (totalPagesAfterDelete === 0) {
          setCurrentPage(1);
        }

      } catch (error) {
        console.error("Failed to delete student from localStorage", error);
        toast({
          title: "Error",
          description: "Failed to delete student. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingTable(false);
      }
    }, 500);
  };

  const handleSort = (key: SortableStudentKeys) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1); // Reset to first page on sort
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  const filteredAndSortedStudents = useMemo(() => {
    let processedStudents = [...students];

    if (searchTerm) {
      processedStudents = processedStudents.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.class.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (sortConfig.key) {
      processedStudents.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];

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
  }, [students, searchTerm, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedStudents.length / ITEMS_PER_PAGE));
  
  const currentTableData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredAndSortedStudents.slice(startIndex, endIndex);
  }, [filteredAndSortedStudents, currentPage]);

  useEffect(() => {
    // Adjust current page if it's out of bounds after filtering/sorting
    if (currentPage > totalPages && totalPages > 0) { // Added totalPages > 0 condition
      setCurrentPage(totalPages);
    } else if (currentPage === 0 && totalPages > 0) { // Handle case where currentPage might become 0
        setCurrentPage(1);
    }
  }, [currentPage, totalPages]);


  if (!isMounted) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading student management...</p>
      </div>
    );
  }

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
          <CardDescription>Browse and manage all registered students. Data is stored in your browser's local storage.</CardDescription>
           <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by ID, name, or grade..."
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
          <StudentsTable 
            students={currentTableData} 
            onEdit={handleEditStudent} 
            onDelete={handleDeleteStudent}
            sortConfig={sortConfig}
            onSort={handleSort}
          />
          {filteredAndSortedStudents.length > ITEMS_PER_PAGE && (
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
           {filteredAndSortedStudents.length === 0 && !isLoadingTable && (
             <p className="text-center text-muted-foreground py-4">No students match your current search criteria.</p>
           )}
        </CardContent>
      </Card>
    </div>
  );
}
    
