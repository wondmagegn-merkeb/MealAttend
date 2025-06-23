
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserForm, type UserFormData } from "@/components/admin/users/UserForm";
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { logUserActivity } from '@/lib/activityLogger';
import { useAuth } from '@/hooks/useAuth';

export default function NewUserPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentUserId: actorUserId } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormSubmit = (data: UserFormData) => {
    setIsSubmitting(true);
    const newUserId = `ADERA/USR/${new Date().getFullYear()}/${Math.floor(10000 + Math.random() * 90000)}`;

    setTimeout(() => {
        logUserActivity(actorUserId, "USER_CREATE_SUCCESS", `Created user ID: ${newUserId}, Name: ${data.fullName}`);
        toast({
            title: "User Added (Demo)",
            description: `${data.fullName} has been successfully added. A welcome email has been dispatched.`,
        });
        router.push('/admin/users');
        setIsSubmitting(false);
    }, 1000);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-primary">Add New User</h2>
          <p className="text-muted-foreground">Fill in the details to add a new user record. A temporary password will be generated and sent via email.</p>
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
        isLoading={isSubmitting}
        submitButtonText="Add User and Send Welcome Email"
      />
    </div>
  );
}
