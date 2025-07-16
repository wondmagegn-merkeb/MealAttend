
"use client";

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UserForm, type UserFormData } from "@/components/admin/users/UserForm";
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { logUserActivity } from '@/lib/activityLogger';
import { useAuth } from '@/hooks/useAuth';
import { generateWelcomeEmail } from '@/ai/flows/send-welcome-email-flow';

const createUser = async (data: UserFormData) => {
  const token = localStorage.getItem('mealAttendAuthToken_v1');
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create user');
  }
  return response.json();
};


export default function NewUserPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentUserId: actorUserId, currentUser } = useAuth();
  
  const mutation = useMutation({
    mutationFn: createUser,
    onSuccess: async (newUser) => {
      toast({
          title: "User Added",
          description: `${newUser.fullName} has been successfully added.`,
      });
      logUserActivity(actorUserId, "USER_CREATE_SUCCESS", `Created user ID: ${newUser.userId}, Name: ${newUser.fullName}`);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      
      // We are not sending a real email, but we can generate the content
      try {
        await generateWelcomeEmail({
          userName: newUser.fullName,
          userEmail: newUser.email,
          tempPassword: 'password123', // Demo password
          loginUrl: `${window.location.origin}/auth/login`,
        });
        toast({
          title: "Welcome Email Generated (AI)",
          description: "A welcome email with temporary password has been generated.",
        });
      } catch (aiError) {
        toast({
          title: "AI Email Generation Failed",
          description: "Could not generate the welcome email content.",
          variant: "destructive"
        })
      }

      router.push('/admin/users');
    },
    onError: (error: Error) => {
       toast({
          title: "Error Adding User",
          description: error.message,
          variant: "destructive",
      });
    }
  });


  const handleFormSubmit = async (data: UserFormData) => {
    mutation.mutate(data);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-primary">Add New User</h2>
          <p className="text-muted-foreground">
            {currentUser?.role === 'Super Admin' && 'You can create Admins or Users.'}
            {currentUser?.role === 'Admin' && 'You can create Users with specific permissions.'}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/users">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Link>
        </Button>
      </div>
      <UserForm 
        onSubmit={handleFormSubmit} 
        isLoading={mutation.isPending}
        submitButtonText="Add User and Send Welcome Email"
      />
    </div>
  );
}
