
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
import { generateNextId } from '@/lib/idGenerator';

export default function NewDepartmentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentUserId } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormSubmit = async (data: DepartmentFormData) => {
    setIsSubmitting(true);
    
    try {
      const newDepartmentId = await generateNextId('DEPARTMENT');
      
      // Simulate API call
      setTimeout(() => {
          logUserActivity(currentUserId, "DEPARTMENT_CREATE_SUCCESS", `Created department ID: ${newDepartmentId}, Name: ${data.name}`);
          toast({
              title: "Department Added (Demo)",
              description: `${data.name} has been successfully added with ID ${newDepartmentId}.`,
          });
          router.push('/admin/departments');
          setIsSubmitting(false);
      }, 1000);

    } catch (error) {
      toast({
        title: "Error Generating ID",
        description: "Could not generate a new department ID. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
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
        isLoading={isSubmitting}
        submitButtonText="Add Department"
      />
    </div>
  );
}
