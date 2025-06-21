
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { User, Department } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

async function fetchDepartments(): Promise<Department[]> {
  const response = await fetch('/api/departments');
  if (!response.ok) throw new Error('Failed to fetch departments');
  return response.json();
}

const userFormSchema = z.object({
  fullName: z.string().min(1, { message: "Full Name is required." }),
  departmentId: z.string().min(1, { message: "Department is required." }),
  email: z.string().email({ message: "Invalid email address." }).min(1, { message: "Email is required." }),
  role: z.enum(['Admin', 'User'], { errorMap: () => ({ message: "Please select a role." }) }),
  profileImageURL: z.string().optional().or(z.literal("")),
});

const profileEditFormSchema = z.object({
  fullName: z.string().min(1, { message: "Full Name is required." }),
  email: z.string().email({ message: "Invalid email address." }).min(1, { message: "Email is required." }),
  profileImageURL: z.string().optional().or(z.literal("")),
});

export type UserFormData = z.infer<typeof userFormSchema>;
export type ProfileEditFormData = z.infer<typeof profileEditFormSchema>;

interface UserFormProps {
  onSubmit: (data: any) => void; // Allow more flexible data shape from different schemas
  initialData?: (User & { department: Department | null }) | null;
  isLoading?: boolean;
  submitButtonText?: string;
  isProfileEditMode?: boolean;
}

export function UserForm({ onSubmit, initialData, isLoading = false, submitButtonText = "Submit", isProfileEditMode = false }: UserFormProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { data: availableDepartments = [], isLoading: isLoadingDepartments } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: fetchDepartments,
  });

  const currentSchema = isProfileEditMode ? profileEditFormSchema : userFormSchema;

  const form = useForm<z.infer<typeof currentSchema>>({
    resolver: zodResolver(currentSchema),
    defaultValues: initialData ? {
      ...initialData,
      departmentId: initialData.departmentId || "",
      profileImageURL: initialData.profileImageURL || "",
    } : {
      fullName: "",
      departmentId: "",
      email: "",
      role: "User",
      profileImageURL: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        ...initialData,
        departmentId: initialData.departmentId || "",
        profileImageURL: initialData.profileImageURL || "",
      });
      setImagePreview(initialData.profileImageURL || null);
    }
  }, [initialData, form]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setImagePreview(dataUrl);
        form.setValue("profileImageURL", dataUrl, { shouldValidate: true });
      };
      reader.readAsDataURL(file);
    } else {
      const originalImageUrl = initialData?.profileImageURL || "";
      setImagePreview(originalImageUrl);
      form.setValue("profileImageURL", originalImageUrl, { shouldValidate: true });
    }
  };

  return (
    <Card className="shadow-md border-border">
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {initialData?.userId && !isProfileEditMode && (
              <FormItem>
                <FormLabel>User ID</FormLabel>
                <FormControl><Input value={initialData.userId} readOnly className="bg-muted/50" /></FormControl>
                <FormDescription>This ID is system-generated and cannot be changed.</FormDescription>
              </FormItem>
            )}
            <FormField control={form.control} name="fullName" render={({ field }) => (
              <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="e.g., Jane Smith" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            
            {isProfileEditMode ? (
              <FormItem>
                <FormLabel>Department</FormLabel>
                <FormControl><Input value={initialData?.department?.name || 'N/A'} readOnly className="bg-muted/50" /></FormControl>
                <FormDescription>Your department (cannot be changed here).</FormDescription>
              </FormItem>
            ) : (
              <FormField control={form.control} name="departmentId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value} disabled={isLoadingDepartments || availableDepartments.length === 0}>
                    <FormControl><SelectTrigger><SelectValue placeholder={isLoadingDepartments ? "Loading..." : "Select a department"} /></SelectTrigger></FormControl>
                    <SelectContent>{availableDepartments.map((dept) => (<SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>))}</SelectContent>
                  </Select>
                  {availableDepartments.length === 0 && !isLoadingDepartments && (<FormDescription>No departments found. Please add departments first.</FormDescription>)}
                  <FormMessage />
                </FormItem>
              )} />
            )}

            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem><FormLabel>Email Address</FormLabel><FormControl><Input type="email" placeholder="e.g., jane.smith@example.com" {...field} /></FormControl><FormMessage /></FormItem>
            )} />

            {!isProfileEditMode && (
              <FormField control={form.control} name="role" render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger></FormControl>
                    <SelectContent><SelectItem value="Admin">Admin</SelectItem><SelectItem value="User">User</SelectItem></SelectContent>
                  </Select>
                  <FormDescription>The user's role in the system.</FormDescription><FormMessage />
                </FormItem>
              )} />
            )}

            <FormItem>
              <FormLabel>Profile Image</FormLabel>
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 rounded-md">
                  <AvatarImage src={imagePreview || `https://placehold.co/80x80.png?text=No+Img`} alt="Profile preview" className="object-cover" data-ai-hint="user avatar" />
                  <AvatarFallback>IMG</AvatarFallback>
                </Avatar>
                <FormControl><Input type="file" accept="image/*" onChange={handleImageChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" /></FormControl>
              </div>
              <FormDescription>Upload a profile picture for the user. Use a square image for best results.</FormDescription>
              <FormField control={form.control} name="profileImageURL" render={({ field }) => <Input type="hidden" {...field} />} />
              {form.formState.errors.profileImageURL && (<FormMessage>{(form.formState.errors.profileImageURL as any).message}</FormMessage>)}
            </FormItem>
            
            <div className="flex justify-end pt-2">
              <Button type="submit" className="w-full sm:w-auto" disabled={isLoading || isLoadingDepartments}>
                {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</>) : (submitButtonText)}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
