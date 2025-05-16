
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { User } from "@/types/user";
import type { Department } from "@/types/department";
import { DEPARTMENTS_STORAGE_KEY } from '@/lib/constants';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const userFormSchema = z.object({
  fullName: z.string().min(1, { message: "Full Name is required." }),
  department: z.string().min(1, { message: "Department is required." }),
  email: z.string().email({ message: "Invalid email address." }).min(1, { message: "Email is required." }),
  role: z.enum(['Admin', 'User'], { errorMap: () => ({ message: "Please select a role." }) }),
});

export type UserFormData = z.infer<typeof userFormSchema>;

interface UserFormProps {
  onSubmit: (data: UserFormData) => void;
  initialData?: User | null;
  isLoading?: boolean;
  submitButtonText?: string;
}

export function UserForm({ onSubmit, initialData, isLoading, submitButtonText = "Submit" }: UserFormProps) {
  const [availableDepartments, setAvailableDepartments] = useState<Department[]>([]);

  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: initialData || {
      fullName: "",
      department: "", 
      email: "",
      role: "User", // Default role for new users
    },
  });

  useEffect(() => {
    // Load departments from localStorage
    try {
      const storedDepartmentsRaw = localStorage.getItem(DEPARTMENTS_STORAGE_KEY);
      if (storedDepartmentsRaw) {
        const departments: Department[] = JSON.parse(storedDepartmentsRaw);
        setAvailableDepartments(departments.sort((a, b) => a.name.localeCompare(b.name)));
      }
    } catch (error) {
      console.error("Failed to load departments from localStorage for UserForm", error);
    }
  }, []);

  useEffect(() => {
    if (initialData) {
      form.reset({
        fullName: initialData.fullName,
        department: initialData.department, 
        email: initialData.email,
        role: initialData.role,
      });
    } else {
      form.reset({
        fullName: "",
        department: "",
        email: "",
        role: "User",
      });
    }
  }, [initialData, form]);

  return (
    <Card className="shadow-md border-border">
      <CardContent className="pt-6">
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
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value} 
                    defaultValue={field.value}
                    disabled={availableDepartments.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={availableDepartments.length > 0 ? "Select a department" : "No departments available"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableDepartments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.name}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {availableDepartments.length === 0 && (
                    <FormDescription>
                        No departments found. Please add departments first.
                    </FormDescription>
                  )}
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
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="User">User</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The user's role in the system.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end pt-2">
              <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  submitButtonText
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
