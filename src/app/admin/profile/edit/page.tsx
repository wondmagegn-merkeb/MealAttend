
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserForm, type ProfileEditFormData } from "@/components/admin/users/UserForm";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@/types/user";
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, UserCog } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { logUserActivity } from '@/lib/activityLogger'; // Import the logger

export default function EditProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser, updateCurrentUserDetails, isAuthenticated, currentUserId } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [isClientMounted, setIsClientMounted] = useState(false);

  useEffect(() => {
    setIsClientMounted(true);
  }, []);

  const handleFormSubmit = (data: ProfileEditFormData) => {
    if (!currentUser || !currentUserId) {
        toast({ title: "Error", description: "No user session found.", variant: "destructive" });
        logUserActivity(null, "PROFILE_UPDATE_FAILURE", "No user session found.");
        return;
    }
    setIsLoading(true);
    
    setTimeout(() => {
      try {
        const detailsToUpdate: Partial<User> = {
            fullName: data.fullName,
            // department is not editable here
            email: data.email,
            profileImageURL: data.profileImageURL,
        };
        updateCurrentUserDetails(detailsToUpdate);
        logUserActivity(currentUserId, "PROFILE_UPDATE_SUCCESS"); // Log profile update
        // Toast is handled within updateCurrentUserDetails
      } catch (error) {
        console.error("Failed to update profile", error);
        logUserActivity(currentUserId, "PROFILE_UPDATE_FAILURE", "Error during profile update.");
        toast({
          title: "Error",
          description: "Failed to update profile. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }, 1000);
  };

  if (!isClientMounted || isAuthenticated === null) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading profile...</p>
      </div>
    );
  }
  
  if (isAuthenticated === false) {
    return (
         <div className="space-y-6 max-w-2xl mx-auto text-center">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl text-destructive">Access Denied</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground mb-4">You must be logged in to edit your profile.</p>
                    <Button variant="outline" asChild>
                    <Link href="/auth/login">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Go to Login
                    </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
  }

  if (!currentUser) {
     return (
      <div className="space-y-6 max-w-2xl mx-auto text-center">
         <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl text-destructive">User Not Found</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-4">Could not load your profile data.</p>
                <Button variant="outline" asChild>
                <Link href="/admin">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
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
          <h2 className="text-3xl font-semibold tracking-tight text-primary flex items-center">
            <UserCog className="mr-3 h-8 w-8" /> Edit Your Profile
          </h2>
          <p className="text-muted-foreground">Update your personal details.</p>
        </div>
         <Button variant="outline" asChild>
          <Link href="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
      <UserForm 
        onSubmit={handleFormSubmit} 
        initialData={currentUser}
        isLoading={isLoading}
        submitButtonText="Save Profile Changes"
        isProfileEditMode={true}
      />
    </div>
  );
}
