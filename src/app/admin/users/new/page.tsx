
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

type CreateUserPayload = UserFormData & { 
  createdById: string; 
};

const createUser = async (data: CreateUserPayload) => {
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
          title: "User Added & Welcome Email Sent",
          description: `${newUser.fullName} has been added and a welcome email was sent to them.`,
      });
      logUserActivity(actorUserId, "USER_CREATE_SUCCESS", `Created user ID: ${newUser.userId}, Name: ${newUser.fullName}`);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      
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
     if (!currentUser?.id) {
        toast({ title: "Authentication Error", description: "Could not identify the current user.", variant: "destructive" });
        return;
    }

    const payload: CreateUserPayload = {
      ...data,
      createdById: currentUser.id, // Add the creator's internal ID
    };
    mutation.mutate(payload);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
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
