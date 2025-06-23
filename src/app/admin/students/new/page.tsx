
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StudentForm, type StudentFormData } from "@/components/admin/students/StudentForm";
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { logUserActivity } from '@/lib/activityLogger';
import { useAuth } from '@/hooks/useAuth';

export default function NewStudentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentUserId } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormSubmit = (data: Omit<StudentFormData, 'classNumber' | 'classAlphabet'> & { classGrade?: string | null }) => {
    setIsSubmitting(true);
    const newStudentId = `ADERA/STU/${new Date().getFullYear()}/${Math.floor(10000 + Math.random() * 90000)}`;
    
    // Simulate API call
    setTimeout(() => {
        logUserActivity(currentUserId, "STUDENT_CREATE_SUCCESS", `Created student ID: ${newStudentId}, Name: ${data.name}`);
        toast({
            title: "Student Added (Demo)",
            description: `${data.name} has been successfully added with ID ${newStudentId}.`,
        });
        router.push('/admin/students');
        setIsSubmitting(false);
    }, 1000);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-primary">Add New Student</h2>
          <p className="text-muted-foreground">Fill in the details to add a new student record. Student ID will be auto-generated.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/students">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Link>
        </Button>
      </div>
      <StudentForm 
        onSubmit={handleFormSubmit} 
        isLoading={isSubmitting}
        submitButtonText="Add Student"
        isEditMode={false}
      />
    </div>
  );
}
