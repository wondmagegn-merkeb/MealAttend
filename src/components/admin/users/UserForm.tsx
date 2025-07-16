
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useQuery } from '@tanstack/react-query';

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState, useRef } from "react";
import { Loader2, Upload, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UserWithDepartment, Department, PermissionKey } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";


const fetchDepartments = async (): Promise<Department[]> => {
    const response = await fetch('/api/departments');
    if (!response.ok) {
        throw new Error('Failed to fetch departments');
    }
    return response.json();
};

const permissionsSchema = {
  canReadStudents: z.boolean().default(false),
  canWriteStudents: z.boolean().default(false),
  canCreateStudents: z.boolean().default(false),
  canDeleteStudents: z.boolean().default(false),
  canExportStudents: z.boolean().default(false),
  canReadAttendance: z.boolean().default(false),
  canExportAttendance: z.boolean().default(false),
  canReadActivityLog: z.boolean().default(false),
  canReadUsers: z.boolean().default(false),
  canWriteUsers: z.boolean().default(false),
  canReadDepartments: z.boolean().default(false),
  canWriteDepartments: z.boolean().default(false),
};

const userFormSchema = z.object({
  fullName: z.string().min(1, { message: "Full Name is required." }),
  departmentId: z.string().min(1, { message: "Department is required." }),
  email: z.string().email({ message: "Invalid email address." }).min(1, { message: "Email is required." }),
  role: z.enum(['Super Admin', 'Admin', 'User'], { errorMap: () => ({ message: "Please select a role." }) }),
  status: z.enum(['Active', 'Inactive'], { errorMap: () => ({ message: "Please select a status." }) }),
  profileImageURL: z.string().optional().or(z.literal("")),
  ...permissionsSchema,
});

const profileEditFormSchema = z.object({
  fullName: z.string().min(1, { message: "Full Name is required." }),
  email: z.string().email({ message: "Invalid email address." }).min(1, { message: "Email is required." }),
  profileImageURL: z.string().optional().or(z.literal("")),
});

export type UserFormData = z.infer<typeof userFormSchema>;
export type ProfileEditFormData = z.infer<typeof profileEditFormSchema>;

interface UserFormProps {
  onSubmit: (data: any) => void; 
  initialData?: UserWithDepartment | null;
  isLoading?: boolean;
  submitButtonText?: string;
  isProfileEditMode?: boolean;
}

const fileToDataUri = (file: File): Promise<string | null> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

const permissionLabels: Record<PermissionKey, string> = {
    canCreateStudents: 'Create Students', canReadStudents: 'Read Students', canWriteStudents: 'Update Students',
    canDeleteStudents: 'Delete Students', canExportStudents: 'Export Students', canReadAttendance: 'Read Attendance',
    canExportAttendance: 'Export Attendance', canReadActivityLog: 'Read Activity Log', canReadUsers: 'Read Users',
    canWriteUsers: 'Write Users', canReadDepartments: 'Read Departments', canWriteDepartments: 'Write Departments'
};

export function UserForm({ onSubmit, initialData, isLoading = false, submitButtonText = "Submit", isProfileEditMode = false }: UserFormProps) {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: availableDepartments = [], isLoading: isLoadingDepartments } = useQuery<Department[]>({
      queryKey: ['departments'],
      queryFn: fetchDepartments,
      staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const currentSchema = isProfileEditMode ? profileEditFormSchema : userFormSchema;

  const form = useForm<z.infer<typeof currentSchema>>({
    resolver: zodResolver(currentSchema),
    defaultValues: initialData ? {
      ...initialData,
      departmentId: initialData.departmentId || "",
      status: initialData.status || "Active",
      profileImageURL: initialData.profileImageURL || "",
    } : {
      fullName: "",
      departmentId: "",
      email: "",
      role: "User",
      status: "Active",
      profileImageURL: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        ...initialData,
        departmentId: initialData.departmentId || "",
        status: initialData.status || "Active",
        profileImageURL: initialData.profileImageURL || "",
      });
      setImagePreview(initialData.profileImageURL || null);
    }
    setSelectedFile(null);
  }, [initialData, form]);

  useEffect(() => {
    if (imagePreview && imagePreview.startsWith("blob:")) {
      return () => {
        URL.revokeObjectURL(imagePreview);
      };
    }
  }, [imagePreview]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
          title: "Image Too Large",
          description: "Please select an image smaller than 2MB.",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };
  
  const onFormSubmit = async (data: UserFormData | ProfileEditFormData) => {
    let finalProfileUrl = initialData?.profileImageURL || null;

    if (selectedFile) {
      try {
        toast({ title: "Processing image...", description: "Please wait." });
        finalProfileUrl = await fileToDataUri(selectedFile);
      } catch (error) {
        console.error("Image processing error:", error);
        toast({ title: "Image Error", description: "Could not process the selected image.", variant: "destructive" });
        return; // Stop submission
      }
    }

    const dataToSubmit = {
        ...data,
        profileImageURL: finalProfileUrl,
    };
    
    onSubmit(dataToSubmit);
  };
  
  const canGrantPermission = (permissionKey: PermissionKey): boolean => {
    if (!currentUser) return false;
    // Super Admins can grant any permission
    if (currentUser.role === 'Super Admin') return true;
    // Admins can only grant permissions they have themselves
    if (currentUser.role === 'Admin') {
      return currentUser[permissionKey] === true;
    }
    // Users cannot grant permissions
    return false;
  };


  return (
    <>
    <Card className="shadow-md border-border">
      <CardHeader>
          <CardTitle>User Details</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-6">
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
                  <Select onValueChange={(field as any).onChange} value={(field as any).value} defaultValue={(field as any).value} disabled={isLoadingDepartments || availableDepartments.length === 0}>
                    <FormControl><SelectTrigger><SelectValue placeholder={isLoadingDepartments ? "Loading..." : "Select a department"} /></SelectTrigger></FormControl>
                    <SelectContent>{availableDepartments.map((dept) => (<SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>))}</SelectContent>
                  </Select>
                  {availableDepartments.length === 0 && !isLoadingDepartments && (<FormDescription>No departments found. Please add departments first.</FormDescription>)}
                  <FormMessage />
                </FormItem>
              )} />
            )}

            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input 
                    type="email" 
                    placeholder="e.g., jane.smith@example.com" 
                    {...field}
                    readOnly={isProfileEditMode || !!initialData}
                    className={(isProfileEditMode || !!initialData) ? "bg-muted/50" : ""}
                  />
                </FormControl>
                {isProfileEditMode 
                  ? <FormDescription>Your email address cannot be changed.</FormDescription>
                  : (!!initialData ? <FormDescription>User email cannot be changed after creation.</FormDescription> : <FormMessage />)
                }
              </FormItem>
            )} />

            {!isProfileEditMode && (
              <>
                <FormField control={form.control} name="role" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={(field as any).onChange} value={(field as any).value} defaultValue={(field as any).value} disabled={currentUser?.role !== 'Super Admin'}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger></FormControl>
                      <SelectContent>
                          {currentUser?.role === 'Super Admin' && <SelectItem value="Admin">Admin</SelectItem>}
                          {(currentUser?.role === 'Super Admin' || currentUser?.role === 'Admin') && <SelectItem value="User">User</SelectItem>}
                      </SelectContent>
                    </Select>
                    <FormDescription>The user's role in the system. Super Admins assign Admins. Admins assign Users.</FormDescription><FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={(field as any).onChange} value={(field as any).value} defaultValue={(field as any).value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select a status" /></SelectTrigger></FormControl>
                      <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>The user's current status in the system.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
              </>
            )}

            <FormItem>
              <FormLabel>Profile Image</FormLabel>
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 rounded-md">
                    <AvatarImage src={imagePreview || `https://placehold.co/80x80.png?text=No+Img`} alt="Profile preview" className="object-cover" data-ai-hint="user avatar" />
                    <AvatarFallback>IMG</AvatarFallback>
                </Avatar>
                <Input 
                  id="picture" 
                  type="file" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleImageChange}
                  accept="image/*"
                  disabled={isLoading}
                />
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                  <Upload className="mr-2 h-4 w-4" />
                  {selectedFile ? 'Change Image' : 'Upload Image'}
                </Button>
              </div>
              <FormDescription>
                 {selectedFile ? `Selected: ${selectedFile.name}` : "Select an image (max 2MB)."} It will be processed on submission.
              </FormDescription>
              <FormField control={form.control} name="profileImageURL" render={({ field }) => <Input type="hidden" {...field} />} />
              {form.formState.errors.profileImageURL && (<FormMessage>{(form.formState.errors.profileImageURL as any).message}</FormMessage>)}
            </FormItem>
             <div className="flex justify-end pt-2">
                 {!isProfileEditMode && (
                    <Button type="submit" className="w-full sm:w-auto" disabled={isLoading || isLoadingDepartments}>
                        {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</>) : (submitButtonText)}
                    </Button>
                 )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>

    {!isProfileEditMode && form.watch('role') !== 'Admin' && (
        <Card className="shadow-md border-border mt-6">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><ShieldCheck /> User Permissions</CardTitle>
                 <FormDescription>
                    An Admin can only grant permissions that they possess themselves.
                 </FormDescription>
            </CardHeader>
            <CardContent>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-4">
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg text-primary">Student Management</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                                {Object.keys(permissionLabels).slice(0, 5).map((key) => (
                                    <FormField key={key} control={form.control} name={key as PermissionKey} render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                        <div className="space-y-0.5"><FormLabel>{permissionLabels[key as PermissionKey]}</FormLabel></div>
                                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} disabled={!canGrantPermission(key as PermissionKey)} /></FormControl>
                                    </FormItem>)} 
                                    />
                                ))}
                            </div>
                        </div>
                        <Separator />
                        <div className="space-y-4">
                             <h3 className="font-semibold text-lg text-primary">Attendance</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                               {Object.keys(permissionLabels).slice(5, 7).map((key) => (
                                    <FormField key={key} control={form.control} name={key as PermissionKey} render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                        <div className="space-y-0.5"><FormLabel>{permissionLabels[key as PermissionKey]}</FormLabel></div>
                                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} disabled={!canGrantPermission(key as PermissionKey)} /></FormControl>
                                    </FormItem>)} 
                                    />
                                ))}
                            </div>
                        </div>
                         <Separator />
                        <div className="space-y-4">
                             <h3 className="font-semibold text-lg text-primary">Administration</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                               {Object.keys(permissionLabels).slice(7).map((key) => (
                                    <FormField key={key} control={form.control} name={key as PermissionKey} render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                        <div className="space-y-0.5"><FormLabel>{permissionLabels[key as PermissionKey]}</FormLabel></div>
                                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} disabled={!canGrantPermission(key as PermissionKey)} /></FormControl>
                                    </FormItem>)} 
                                    />
                                ))}
                            </div>
                        </div>
                         <div className="flex justify-end pt-4">
                             <Button type="submit" className="w-full sm:w-auto" disabled={isLoading || isLoadingDepartments}>
                                {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</>) : (submitButtonText)}
                            </Button>
                        </div>
                    </form>
                 </Form>
            </CardContent>
        </Card>
    )}

    {isProfileEditMode && (
        <div className="mt-6 flex justify-end">
             <Button onClick={form.handleSubmit(onFormSubmit)} className="w-full sm:w-auto" disabled={isLoading}>
                {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</>) : (submitButtonText)}
            </Button>
        </div>
    )}
    </>
  );
}
