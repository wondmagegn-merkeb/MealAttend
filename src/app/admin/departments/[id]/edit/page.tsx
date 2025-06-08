
"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DepartmentForm, type DepartmentFormData } from "@/components/admin/departments/DepartmentForm";
import type { Department } from "@/types/department";
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { logUserActivity } from '@/lib/activityLogger';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

async function fetchDepartmentById(id: string): Promise<Department> {
  const response = await fetch(`/api/departments/${id}`);
  if (!response.ok) {
    if (response.status === 404) throw new Error('Department not found');
    throw new Error('Failed to fetch department');
  }
  return response.json();
}

async function updateDepartmentAPI({ id, data }: { id: string, data: DepartmentFormData }): Promise<Department> {
  const response = await fetch(`/api/departments/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to update department' }));
    throw new Error(errorData.message || 'Failed to update department');
  }
  return response.json();
}

export default function EditDepartmentPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { currentUserId } = useAuth();
  const queryClient = useQueryClient();
  
  const departmentId = typeof params.id === 'string' ? params.id : undefined;

  const { data: department, isLoading: isFetchingDepartment, error: fetchError } = useQuery<Department, Error>({
    queryKey: ['department', departmentId],
    queryFn: () => fetchDepartmentById(departmentId!),
    enabled: !!departmentId, // Only run query if departmentId is available
  });

  const mutation = useMutation({
    mutationFn: updateDepartmentAPI,
    onSuccess: (updatedDepartment) => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['department', updatedDepartment.id] });
      logUserActivity(currentUserId, "DEPARTMENT_UPDATE_SUCCESS", `Updated department ID: ${updatedDepartment.id}, Name: ${updatedDepartment.name}`);
      toast({
        title: "Department Updated",
        description: `${updatedDepartment.name}'s record has been updated.`,
      });
      router.push('/admin/departments');
    },
    onError: (error: Error) => {
      logUserActivity(currentUserId, "DEPARTMENT_UPDATE_FAILURE", `Attempted to update department ID: ${departmentId}. Error: ${error.message}`);
      toast({
        title: "Error Updating Department",
        description: error.message || "Failed to update department. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFormSubmit = (data: DepartmentFormData) => {
    if (!departmentId) return;
    mutation.mutate({ id: departmentId, data });
  };

  if (isFetchingDepartment) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading department data...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto text-center">
         <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl text-destructive flex items-center justify-center">
                    <AlertTriangle className="mr-2 h-7 w-7" /> Error
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-4">
                  {fetchError.message === 'Department not found' 
                    ? 'The department record you are trying to edit could not be found.'
                    : `Failed to load department data: ${fetchError.message}`
                  }
                </p>
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
          isLoading={mutation.isPending}
          submitButtonText="Save Changes"
        />
      )}
    </div>
  );
}
