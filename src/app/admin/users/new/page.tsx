
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserForm, type UserFormData } from "@/components/admin/users/UserForm";
import type { User } from "@/types/user";
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { USERS_STORAGE_KEY } from '@/lib/constants';

export default function NewUserPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleFormSubmit = (data: UserFormData) => {
    setIsLoading(true);
    
    setTimeout(() => {
      const newUserId = `user_${Date.now()}`;
      const newUser: User = {
        id: newUserId, 
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        const storedUsersRaw = localStorage.getItem(USERS_STORAGE_KEY);
        const users: User[] = storedUsersRaw ? JSON.parse(storedUsersRaw) : [];
        users.unshift(newUser);
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
        
        toast({
          title: "User Added",
          description: `${data.fullName} has been successfully added.`,
        });
        router.push('/admin/users');
      } catch (error) {
        console.error("Failed to save user to localStorage", error);
        toast({
          title: "Error",
          description: "Failed to save user. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-primary">Add New User</h2>
          <p className="text-muted-foreground">Fill in the details to add a new user record.</p>
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
        isLoading={isLoading}
        submitButtonText="Add User"
      />
    </div>
  );
}
