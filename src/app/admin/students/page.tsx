
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PlusCircle, Users, Loader2, Search } from "lucide-react";
import { StudentsTable } from "@/components/admin/students/StudentsTable";
import type { Student } from "@/types/student";
import { useToast } from "@/hooks/use-toast";
import { STUDENTS_STORAGE_KEY } from '@/lib/constants';

// Initial seed data if localStorage is empty
const initialSeedStudents: Student[] = [
  { id: 'clxkxk001', studentId: 'S1001', name: 'Alice Johnson', gender: 'Female', class: 'Grade 10', profileImageURL: 'https://placehold.co/100x100.png?text=AJ', qrCodeData: 'clxkxk001', createdAt: new Date('2023-01-15T10:00:00Z').toISOString(), updatedAt: new Date('2023-01-15T10:00:00Z').toISOString() },
  { id: 'clxkxk002', studentId: 'S1002', name: 'Bob Williams', gender: 'Male', class: 'Grade 9', profileImageURL: 'https://placehold.co/100x100.png?text=BW', qrCodeData: 'clxkxk002', createdAt: new Date('2023-02-20T11:00:00Z').toISOString(), updatedAt: new Date('2023-02-20T11:00:00Z').toISOString() },
  { id: 'clxkxk003', studentId: 'S1003', name: 'Carol Davis', gender: 'Female', class: 'Grade 11', profileImageURL: 'https://placehold.co/100x100.png?text=CD', qrCodeData: 'clxkxk003', createdAt: new Date('2023-03-10T09:00:00Z').toISOString(), updatedAt: new Date('2023-03-10T09:00:00Z').toISOString() },
  { id: 'clxkxk004', studentId: 'S1004', name: 'David Brown', gender: 'Male', class: 'Grade 10', profileImageURL: 'https://placehold.co/100x100.png?text=DB', qrCodeData: 'clxkxk004', createdAt: new Date('2022-12-01T14:00:00Z').toISOString(), updatedAt: new Date('2022-12-01T14:00:00Z').toISOString() },
  { id: 'clxkxk005', studentId: 'S1005', name: 'Eva Green', gender: 'Female', class: 'Grade 9', profileImageURL: 'https://placehold.co/100x100.png?text=EG', qrCodeData: 'clxkxk005', createdAt: new Date('2023-04-05T16:00:00Z').toISOString(), updatedAt: new Date('2023-04-05T16:00:00Z').toISOString() },
];

type SortableStudentKeys = 'studentId' | 'name' | 'class' | 'gender' | 'createdAt';
type SortDirection = 'ascending' | 'descending';

interface SortConfig {
  key: SortableStudentKeys | null;
  direction: SortDirection;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoadingTable, setIsLoadingTable] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'createdAt', direction: 'descending' });

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
  };

  const filteredAndSortedStudents = useMemo(() => {
    let SorterStudents = [...students];

    if (searchTerm) {
      SorterStudents = SorterStudents.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.class.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (sortConfig.key) {
      SorterStudents.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];

        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;
        
        let comparison = 0;
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = aValue.localeCompare(bValue);
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue;
        } else { // Fallback for mixed types or other types, treat as string
          comparison = String(aValue).localeCompare(String(bValue));
        }

        return sortConfig.direction === 'ascending' ? comparison : -comparison;
      });
    }
    return SorterStudents;
  }, [students, searchTerm, sortConfig]);
  
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
        <Button asChild size="lg" className="shadow-md hover:shadow-lg transition-shadow">
          <Link href="/admin/students/new">
            <PlusCircle className="mr-2 h-5 w-5" /> Add New Student
          </Link>
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Student List</CardTitle>
          <CardDescription>Browse and manage all registered students. Data is stored in your browser's local storage.</CardDescription>
           <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by ID, name, or class..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
            students={filteredAndSortedStudents} 
            onEdit={handleEditStudent} 
            onDelete={handleDeleteStudent}
            sortConfig={sortConfig}
            onSort={handleSort}
          />
        </CardContent>
      </Card>
    </div>
  );
}
