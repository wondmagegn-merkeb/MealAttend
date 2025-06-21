
"use client";

import { useRouter } from 'next/navigation';
import { UserForm, type UserFormData } from "@/components/admin/users/UserForm";
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { logUserActivity } from '@/lib/activityLogger';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { User } from '@prisma/client';

type ApiUserCreateData = {
  fullName: string;
  email: string;
  role: 'Admin' | 'User';
  departmentId: string | null;
  profileImageURL?: string | null;
  password?: string;
  passwordChangeRequired?: boolean;
};

async function createUserAPI(data: ApiUserCreateData): Promise<User> {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to create user' }));
    throw new Error(errorData.message || 'Failed to create user');
  }
  return response.json();
}

export default function NewUserPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentUserId: actorUserId } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createUserAPI,
    onSuccess: (newUser) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      logUserActivity(actorUserId, "USER_CREATE_SUCCESS", `Created user ID: ${newUser.userId}, Name: ${newUser.fullName}`);
      toast({
        title: "User Added",
        description: `${newUser.fullName} has been successfully added with ID ${newUser.userId}.`,
      });
      router.push('/admin/users');
    },
    onError: (error: Error) => {
      logUserActivity(actorUserId, "USER_CREATE_FAILURE", `Error: ${error.message}`);
      toast({
        title: "Error Adding User",
        description: error.message || "Failed to save user. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFormSubmit = (data: UserFormData) => {
    const apiData: ApiUserCreateData = {
      fullName: data.fullName,
      email: data.email,
      role: data.role,
      departmentId: data.departmentId || null,
      profileImageURL: data.profileImageURL || null,
      password: "password123", // Set default password for new users
      passwordChangeRequired: true,
    };
    mutation.mutate(apiData);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-primary">Add New User</h2>
          <p className="text-muted-foreground">Fill in the details to add a new user record. User ID will be auto-generated.</p>
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
        submitButtonText="Add User"
      />
    </div>
  );
}
