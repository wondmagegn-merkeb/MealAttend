
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DepartmentForm, type DepartmentFormData } from "@/components/admin/departments/DepartmentForm";
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { logUserActivity } from '@/lib/activityLogger';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Department } from '@prisma/client';

async function createDepartmentAPI(data: DepartmentFormData): Promise<Department> {
  const response = await fetch('/api/departments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to create department' }));
    throw new Error(errorData.message || 'Failed to create department');
  }
  return response.json();
}

export default function NewDepartmentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentUserId } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createDepartmentAPI,
    onSuccess: (newDepartment) => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      logUserActivity(currentUserId, "DEPARTMENT_CREATE_SUCCESS", `Created department ID: ${newDepartment.id}, Name: ${newDepartment.name}`);
      toast({
        title: "Department Added",
        description: `${newDepartment.name} has been successfully added.`,
      });
      router.push('/admin/departments');
    },
    onError: (error: Error) => {
      logUserActivity(currentUserId, "DEPARTMENT_CREATE_FAILURE", `Error: ${error.message}`);
      toast({
        title: "Error Adding Department",
        description: error.message || "Failed to save department. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFormSubmit = (data: DepartmentFormData) => {
    mutation.mutate(data);
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
        isLoading={mutation.isPending}
        submitButtonText="Add Department"
      />
    </div>
  );
}
