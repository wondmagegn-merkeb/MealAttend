
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Users } from "lucide-react";
import { StudentsTable } from "@/components/admin/students/StudentsTable";
import { StudentFormDialog } from "@/components/admin/students/StudentFormDialog";
import type { Student } from "@/types/student";
import type { StudentFormData } from "@/components/admin/students/StudentForm";
import { useToast } from "@/hooks/use-toast";

const initialStudents: Student[] = [
  { id: 'clxkxk001', studentId: 'S1001', name: 'Alice Johnson', email: 'alice.johnson@example.com', createdAt: new Date('2023-01-15').toISOString(), updatedAt: new Date('2023-01-15').toISOString() },
  { id: 'clxkxk002', studentId: 'S1002', name: 'Bob Williams', email: 'bob.williams@example.com', createdAt: new Date('2023-02-20').toISOString(), updatedAt: new Date('2023-02-20').toISOString() },
  { id: 'clxkxk003', studentId: 'S1003', name: 'Carol Davis', email: 'carol.davis@example.com', createdAt: new Date('2023-03-10').toISOString(), updatedAt: new Date('2023-03-10').toISOString() },
];

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Simulate fetching data
    setStudents(initialStudents);
    setIsMounted(true);
  }, []);


  const handleAddStudent = () => {
    setEditingStudent(null);
    setIsFormOpen(true);
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setIsFormOpen(true);
  };

  const handleDeleteStudent = (studentId: string) => {
    // Simulate API call
    setIsLoading(true);
    setTimeout(() => {
      setStudents(prev => prev.filter(s => s.id !== studentId));
      toast({
        title: "Student Deleted",
        description: "The student record has been successfully deleted.",
        variant: "default",
      });
      setIsLoading(false);
    }, 500);
  };

  const handleFormSubmit = (data: StudentFormData) => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      if (editingStudent) {
        // Update student
        setStudents(prev => prev.map(s => s.id === editingStudent.id ? { ...s, ...data, updatedAt: new Date().toISOString() } : s));
        toast({
          title: "Student Updated",
          description: `${data.name}'s record has been updated.`,
        });
      } else {
        // Add new student
        const newStudent: Student = {
          id: `stud_${Date.now()}`, // Simple unique ID generation for mock
          ...data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setStudents(prev => [newStudent, ...prev]);
        toast({
          title: "Student Added",
          description: `${data.name} has been successfully added.`,
        });
      }
      setIsLoading(false);
      setIsFormOpen(false);
      setEditingStudent(null);
    }, 1000);
  };
  
  if (!isMounted) {
    // You can return a loader here if needed
    return <div className="flex justify-center items-center h-screen">Loading students...</div>;
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
        <Button onClick={handleAddStudent} size="lg" className="shadow-md hover:shadow-lg transition-shadow">
          <PlusCircle className="mr-2 h-5 w-5" /> Add New Student
        </Button>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Student List</CardTitle>
          <CardDescription>Browse and manage all registered students.</CardDescription>
        </CardHeader>
        <CardContent>
          <StudentsTable 
            students={students} 
            onEdit={handleEditStudent} 
            onDelete={handleDeleteStudent} 
          />
        </CardContent>
      </Card>

      <StudentFormDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        studentToEdit={editingStudent}
        isLoading={isLoading}
      />
    </div>
  );
}
