
"use client";

import { useRouter } from 'next/navigation';
import { UserForm, type ProfileEditFormData } from "@/components/admin/users/UserForm";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@prisma/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, UserCog } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { logUserActivity } from '@/lib/activityLogger';

type ApiProfileUpdateData = Omit<ProfileEditFormData, 'departmentId' | 'role'>;

async function updateUserProfileAPI({ id, data }: { id: string, data: ApiProfileUpdateData }): Promise<User> {
  const response = await fetch(`/api/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to update profile' }));
    throw new Error(errorData.message || 'Failed to update profile');
  }
  return response.json();
}

export default function EditProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser, updateAuthContextUser, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: updateUserProfileAPI,
    onSuccess: (updatedUser) => {
      updateAuthContextUser(updatedUser); 
      queryClient.invalidateQueries({ queryKey: ['users'] });
      logUserActivity(currentUser?.userId || null, "PROFILE_UPDATE_SUCCESS");
      toast({
        title: "Profile Updated",
        description: "Your profile details have been saved.",
      });
    },
    onError: (error: Error) => {
      logUserActivity(currentUser?.userId || null, "PROFILE_UPDATE_FAILURE", `Error: ${error.message}`);
      toast({
        title: "Error Updating Profile",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFormSubmit = (data: ProfileEditFormData) => {
    if (!currentUser) {
      toast({ title: "Error", description: "No user session found.", variant: "destructive" });
      logUserActivity(null, "PROFILE_UPDATE_FAILURE", "No user session found.");
      return;
    }
    mutation.mutate({ id: currentUser.id, data });
  };
  
  if (isAuthenticated === null) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading profile...</p>
      </div>
    );
  }
  
  if (!currentUser) {
     return (
      <div className="space-y-6 max-w-2xl mx-auto text-center">
         <Card className="shadow-lg">
            <CardHeader><CardTitle className="text-2xl text-destructive">User Not Found</CardTitle></CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-4">Could not load your profile data.</p>
                <Button variant="outline" asChild>
                  <Link href="/admin"><ArrowLeft className="mr-2 h-4 w-4" />Back to Dashboard</Link>
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
          <h2 className="text-3xl font-semibold tracking-tight text-primary flex items-center">
            <UserCog className="mr-3 h-8 w-8" /> Edit Your Profile
          </h2>
          <p className="text-muted-foreground">Update your personal details.</p>
        </div>
         <Button variant="outline" asChild>
          <Link href="/admin"><ArrowLeft className="mr-2 h-4 w-4" />Back to Dashboard</Link>
        </Button>
      </div>
      <UserForm 
        onSubmit={handleFormSubmit} 
        initialData={currentUser}
        isLoading={mutation.isPending}
        submitButtonText="Save Profile Changes"
        isProfileEditMode={true}
      />
    </div>
  );
}
