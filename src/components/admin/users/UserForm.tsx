
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
import { Loader2, Upload, ShieldCheck, KeyRound, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { User, PermissionKey } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useAppSettings } from "@/hooks/useAppSettings";


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
  canManageSiteSettings: z.boolean().default(false),
};

const userFormSchema = z.object({
  fullName: z.string().min(1, { message: "Full Name is required." }),
  position: z.string().optional(),
  email: z.string().email({ message: "Invalid email address." }).min(1, { message: "Email is required." }),
  role: z.enum(['Super Admin', 'Admin', 'User'], { errorMap: () => ({ message: "Please select a role." }) }),
  status: z.enum(['Active', 'Inactive'], { errorMap: () => ({ message: "Please select a status." }) }),
  profileImageURL: z.string().optional().or(z.literal("")),
  passwordChangeRequired: z.boolean().default(true),
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
    { id: 'canManageSiteSettings', label: 'Manage Site Settings', section: 'Administration' },
];

export function UserForm({ onSubmit, initialData, isLoading = false, submitButtonText = "Submit", isProfileEditMode = false }: UserFormProps) {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const { settings: appSettings } = useAppSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const currentSchema = isProfileEditMode ? profileEditFormSchema : userFormSchema;
  const isEditMode = !!initialData;

  const form = useForm<z.infer<typeof currentSchema>>({
    resolver: zodResolver(currentSchema),
    defaultValues: initialData ? {
      ...initialData,
      position: initialData.position || "",
      status: initialData.status || "Active",
      profileImageURL: initialData.profileImageURL || "",
    } : {
      fullName: "",
      position: "",
      email: "",
      role: "User",
      status: "Active",
      profileImageURL: "",
      passwordChangeRequired: true,
    },
  });
  
  const watchedRole = form.watch('role' as any); // Use 'as any' to satisfy TS on profile edit mode

  useEffect(() => {
    if (initialData) {
      form.reset({
        ...initialData,
        position: initialData.position || "",
        status: initialData.status || "Active",
        profileImageURL: initialData.profileImageURL || "",
      });
      setImagePreview(initialData.profileImageURL || null);
    } else {
       // Set initial permissions for a new user form
       permissionFields.forEach(p => {
            form.setValue(p.id as any, false);
       });
    }
    setSelectedFile(null);
  }, [initialData, form]);
  
  // Effect to automatically set permissions when role changes
  useEffect(() => {
    if (isProfileEditMode || !form.formState.isDirty) return;
  
    const setAllPermissions = (value: boolean) => {
      permissionFields.forEach(p => form.setValue(p.id as any, value, { shouldValidate: true }));
    };
  
    if (watchedRole === 'Admin' || watchedRole === 'Super Admin') {
      setAllPermissions(true);
    } else if (watchedRole === 'User') {
      setAllPermissions(false); // Reset to false, let admin choose
      // Set specific defaults for 'User' role
      const userDefaultPerms: PermissionKey[] = ['canScanId', 'canReadStudents', 'canWriteStudents', 'canCreateStudents', 'canDeleteStudents', 'canExportStudents', 'canReadAttendance', 'canExportAttendance'];
      userDefaultPerms.forEach(p => form.setValue(p as any, true, { shouldValidate: true }));
    }
  }, [watchedRole, form, isProfileEditMode]);


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
  
  const isEditingSelf = currentUser?.id === initialData?.id;

  const renderPermissionSwitch = (id: PermissionKey, label: string) => {
    let isDisabled = false;
    let toolTipContent = "";

    // Super Admin can do anything
    if (currentUser?.role !== 'Super Admin') {
        // An Admin can't grant a permission they don't have themselves.
        if (!currentUser?.[id]) {
          isDisabled = true;
          toolTipContent = "You do not have this permission to grant it.";
        }
    }
    
    // Prevent user from changing critical admin settings unless they are Super Admin
    if (id === 'canManageSiteSettings' && currentUser?.role !== 'Super Admin') {
        isDisabled = true;
    }


    return (
      <FormField
        key={id}
        control={form.control as any}
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
    <Form {...form}>
        <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-2">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Left Column */}
                <div className="space-y-6">
                    <Card className="shadow-md border-border">
                        <CardHeader>
                            <CardTitle>User Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
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
                            
                            {!isProfileEditMode && (
                                <FormField control={form.control as any} name="position" render={({ field }) => (
                                <FormItem><FormLabel>Position</FormLabel><FormControl><Input placeholder="e.g., Kitchen Manager" {...field} /></FormControl><FormMessage /></FormItem>
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
                                    readOnly={isEditMode && !isProfileEditMode}
                                    className={(isEditMode && !isProfileEditMode) ? "bg-muted/50" : ""}
                                />
                                </FormControl>
                                {isEditMode && !isProfileEditMode && <FormDescription>User email cannot be changed after creation.</FormDescription>}
                                <FormMessage />
                            </FormItem>
                            )} />

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


                            {!isProfileEditMode && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <FormField control={form.control as any} name="role" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Role</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value} disabled={isEditingSelf}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {currentUser?.role === 'Super Admin' && <SelectItem value="Super Admin">Super Admin</SelectItem>}
                                            {currentUser?.role === 'Super Admin' && <SelectItem value="Admin">Admin</SelectItem>}
                                            {(currentUser?.role === 'Super Admin' || currentUser?.role === 'Admin') && <SelectItem value="User">User</SelectItem>}
                                        </SelectContent>
                                        </Select>
                                        <FormDescription>{isEditingSelf ? "You cannot change your own role." : "The user's role."}</FormDescription><FormMessage />
                                    </FormItem>
                                    )} />

                                    <FormField control={form.control as any} name="status" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Status</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select a status" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="Active">Active</SelectItem>
                                            <SelectItem value="Inactive">Inactive</SelectItem>
                                        </SelectContent>
                                        </Select>
                                        <FormDescription>The user's status.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                    )} />
                                </div>
                            )}

                        </CardContent>
                    </Card>
                </div>

                {/* Right Column */}
                {!isProfileEditMode && (
                    <div className="space-y-6">
                        <Card className="shadow-md border-border">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><ShieldCheck /> User Permissions</CardTitle>
                                <CardDescription>
                                    Assign permissions for this user.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                            {Object.entries(permissionGroups).map(([section, perms]) => (
                                <div key={section} className="mb-6 last:mb-0">
                                <h3 className="font-semibold text-lg text-primary mb-2">{section}</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                                    {perms.map(p => renderPermissionSwitch(p.id, p.label))}
                                    </div>
                                    {section !== 'Administration' && <Separator className="mt-6"/>}
                                </div>
                            ))}
                            </CardContent>
                        </Card>
                         <div className="flex justify-end pt-1">
                            <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
                                {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</>) : (submitButtonText)}
                            </Button>
                        </div>
                    </div>
                )}
            </div>

             {isProfileEditMode && (
                <div className="flex justify-end pt-1">
                    <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
                        {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</>) : (submitButtonText)}
                    </Button>
                </div>
             )}
        </form>
    </Form>
  );
}
