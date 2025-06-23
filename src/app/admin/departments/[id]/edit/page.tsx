
"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DepartmentForm, type DepartmentFormData } from "@/components/admin/departments/DepartmentForm";
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { logUserActivity } from '@/lib/activityLogger';
import { useAuth } from '@/hooks/useAuth';
import { mockDepartments } from '@/lib/demo-data';
import type { Department } from '@/types';

export default function EditDepartmentPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { currentUserId } = useAuth();
  
  const departmentId = typeof params.id === 'string' ? params.id : undefined;

  const [department, setDepartment] = useState<Department | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setIsLoading(true);
    if (departmentId) {
      setTimeout(() => {
        const foundDept = mockDepartments.find(d => d.id === departmentId);
        if (foundDept) {
          setDepartment(foundDept);
        } else {
          setError(new Error('Department not found'));
        }
        setIsLoading(false);
      }, 500);
    } else {
      setError(new Error('No department ID provided'));
      setIsLoading(false);
    }
  }, [departmentId]);

  const handleFormSubmit = (data: DepartmentFormData) => {
    if (!departmentId) return;
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      logUserActivity(currentUserId, "DEPARTMENT_UPDATE_SUCCESS", `Updated department ID: ${departmentId}, Name: ${data.name}`);
      toast({
        title: "Department Updated (Demo)",
        description: `${data.name}'s record has been updated.`,
      });
      router.push('/admin/departments');
      setIsSubmitting(false);
    }, 1000);
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
                  {error.message === 'Department not found' 
                    ? 'The department record you are trying to edit could not be found.'
                    : `Failed to load department data: ${error.message}`
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
          isLoading={isSubmitting}
          submitButtonText="Save Changes"
        />
      )}
    </div>
  );
}
