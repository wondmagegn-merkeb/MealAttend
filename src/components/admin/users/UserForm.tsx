
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { User } from "@/types/user";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

const userFormSchema = z.object({
  fullName: z.string().min(1, { message: "Full Name is required." }),
  department: z.string().min(1, { message: "Department is required." }),
  email: z.string().email({ message: "Invalid email address." }).min(1, { message: "Email is required." }),
});

export type UserFormData = z.infer<typeof userFormSchema>;

interface UserFormProps {
  onSubmit: (data: UserFormData) => void;
  initialData?: User | null;
  isLoading?: boolean;
  submitButtonText?: string;
}

export function UserForm({ onSubmit, initialData, isLoading, submitButtonText = "Submit" }: UserFormProps) {
  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: initialData || {
      fullName: "",
      department: "",
      email: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        fullName: initialData.fullName,
        department: initialData.department,
        email: initialData.email,
      });
    } else {
      form.reset({
        fullName: "",
        department: "",
        email: "",
      });
    }
  }, [initialData, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Jane Smith" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="department"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Department</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Human Resources" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input type="email" placeholder="e.g., jane.smith@example.com" {...field} />
              </FormControl>
              <FormDescription>
                The user's email address.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            submitButtonText
          )}
        </Button>
      </form>
    </Form>
  );
}
