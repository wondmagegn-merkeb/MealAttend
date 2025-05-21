
"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { UserForm, type UserFormData } from "@/components/admin/users/UserForm";
import type { User } from "@/types/user";
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { USERS_STORAGE_KEY } from '@/lib/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { logUserActivity } from '@/lib/activityLogger';
import { useAuth } from '@/hooks/useAuth';

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { currentUserId: actorUserId } = useAuth(); // Renamed to avoid conflict
  
  const userIdParam = typeof params.id === 'string' ? params.id : undefined;

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (userIdParam) {
      setIsFetching(true);
      try {
        const storedUsersRaw = localStorage.getItem(USERS_STORAGE_KEY);
        if (storedUsersRaw) {
          const users: User[] = JSON.parse(storedUsersRaw);
          const foundUser = users.find(u => u.id === userIdParam);
          if (foundUser) {
            setUser(foundUser);
          } else {
            setNotFound(true);
          }
        } else {
          setNotFound(true); 
        }
      } catch (error) {
        console.error("Failed to load user from localStorage", error);
        setNotFound(true);
         toast({
          title: "Error",
          description: "Failed to load user data.",
          variant: "destructive",
        });
      } finally {
        setIsFetching(false);
      }
    } else {
      setNotFound(true); 
      setIsFetching(false);
    }
  }, [userIdParam, toast]);

  const handleFormSubmit = (data: UserFormData) => {
    if (!user) return;
    setIsLoading(true);

    setTimeout(() => {
      const updatedUser: User = {
        ...user,
        fullName: data.fullName,
        department: data.department,
        email: data.email,
        role: data.role,
        profileImageURL: data.profileImageURL,
        updatedAt: new Date().toISOString(),
      };
      
      try {
        const storedUsersRaw = localStorage.getItem(USERS_STORAGE_KEY);
        let users: User[] = storedUsersRaw ? JSON.parse(storedUsersRaw) : [];
        users = users.map(u => u.id === user.id ? updatedUser : u);
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

        logUserActivity(actorUserId, "USER_UPDATE_SUCCESS", `Updated user ID: ${updatedUser.userId}, Name: ${updatedUser.fullName}`);
        toast({
          title: "User Updated",
          description: `${data.fullName}'s record has been updated.`,
        });
        router.push('/admin/users');
      } catch (error) {
        console.error("Failed to update user in localStorage", error);
        logUserActivity(actorUserId, "USER_UPDATE_FAILURE", `Attempted to update user ID: ${user.userId}. Error: ${error instanceof Error ? error.message : String(error)}`);
        toast({
          title: "Error",
          description: "Failed to update user. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }, 1000);
  };

  if (isFetching) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading user data...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto text-center">
         <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl text-destructive">User Not Found</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-4">The user record you are trying to edit could not be found.</p>
                <Button variant="outline" asChild>
                <Link href="/admin/users">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to User List
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
          <h2 className="text-3xl font-semibold tracking-tight text-primary">Edit User</h2>
          <p className="text-muted-foreground">Update the details for {user?.fullName}.</p>
        </div>
         <Button variant="outline" asChild>
          <Link href="/admin/users">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Link>
        </Button>
      </div>
      {user && (
        <UserForm 
          onSubmit={handleFormSubmit} 
          initialData={user} 
          isLoading={isLoading}
          submitButtonText="Save Changes"
        />
      )}
    </div>
  );
}
