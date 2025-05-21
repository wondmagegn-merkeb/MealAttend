
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DepartmentForm, type DepartmentFormData } from "@/components/admin/departments/DepartmentForm";
import type { Department } from "@/types/department";
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { DEPARTMENTS_STORAGE_KEY } from '@/lib/constants';
import { logUserActivity } from '@/lib/activityLogger';
import { useAuth } from '@/hooks/useAuth';

export default function NewDepartmentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentUserId } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleFormSubmit = (data: DepartmentFormData) => {
    setIsLoading(true);
    
    setTimeout(() => {
      const newDepartmentId = `dept_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newDepartment: Department = {
        id: newDepartmentId, 
        name: data.name,
      };

      try {
        const storedDepartmentsRaw = localStorage.getItem(DEPARTMENTS_STORAGE_KEY);
        const departments: Department[] = storedDepartmentsRaw ? JSON.parse(storedDepartmentsRaw) : [];
        departments.unshift(newDepartment);
        localStorage.setItem(DEPARTMENTS_STORAGE_KEY, JSON.stringify(departments));
        
        logUserActivity(currentUserId, "DEPARTMENT_CREATE_SUCCESS", `Created department ID: ${newDepartment.id}, Name: ${newDepartment.name}`);
        toast({
          title: "Department Added",
          description: `${data.name} has been successfully added.`,
        });
        router.push('/admin/departments');
      } catch (error) {
        console.error("Failed to save department to localStorage", error);
        logUserActivity(currentUserId, "DEPARTMENT_CREATE_FAILURE", `Attempted to create department: ${data.name}. Error: ${error instanceof Error ? error.message : String(error)}`);
        toast({
          title: "Error",
          description: "Failed to save department. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-primary">Add New Department</h2>
          <p className="text-muted-foreground">Enter the name for the new department.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/departments">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Link>
        </Button>
      </div>
      <DepartmentForm 
        onSubmit={handleFormSubmit} 
        isLoading={isLoading}
        submitButtonText="Add Department"
      />
    </div>
  );
}
