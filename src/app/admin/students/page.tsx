
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Users, Loader2 } from "lucide-react";
import { StudentsTable } from "@/components/admin/students/StudentsTable";
import type { Student } from "@/types/student";
import { useToast } from "@/hooks/use-toast";
import { STUDENTS_STORAGE_KEY } from '@/lib/constants';

// Initial seed data if localStorage is empty
const initialSeedStudents: Student[] = [
  { id: 'clxkxk001', studentId: 'S1001', name: 'Alice Johnson', gender: 'Female', class: 'Grade 10', profileImageURL: 'https://placehold.co/100x100.png?text=AJ', createdAt: new Date('2023-01-15').toISOString(), updatedAt: new Date('2023-01-15').toISOString() },
  { id: 'clxkxk002', studentId: 'S1002', name: 'Bob Williams', gender: 'Male', class: 'Grade 9', profileImageURL: 'https://placehold.co/100x100.png?text=BW', createdAt: new Date('2023-02-20').toISOString(), updatedAt: new Date('2023-02-20').toISOString() },
  { id: 'clxkxk003', studentId: 'S1003', name: 'Carol Davis', gender: 'Female', class: 'Grade 11', profileImageURL: 'https://placehold.co/100x100.png?text=CD', createdAt: new Date('2023-03-10').toISOString(), updatedAt: new Date('2023-03-10').toISOString() },
];

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoadingTable, setIsLoadingTable] = useState(false); // For delete operation visual feedback
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
    try {
      const storedStudentsRaw = localStorage.getItem(STUDENTS_STORAGE_KEY);
      if (storedStudentsRaw) {
        setStudents(JSON.parse(storedStudentsRaw));
      } else {
        // If no students in localStorage, use initial seed and save it
        setStudents(initialSeedStudents);
        localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(initialSeedStudents));
      }
    } catch (error) {
      console.error("Failed to load students from localStorage", error);
      setStudents(initialSeedStudents); // Fallback
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
    // Simulate API call
    setTimeout(() => {
      try {
        const updatedStudents = students.filter(s => s.id !== studentIdToDelete);
        setStudents(updatedStudents);
        localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(updatedStudents));
        toast({
          title: "Student Deleted",
          description: "The student record has been successfully deleted.",
          variant: "default",
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
  
  if (!isMounted) {
    // Prevent hydration mismatch and show a loader
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
        </CardHeader>
        <CardContent>
          {isLoadingTable && (
            <div className="flex justify-center items-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2">Updating table...</span>
            </div>
          )}
          <StudentsTable 
            students={students} 
            onEdit={handleEditStudent} 
            onDelete={handleDeleteStudent} 
          />
        </CardContent>
      </Card>
    </div>
  );
}
