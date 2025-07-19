
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
import { useEffect, useState, useRef } from "react";
import { Loader2, Upload, ShieldCheck, KeyRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { User, PermissionKey } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";


const permissionsSchema = {
  canReadDashboard: z.boolean().default(false),
  canScanId: z.boolean().default(false),
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
  position: z.string().optional(),
  email: z.string().email({ message: "Invalid email address." }).min(1, { message: "Email is required." }),
  role: z.enum(['Super Admin', 'Admin', 'User'], { errorMap: () => ({ message: "Please select a role." }) }),
  status: z.enum(['Active', 'Inactive'], { errorMap: () => ({ message: "Please select a status." }) }),
  profileImageURL: z.string().optional().or(z.literal("")),
  password: z.string().optional().refine(val => !val || val.length >= 6, {
    message: "Password must be at least 6 characters long if provided.",
  }),
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
  initialData?: User | null;
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

const permissionFields: { id: PermissionKey, label: string, section: string }[] = [
    { id: 'canReadDashboard', label: 'View Dashboard', section: 'General Access' },
    { id: 'canScanId', label: 'Scan ID Cards', section: 'General Access' },
    { id: 'canCreateStudents', label: 'Create Students', section: 'Student Management' },
    { id: 'canReadStudents', label: 'Read Students', section: 'Student Management' },
    { id: 'canWriteStudents', label: 'Update Students', section: 'Student Management' },
    { id: 'canDeleteStudents', label: 'Delete Students', section: 'Student Management' },
    { id: 'canExportStudents', label: 'Export Students', section: 'Student Management' },
    { id: 'canReadAttendance', label: 'Read Attendance', section: 'Attendance' },
    { id: 'canExportAttendance', label: 'Export Attendance', section: 'Attendance' },
    { id: 'canReadActivityLog', label: 'Read Activity Log', section: 'Administration' },
    { id: 'canReadUsers', label: 'Read Users', section: 'Administration' },
    { id: 'canWriteUsers', label: 'Manage Users', section: 'Administration' },
];

export function UserForm({ onSubmit, initialData, isLoading = false, submitButtonText = "Submit", isProfileEditMode = false }: UserFormProps) {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const currentSchema = isProfileEditMode ? profileEditFormSchema : userFormSchema;

  const form = useForm<z.infer<typeof currentSchema>>({
    resolver: zodResolver(currentSchema),
    defaultValues: initialData ? {
      ...initialData,
      position: initialData.position || "",
      status: initialData.status || "Active",
      profileImageURL: initialData.profileImageURL || "",
      password: "", // Always start with empty password field
    } : {
      fullName: "",
      position: "",
      email: "",
      role: "User",
      status: "Active",
      profileImageURL: "",
      password: "",
    },
  });
  
  const watchedRole = form.watch('role');

  useEffect(() => {
    if (initialData) {
      form.reset({
        ...initialData,
        position: initialData.position || "",
        status: initialData.status || "Active",
        profileImageURL: initialData.profileImageURL || "",
        password: "",
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
    
    // Don't submit an empty password string
    if ('password' in dataToSubmit && !dataToSubmit.password) {
        delete (dataToSubmit as any).password;
    }

    onSubmit(dataToSubmit);
  };
  
  const isEditingSelf = currentUser?.id === initialData?.id;

  const renderPermissionSwitch = (id: PermissionKey, label: string) => {
    let isDisabled = watchedRole === 'Admin' || watchedRole === 'Super Admin';
    let toolTipContent = "Admins have this permission by default.";

    if (currentUser?.role === 'Admin' && !currentUser[id]) {
      isDisabled = true;
      toolTipContent = "You do not have this permission to grant it.";
    }

    return (
      <FormField
        key={id}
        control={form.control}
        name={id}
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="space-y-0.5">
              <FormLabel>{label}</FormLabel>
            </div>
            <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isDisabled}
                  aria-readonly={isDisabled}
                />
            </FormControl>
          </FormItem>
        )}
      />
    );
  };

  const permissionGroups = permissionFields.reduce((acc, perm) => {
    if (!acc[perm.section]) {
      acc[perm.section] = [];
    }
    acc[perm.section].push(perm);
    return acc;
  }, {} as Record<string, typeof permissionFields>);


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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="fullName" render={({ field }) => (
                <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="e.g., Jane Smith" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              {!isProfileEditMode && (
                <FormField control={form.control} name="position" render={({ field }) => (
                  <FormItem><FormLabel>Position</FormLabel><FormControl><Input placeholder="e.g., Kitchen Manager" {...(field as any)} /></FormControl><FormMessage /></FormItem>
                )} />
              )}
            </div>

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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="role" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={(field as any).onChange} value={(field as any).value} defaultValue={(field as any).value} disabled={isEditingSelf}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger></FormControl>
                      <SelectContent>
                          {currentUser?.role === 'Super Admin' && <SelectItem value="Super Admin">Super Admin</SelectItem>}
                          {currentUser?.role === 'Super Admin' && <SelectItem value="Admin">Admin</SelectItem>}
                          {(currentUser?.role === 'Super Admin' || currentUser?.role === 'Admin') && <SelectItem value="User">User</SelectItem>}
                      </SelectContent>
                    </Select>
                    <FormDescription>{isEditingSelf ? "You cannot change your own role." : "The user's role in the system."}</FormDescription><FormMessage />
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
              </div>
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
                    <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
                        {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</>) : (submitButtonText)}
                    </Button>
                 )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
    
    {!isProfileEditMode && (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-6">

        {initialData && (
          <Card className="shadow-md border-border mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><KeyRound /> Reset Password</CardTitle>
              <CardDescription>
                Optionally enter a new password for this user. They will be required to change it on their next login.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Leave blank to keep current password" {...(field as any)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>
        )}

        <Card className="shadow-md border-border mt-6">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><ShieldCheck /> User Permissions</CardTitle>
                 <CardDescription>
                  {watchedRole === 'User' ? 'Assign permissions for this user.' : `The '${watchedRole}' role has all permissions by default.`}
                </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.entries(permissionGroups).map(([section, perms]) => (
                <div key={section} className="mb-6 last:mb-0">
                  <h3 className="font-semibold text-lg text-primary mb-2">{section}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                    {perms.map(p => renderPermissionSwitch(p.id, p.label))}
                    </div>
                    {section !== 'Administration' && <Separator className="mt-6"/>}
                </div>
              ))}
            </CardContent>
        </Card>

        <div className="flex justify-end pt-4">
            <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
                {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</>) : (submitButtonText)}
            </Button>
        </div>
      </form>
    </Form>
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
