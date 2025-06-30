
"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DepartmentForm, type DepartmentFormData } from "@/components/admin/departments/DepartmentForm";
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { logUserActivity } from '@/lib/activityLogger';
import { useAuth } from '@/hooks/useAuth';
import type { Department } from '@/types';

const fetchDepartment = async (id: string): Promise<Department> => {
  const response = await fetch(`/api/departments/${id}`);
  if (!response.ok) {
    if (response.status === 404) throw new Error('Department not found');
    throw new Error('Failed to fetch department');
  }
  return response.json();
};

const updateDepartment = async ({ id, data }: { id: string, data: DepartmentFormData }): Promise<Department> => {
  const response = await fetch(`/api/departments/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to update department');
  }
  return response.json();
};

export default function EditDepartmentPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentUserId } = useAuth();
  
  const departmentId = typeof params.id === 'string' ? params.id : undefined;

  const { data: department, isLoading, error } = useQuery<Department>({
    queryKey: ['department', departmentId],
    queryFn: () => fetchDepartment(departmentId!),
    enabled: !!departmentId,
  });

  const mutation = useMutation({
    mutationFn: updateDepartment,
    onSuccess: (updatedData) => {
      toast({
        title: "Department Updated",
        description: `${updatedData.name}'s record has been updated.`,
      });
      logUserActivity(currentUserId, "DEPARTMENT_UPDATE_SUCCESS", `Updated department ID: ${updatedData.departmentId}, Name: ${updatedData.name}`);
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['department', departmentId] });
      router.push('/admin/departments');
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleFormSubmit = (data: DepartmentFormData) => {
    if (!departmentId) return;
    mutation.mutate({ id: departmentId, data });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading department data...</p>
      </div>
    );
  }

  if (error) {
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
                  {(error as Error).message === 'Department not found' 
                    ? 'The department record you are trying to edit could not be found.'
                    : `Failed to load department data: ${(error as Error).message}`
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
