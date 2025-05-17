
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const userFormSchema = z.object({
  fullName: z.string().min(1, { message: "Full Name is required." }),
  department: z.string().min(1, { message: "Department is required." }),
  email: z.string().email({ message: "Invalid email address." }).min(1, { message: "Email is required." }),
  role: z.enum(['Admin', 'User'], { errorMap: () => ({ message: "Please select a role." }) }),
  profileImageURL: z.string().optional().or(z.literal("")),
});

// Schema for profile edit, omitting role and department as they are not directly editable by user on their profile
const profileEditFormSchema = z.object({
  fullName: z.string().min(1, { message: "Full Name is required." }),
  email: z.string().email({ message: "Invalid email address." }).min(1, { message: "Email is required." }),
  profileImageURL: z.string().optional().or(z.literal("")),
  // Department and Role are implicitly part of initialData but not part of the submitted form data for profile edit
});


export type UserFormData = z.infer<typeof userFormSchema>;
export type ProfileEditFormData = z.infer<typeof profileEditFormSchema>;


interface UserFormProps {
  onSubmit: (data: UserFormData | ProfileEditFormData) => void;
  initialData?: User | null;
  isLoading?: boolean;
  submitButtonText?: string;
  isProfileEditMode?: boolean;
}

export function UserForm({ 
  onSubmit, 
  initialData, 
  isLoading = false, 
  submitButtonText = "Submit",
  isProfileEditMode = false,
}: UserFormProps) {
  const [availableDepartments, setAvailableDepartments] = useState<Department[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const currentSchema = isProfileEditMode ? profileEditFormSchema : userFormSchema;

  const form = useForm<UserFormData | ProfileEditFormData>({ 
    resolver: zodResolver(currentSchema),
    defaultValues: initialData ? {
      ...initialData, // Spread initialData which includes department and role
      profileImageURL: initialData.profileImageURL || "",
    } : {
      fullName: "",
      department: "", 
      email: "",
      role: "User", 
      profileImageURL: "",
    },
  });

  useEffect(() => {
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
        ...initialData,
        profileImageURL: initialData.profileImageURL || "",
      });
      setImagePreview(initialData.profileImageURL || null);
    } else {
       form.reset({
        fullName: "",
        department: "",
        email: "",
        role: "User", 
        profileImageURL: "",
      });
      setImagePreview(null);
    }
  }, [initialData, form.reset]);

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

  const onFormSubmit = (data: UserFormData | ProfileEditFormData) => {
    if (isProfileEditMode && initialData) {
      const finalData: Partial<User> = { // Ensure type safety, department & role come from initialData
        fullName: (data as ProfileEditFormData).fullName,
        email: (data as ProfileEditFormData).email,
        profileImageURL: (data as ProfileEditFormData).profileImageURL,
        // department and role are not submitted from the form in profile edit mode
        // they will be retained from the original currentUser object in useAuth's updateCurrentUserDetails
      };
      onSubmit(finalData);
    } else {
      onSubmit(data as UserFormData); // For new user or full admin edit
    }
  };


  return (
    <Card className="shadow-md border-border">
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-6">
            {initialData?.userId && !isProfileEditMode && ( 
              <FormItem>
                <FormLabel>User ID (ADERA Format)</FormLabel>
                <FormControl>
                  <Input type="text" value={initialData.userId} readOnly className="bg-muted/50" />
                </FormControl>
                <FormDescription>
                  This ID is system-generated and cannot be changed.
                </FormDescription>
              </FormItem>
            )}
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
            
            {isProfileEditMode ? (
              <FormItem>
                <FormLabel>Department</FormLabel>
                <FormControl>
                  <Input value={initialData?.department || 'N/A'} readOnly className="bg-muted/50" />
                </FormControl>
                <FormDescription>
                  Your department (cannot be changed here).
                </FormDescription>
              </FormItem>
            ) : (
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
            )}

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
            {!isProfileEditMode && ( 
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
            )}
             <FormItem>
              <FormLabel>Profile Image</FormLabel>
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 rounded-md">
                  <AvatarImage
                    src={imagePreview || `https://placehold.co/80x80.png?text=No+Img`}
                    alt="Profile preview"
                    className="object-cover"
                    data-ai-hint="user avatar"
                  />
                  <AvatarFallback>IMG</AvatarFallback>
                </Avatar>
                <FormControl>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-slate-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-primary/10 file:text-primary
                      hover:file:bg-primary/20"
                  />
                </FormControl>
              </div>
              <FormDescription>
                Upload a profile picture for the user. Use a square image for best results.
              </FormDescription>
              <FormField
                control={form.control}
                name="profileImageURL"
                render={({ field }) => <Input type="hidden" {...field} />}
              />
               {form.formState.errors.profileImageURL && (
                  <FormMessage>{(form.formState.errors.profileImageURL as any).message}</FormMessage>
              )}
            </FormItem>
            
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
