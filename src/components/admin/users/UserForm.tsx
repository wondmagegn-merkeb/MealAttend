

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
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { Loader2, ShieldCheck, KeyRound, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { User } from '@/types';
import type { PermissionKey } from '@/types/permissions';
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useAppSettings } from "@/hooks/useAppSettings";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

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
  canSeeAllRecords: z.boolean().default(false),
};

const profileEditSchema = z.object({
  fullName: z.string().min(1, { message: "Full Name is required." }),
  profileImageURL: z.string().optional().nullable(),
});

export type ProfileEditFormData = z.infer<typeof profileEditSchema>;

const userFormSchema = z.object({
  fullName: z.string().min(1, { message: "Full Name is required." }),
  position: z.string().optional(),
  email: z.string().email({ message: "Invalid email address." }).min(1, { message: "Email is required." }),
  role: z.enum(['Super Admin', 'Admin', 'User'], { errorMap: () => ({ message: "Please select a role." }) }),
  status: z.enum(['Active', 'Inactive'], { errorMap: () => ({ message: "Please select a status." }) }),
  password: z.string().optional(),
  passwordChangeRequired: z.boolean().default(true),
  profileImageURL: z.string().optional().nullable(),
  ...permissionsSchema,
});

export type UserFormData = z.infer<typeof userFormSchema>;

interface UserFormProps {
  onSubmit: (data: UserFormData | ProfileEditFormData) => void;
  initialData?: User | null;
  isLoading?: boolean;
  submitButtonText?: string;
  isProfileEditMode?: boolean;
}

const permissionFields: { id: PermissionKey, label: string, section: string }[] = [
    { id: 'canReadDashboard', label: 'View Dashboard', section: 'General Access' },
    { id: 'canScanId', label: 'Scan ID Cards', section: 'General Access' },
    { id: 'canSeeAllRecords', label: 'View All Records', section: 'General Access' },
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
  const { currentUser } = useAuth();
  const { settings: appSettings } = useAppSettings();

  const isEditMode = !!initialData;
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formSchema = isProfileEditMode ? profileEditSchema : userFormSchema;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      ...initialData,
      position: initialData.position || "",
      status: initialData.status || "Active",
      password: "", // Always clear password on edit form load
    } : {
      fullName: "",
      position: "",
      email: "",
      role: "User",
      status: "Active",
      passwordChangeRequired: true,
      profileImageURL: null,
      // Initialize all perms to false
      canReadDashboard: false, canScanId: false, canSeeAllRecords: false, canCreateStudents: false,
      canReadStudents: false, canWriteStudents: false, canDeleteStudents: false,
      canExportStudents: false, canReadAttendance: false, canExportAttendance: false,
      canReadActivityLog: false, canReadUsers: false, canWriteUsers: false,
      canManageSiteSettings: false,
    },
  });
  
  const watchedRole = form.watch('role');
  const { setValue } = form;

  useEffect(() => {
    if (initialData) {
      form.reset({
        ...initialData,
        position: initialData.position || "",
        status: initialData.status || "Active",
        password: "",
      } as any);
      setImagePreview(initialData.profileImageURL);
    }
  }, [initialData, form]);

  
  // Effect to automatically set permissions when role changes on a NEW user form.
  useEffect(() => {
    if (isEditMode || isProfileEditMode) return;
  
    const setAllPermissions = (value: boolean) => {
      permissionFields.forEach(p => {
          setValue(p.id, value, { shouldValidate: true })
      });
    };
  
    if (watchedRole === 'Super Admin') {
      setAllPermissions(true);
    } else if (watchedRole === 'Admin') {
      setAllPermissions(true);
      setValue('canManageSiteSettings', false, {shouldValidate: true});
    } else if (watchedRole === 'User') {
      setAllPermissions(false); // Reset to false, let admin choose
      // Set specific defaults for 'User' role
      const userDefaultPerms: PermissionKey[] = ['canReadStudents'];
      userDefaultPerms.forEach(p => setValue(p, true, { shouldValidate: true }));
    }
  }, [watchedRole, setValue, isEditMode, isProfileEditMode]);
  
  const defaultPasswordForRole = useMemo(() => {
    if (appSettings) {
        if (watchedRole === 'User') return appSettings.defaultUserPassword || 'password123';
        if (watchedRole === 'Admin') return appSettings.defaultAdminPassword || 'password123';
        if (watchedRole === 'Super Admin') return appSettings.defaultSuperAdminPassword || 'password123';
    }
    return 'password123';
  }, [watchedRole, appSettings]);

  const onFormSubmit = async (data: UserFormData | ProfileEditFormData) => {
    let finalData = { ...data };
    const fileInput = fileInputRef.current;
    
    if (fileInput?.files?.[0]) {
        const dataUrl = await fileToDataUri(fileInput.files[0]);
        (finalData as any).profileImageURL = dataUrl;
    } else if (isProfileEditMode || isEditMode) {
        (finalData as any).profileImageURL = initialData?.profileImageURL || null;
    }
    
    onSubmit(finalData);
  };
  
  const isEditingSelf = currentUser?.id === initialData?.id;

  const renderPermissionSwitch = (id: PermissionKey, label: string) => {
     if (currentUser?.role !== 'Super Admin' && !currentUser?.[id]) {
      return null;
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
                  disabled={isEditingSelf}
                />
            </FormControl>
          </FormItem>
        )}
      />
    );
  };

  const permissionGroups = permissionFields.reduce((acc, perm) => {
    if (currentUser?.role !== 'Super Admin' && !currentUser?.[perm.id]) {
        return acc;
    }
    if (!acc[perm.section]) {
      acc[perm.section] = [];
    }
    acc[perm.section].push(perm);
    return acc;
  }, {} as Record<string, typeof permissionFields>);
  
  const ProfileEditFormContent = () => (
     <Card className="shadow-md border-border">
        <CardHeader>
            <CardTitle>User Details</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 flex flex-col items-center gap-4 pt-4">
                     <FormField
                        control={form.control}
                        name="profileImageURL"
                        render={() => (
                          <FormItem className="flex flex-col items-center">
                            <Avatar className="h-32 w-32">
                              <AvatarImage src={imagePreview || (initialData?.profileImageURL || `https://placehold.co/96x96.png?text=Avatar`)} alt="Avatar Preview" data-ai-hint="user avatar" />
                              <AvatarFallback>{initialData?.fullName?.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <FormControl>
                              <Input 
                                type="file" 
                                className="hidden" 
                                ref={fileInputRef} 
                                onChange={(e) => {
                                  if (e.target.files?.[0]) {
                                    const previewUrl = URL.createObjectURL(e.target.files[0]);
                                    setImagePreview(previewUrl);
                                  }
                                }}
                                accept="image/*"
                              />
                            </FormControl>
                            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => fileInputRef.current?.click()}>
                              <Upload className="mr-2 h-4 w-4" /> Upload Image
                            </Button>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                </div>
                 <div className="md:col-span-2 space-y-6">
                    {initialData?.userId && (
                        <FormItem>
                            <FormLabel>User ID</FormLabel>
                            <FormControl><Input value={initialData.userId} readOnly className="bg-muted/50" /></FormControl>
                            <FormDescription>This ID is system-generated and cannot be changed.</FormDescription>
                        </FormItem>
                    )}
                    <FormField control={form.control} name="fullName" render={({ field }) => (
                        <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="e.g., Jane Smith" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                     {initialData?.email && (
                        <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl><Input type="email" value={initialData.email} readOnly className={'bg-muted/50'}/></FormControl>
                        </FormItem>
                     )}
                     <FormField control={form.control} name="position" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Position</FormLabel>
                            <FormControl><Input placeholder="e.g., Math Teacher" {...field} readOnly className="bg-muted/50"/></FormControl>
                        </FormItem>
                    )} />
                </div>
            </div>
        </CardContent>
    </Card>
  );

  return (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-0">
            {isProfileEditMode ? (
                <ProfileEditFormContent />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    {/* Left Column */}
                    <div className="space-y-6">
                        <Card className="shadow-md border-border">
                            <CardHeader>
                                <CardTitle>User Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {initialData?.userId && (
                                    <FormItem>
                                    <FormLabel>User ID</FormLabel>
                                    <FormControl><Input value={initialData.userId} readOnly className="bg-muted/50" /></FormControl>
                                    <FormDescription>This ID is system-generated and cannot be changed.</FormDescription>
                                    </FormItem>
                                )}
                                <FormField control={form.control} name="fullName" render={({ field }) => (
                                    <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="e.g., Jane Smith" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="email" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email Address</FormLabel>
                                    <FormControl><Input type="email" placeholder="e.g., jane.smith@example.com" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )} />
                                <FormField control={form.control} name="position" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Position</FormLabel>
                                    <FormControl><Input placeholder="e.g., Kitchen Manager" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )} />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <FormField control={form.control} name="role" render={({ field }) => (
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
                                    <FormField control={form.control} name="status" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Status</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value} disabled={isEditingSelf}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select a status" /></SelectTrigger></FormControl>
                                        <SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="Inactive">Inactive</SelectItem></SelectContent>
                                        </Select>
                                        <FormDescription>{isEditingSelf ? "You cannot change your own status." : "The user's status."}</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                    )} />
                                </div>
                            </CardContent>
                        </Card>

                        {!isEditMode && (
                            <Card className="shadow-md border-border">
                                <CardHeader>
                                <CardTitle className="flex items-center gap-2"><KeyRound />Set Initial Password</CardTitle>
                                <CardDescription>
                                    You can set a custom password or use the system default.
                                </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                <FormField control={form.control} name="password" render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                        <Input 
                                            type="text"
                                            {...field}
                                            placeholder="Leave blank to use default"
                                            defaultValue={defaultPasswordForRole}
                                        />
                                    </FormControl>
                                    <FormDescription>Leave this blank to use the default password for this role ({defaultPasswordForRole}).</FormDescription>
                                    <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField
                                    control={form.control}
                                    name="passwordChangeRequired"
                                    render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                        <div className="space-y-0.5">
                                            <FormLabel>Force password change on next login</FormLabel>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                    )}
                                />
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Right Column: Permissions */}
                    <div className="space-y-6">
                        <Card className="shadow-md border-border">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><ShieldCheck /> User Permissions</CardTitle>
                                <CardDescription>
                                  {isEditingSelf ? "Your permissions." : "Assign permissions for this user."} 
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                            {Object.entries(permissionGroups).map(([section, perms]) => {
                                if (perms.length === 0) return null;

                                return (
                                <div key={section} className="mb-6 last:mb-0">
                                <h3 className="font-semibold text-lg text-primary mb-2">{section}</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                                    {perms.map(p => renderPermissionSwitch(p.id, p.label))}
                                    </div>
                                    {section !== 'Administration' && <Separator className="mt-6"/>}
                                </div>
                                )
                            })}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            <div className="flex justify-end pt-4">
              <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
                  {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</>) : (submitButtonText)}
              </Button>
            </div>
        </form>
    </Form>
  );
}
