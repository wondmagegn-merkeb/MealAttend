
"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DepartmentForm, type DepartmentFormData } from "@/components/admin/departments/DepartmentForm";
import type { Department } from "@/types/department";
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { DEPARTMENTS_STORAGE_KEY } from '@/lib/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function EditDepartmentPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  
  const departmentId = typeof params.id === 'string' ? params.id : undefined;

  const [department, setDepartment] = useState<Department | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (departmentId) {
      setIsFetching(true);
      try {
        const storedDepartmentsRaw = localStorage.getItem(DEPARTMENTS_STORAGE_KEY);
        if (storedDepartmentsRaw) {
          const departments: Department[] = JSON.parse(storedDepartmentsRaw);
          const foundDepartment = departments.find(d => d.id === departmentId);
          if (foundDepartment) {
            setDepartment(foundDepartment);
          } else {
            setNotFound(true);
          }
        } else {
          setNotFound(true); 
        }
      } catch (error) {
        console.error("Failed to load department from localStorage", error);
        setNotFound(true);
         toast({
          title: "Error",
          description: "Failed to load department data.",
          variant: "destructive",
        });
      } finally {
        setIsFetching(false);
      }
    } else {
      setNotFound(true); 
      setIsFetching(false);
    }
  }, [departmentId, toast]);

  const handleFormSubmit = (data: DepartmentFormData) => {
    if (!department) return;
    setIsLoading(true);

    setTimeout(() => {
      const updatedDepartment: Department = {
        id: department.id,
        name: data.name,
      };
      
      try {
        const storedDepartmentsRaw = localStorage.getItem(DEPARTMENTS_STORAGE_KEY);
        let departments: Department[] = storedDepartmentsRaw ? JSON.parse(storedDepartmentsRaw) : [];
        departments = departments.map(d => d.id === department.id ? updatedDepartment : d);
        localStorage.setItem(DEPARTMENTS_STORAGE_KEY, JSON.stringify(departments));

        toast({
          title: "Department Updated",
          description: `${data.name}'s record has been updated.`,
        });
        router.push('/admin/departments');
      } catch (error) {
        console.error("Failed to update department in localStorage", error);
        toast({
          title: "Error",
          description: "Failed to update department. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }, 1000);
  };

  if (isFetching) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading department data...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto text-center">
         <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl text-destructive">Department Not Found</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-4">The department record you are trying to edit could not be found.</p>
                <Button variant="outline" asChild>
                <Link href="/admin/departments">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Department List
                </Link>
                </Button>
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-primary">Edit Department</h2>
          <p className="text-muted-foreground">Update the name for {department?.name}.</p>
        </div>
         <Button variant="outline" asChild>
          <Link href="/admin/departments">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Link>
        </Button>
      </div>
      {department && (
        <DepartmentForm 
          onSubmit={handleFormSubmit} 
          initialData={department}
          isLoading={isLoading}
          submitButtonText="Save Changes"
        />
      )}
    </div>
  );
}
