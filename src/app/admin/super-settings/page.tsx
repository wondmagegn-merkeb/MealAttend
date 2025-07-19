
"use client";

import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Palette, Save, Settings, Home, Users, Upload, KeyRound, CreditCard, UserPlus, ListOrdered, CaseSensitive, LayoutGrid } from "lucide-react";
import type { AppSettings, Student } from "@/types";
import { cn } from "@/lib/utils";
import { useAppSettings } from "@/hooks/useAppSettings";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from 'next/link';
import { StudentIdCard } from "@/components/admin/students/StudentIdCard";

const themes = [
  { name: "default", label: "Default", primary: "hsl(207 90% 54%)", accent: "hsl(174 100% 29%)", bg: "hsl(0 0% 96%)" },
  { name: "forest", label: "Forest", primary: "hsl(142 76% 36%)", accent: "hsl(158 29% 52%)", bg: "hsl(120 10% 96%)" },
  { name: "ocean", label: "Ocean", primary: "hsl(222 84% 50%)", accent: "hsl(187 100% 42%)", bg: "hsl(210 20% 97%)" },
  { name: "sunset", label: "Sunset", primary: "hsl(24 96% 53%)", accent: "hsl(45 93% 47%)", bg: "hsl(30 50% 97%)" },
  { name: "rose", label: "Rose", primary: "hsl(346 77% 49%)", accent: "hsl(240 5% 65%)", bg: "hsl(330 20% 97%)" },
];

const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

const fetchSettings = async (): Promise<AppSettings> => {
  const token = localStorage.getItem('mealAttendAuthToken_v1');
  const res = await fetch('/api/settings',{
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json();
};

const updateSettings = async (data: Partial<AppSettings>): Promise<AppSettings> => {
  const token = localStorage.getItem('mealAttendAuthToken_v1');
  const res = await fetch('/api/settings', {
    method: 'PUT', // HTTP method
    headers: {
      'Content-Type': 'application/json',  // Declares that the body content is JSON
      'Authorization': `Bearer ${token}`   // Sends a bearer token for authorization
    },
    body: JSON.stringify(data), // Converts JS object to JSON string for sending in request body
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Failed to update settings');
  }
  return res.json();
};


// --- Form Schemas ---
const brandingSchema = z.object({
  siteName: z.string().min(1, "Site Name is required."),
  companyLogoUrl: z.string().optional().nullable(),
});
const idCardSchema = z.object({
  idPrefix: z.string().min(1, "ID Prefix is required.").max(5, "Prefix cannot exceed 5 characters."),
  schoolName: z.string().min(1, "School Name is required."),
  idCardTitle: z.string().min(1, "ID Card Title is required."),
  idCardLogoUrl: z.string().optional().nullable(),
});
const homepageSchema = z.object({
  homepageSubtitle: z.string().min(1, "Homepage subtitle is required."),
  showHomepage: z.boolean(),
  showTeamSection: z.boolean(),
  showFeaturesSection: z.boolean(),
});
const passwordSchema = z.object({
  defaultUserPassword: z.string().min(6, "Password must be at least 6 characters.").optional().or(z.literal('')),
  defaultAdminPassword: z.string().min(6, "Password must be at least 6 characters.").optional().or(z.literal('')),
  defaultSuperAdminPassword: z.string().min(6, "Password must be at least 6 characters.").optional().or(z.literal('')),
});
const themeSchema = z.object({
  colorTheme: z.string().min(1, "Color Theme is required."),
});

const sampleStudent: Student = {
    id: 'stu_sample',
    studentId: 'ADERA/STU/2024/00000',
    name: 'Jane Doe',
    gender: 'Female',
    classGrade: '12A',
    profileImageURL: `https://placehold.co/100x100.png`,
    qrCodeData: 'sample_qr_code_for_preview',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdById: 'user_super_admin'
};


export default function SuperAdminSettingsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { settings, setSettings: setGlobalSettings } = useAppSettings();

  const { data: fetchedSettings, isLoading: isLoadingSettings, error } = useQuery<AppSettings>({
    queryKey: ['appSettings'],
    queryFn: fetchSettings,
  });

  const mutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: (updatedData, variables) => {
      queryClient.setQueryData(['appSettings'], updatedData);
      setGlobalSettings(updatedData);
      toast({ title: "Settings Updated", description: "Your changes have been saved." });
      if ('colorTheme' in variables) {
          toast({ title: "Theme Changed", description: "Page will now reload to apply theme changes." });
          setTimeout(() => window.location.reload(), 1500);
      }
    },
    onError: (error: Error) => {
      toast({ title: "Save Failed", description: error.message, variant: "destructive" });
    },
  });
  
  const brandingForm = useForm<z.infer<typeof brandingSchema>>({
    resolver: zodResolver(brandingSchema),
    defaultValues: { siteName: "", companyLogoUrl: "" }
  });
  const idCardForm = useForm<z.infer<typeof idCardSchema>>({
    resolver: zodResolver(idCardSchema),
    defaultValues: { idPrefix: "", schoolName: "", idCardTitle: "", idCardLogoUrl: "" }
  });
  const homepageForm = useForm<z.infer<typeof homepageSchema>>({
    resolver: zodResolver(homepageSchema),
    defaultValues: { homepageSubtitle: "", showHomepage: true, showTeamSection: true, showFeaturesSection: true }
  });
  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { defaultUserPassword: "", defaultAdminPassword: "", defaultSuperAdminPassword: "" }
  });
  const themeForm = useForm<z.infer<typeof themeSchema>>({
    resolver: zodResolver(themeSchema),
    defaultValues: { colorTheme: "default" }
  });

  const [companyLogoPreview, setCompanyLogoPreview] = useState<string | null>(null);
  const [idCardLogoPreview, setIdCardLogoPreview] = useState<string | null>(null);
  
  const watchedIdCardValues = idCardForm.watch();

  useEffect(() => {
    if (fetchedSettings) {
      brandingForm.reset({ siteName: fetchedSettings.siteName, companyLogoUrl: fetchedSettings.companyLogoUrl });
      idCardForm.reset({ idPrefix: fetchedSettings.idPrefix, schoolName: fetchedSettings.schoolName, idCardTitle: fetchedSettings.idCardTitle, idCardLogoUrl: fetchedSettings.idCardLogoUrl });
      homepageForm.reset({ homepageSubtitle: fetchedSettings.homepageSubtitle, showHomepage: fetchedSettings.showHomepage, showTeamSection: fetchedSettings.showTeamSection, showFeaturesSection: fetchedSettings.showFeaturesSection });
      passwordForm.reset({ defaultUserPassword: "", defaultAdminPassword: "", defaultSuperAdminPassword: ""});
      themeForm.reset({ colorTheme: fetchedSettings.colorTheme });
      setCompanyLogoPreview(fetchedSettings.companyLogoUrl);
      setIdCardLogoPreview(fetchedSettings.idCardLogoUrl);
    }
  }, [fetchedSettings, brandingForm, idCardForm, homepageForm, passwordForm, themeForm]);

  const onBrandingSubmit = async (data: z.infer<typeof brandingSchema>) => {
    let logoDataUrl = brandingForm.getValues('companyLogoUrl');
    const fileInput = (document.getElementById('company-logo-upload') as HTMLInputElement);
    const file = fileInput?.files?.[0];
    
    if (file) {
      toast({ title: "Processing logo...", description: "Please wait." });
      logoDataUrl = await fileToDataUri(file);
    }
    mutation.mutate({ ...data, companyLogoUrl: logoDataUrl });
  };
  
  const onIdCardSubmit = async (data: z.infer<typeof idCardSchema>) => {
    let logoDataUrl = idCardForm.getValues('idCardLogoUrl');
    const fileInput = (document.getElementById('id-card-logo-upload') as HTMLInputElement);
    const file = fileInput?.files?.[0];

    if (file) {
      toast({ title: "Processing logo...", description: "Please wait." });
      logoDataUrl = await fileToDataUri(file);
    }
    mutation.mutate({ ...data, idCardLogoUrl: logoDataUrl });
  };

  const onHomepageSubmit = (data: z.infer<typeof homepageSchema>) => mutation.mutate(data);
  const onPasswordSubmit = (data: z.infer<typeof passwordSchema>) => {
      const dataToSubmit = {
          ...(data.defaultUserPassword && { defaultUserPassword: data.defaultUserPassword }),
          ...(data.defaultAdminPassword && { defaultAdminPassword: data.defaultAdminPassword }),
          ...(data.defaultSuperAdminPassword && { defaultSuperAdminPassword: data.defaultSuperAdminPassword }),
      };
      if (Object.keys(dataToSubmit).length > 0) {
        mutation.mutate(dataToSubmit);
      } else {
        toast({ title: "No Changes", description: "No new passwords were entered." });
      }
  };
  const onThemeSubmit = (data: z.infer<typeof themeSchema>) => mutation.mutate(data);
  

  if (isLoadingSettings) return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /> <span className="ml-2">Loading Settings...</span></div>;
  if (error) return <div className="text-destructive">Error loading settings: {(error as Error).message}</div>;

  return (
    <div className="space-y-6">
       <div>
          <h2 className="text-3xl font-semibold tracking-tight text-primary flex items-center">
            <Settings className="mr-3 h-8 w-8" /> Super Admin Settings
          </h2>
          <p className="text-muted-foreground">Manage global application settings. Changes here affect all users.</p>
        </div>

      <div className="grid grid-cols-1 gap-6">

        {/* Branding Card */}
        <Form {...brandingForm}>
          <form onSubmit={brandingForm.handleSubmit(onBrandingSubmit)}>
            <Card>
              <CardHeader><CardTitle>General Branding</CardTitle><CardDescription>Customize names and logos.</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                <FormField control={brandingForm.control} name="siteName" render={({ field }) => (
                  <FormItem><FormLabel>Site Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={brandingForm.control} name="companyLogoUrl" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Logo</FormLabel>
                    <div className="flex items-center gap-4 mt-2">
                       <Avatar className="h-24 w-24 rounded-md">
                        <AvatarImage src={companyLogoPreview || `https://placehold.co/96x96.png?text=Logo`} alt="Company Logo" className="object-contain" data-ai-hint="company logo" />
                        <AvatarFallback>LOGO</AvatarFallback>
                      </Avatar>
                      <Input id="company-logo-upload" type="file" className="hidden" onChange={(e) => { 
                          if (e.target.files?.[0]) {
                            const newUrl = URL.createObjectURL(e.target.files[0]);
                            setCompanyLogoPreview(newUrl);
                            brandingForm.setValue('companyLogoUrl', newUrl);
                          }
                       }} accept="image/*" />
                      <Button type="button" variant="outline" onClick={() => document.getElementById('company-logo-upload')?.click()}><Upload className="mr-2 h-4 w-4" /> Change</Button>
                    </div>
                  </FormItem>
                )} />
              </CardContent>
              <CardFooter className="justify-end"><Button type="submit" disabled={mutation.isPending && brandingForm.formState.isSubmitting}><Save className="mr-2 h-4 w-4" /> Update Branding</Button></CardFooter>
            </Card>
          </form>
        </Form>
        
        {/* ID Card Card */}
        <Form {...idCardForm}>
          <form onSubmit={idCardForm.handleSubmit(onIdCardSubmit)}>
            <Card>
              <CardHeader><CardTitle>ID Card Settings</CardTitle><CardDescription>Customize generated ID cards.</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                 <FormField control={idCardForm.control} name="idPrefix" render={({ field }) => (
                  <FormItem><FormLabel>ID Prefix</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={idCardForm.control} name="schoolName" render={({ field }) => (
                  <FormItem><FormLabel>School/Organization Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={idCardForm.control} name="idCardTitle" render={({ field }) => (
                  <FormItem><FormLabel>ID Card Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="space-y-0">
                    <Label>ID Card Logo &amp; Live Preview</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-0 items-center">
                        <FormField control={idCardForm.control} name="idCardLogoUrl" render={({ field }) => (
                        <FormItem>
                            <div className="flex items-center gap-4 mt-2">
                            <Avatar className="h-24 w-24 rounded-md">
                                <AvatarImage src={idCardLogoPreview || `https://placehold.co/96x96.png?text=Logo`} alt="ID Card Logo" className="object-contain" data-ai-hint="school crest" />
                                <AvatarFallback>LOGO</AvatarFallback>
                            </Avatar>
                            <div>
                                <Input id="id-card-logo-upload" type="file" className="hidden" onChange={(e) => { 
                                    if (e.target.files?.[0]) {
                                        const newUrl = URL.createObjectURL(e.target.files[0]);
                                        setIdCardLogoPreview(newUrl);
                                        idCardForm.setValue('idCardLogoUrl', newUrl);
                                    }
                                }} accept="image/*" />
                                <Button type="button" variant="outline" onClick={() => document.getElementById('id-card-logo-upload')?.click()}><Upload className="mr-2 h-4 w-4" /> Change</Button>
                                <p className="text-xs text-muted-foreground mt-2">Upload a new logo.</p>
                            </div>
                            </div>
                        </FormItem>
                        )} />
                        
                        <div className="flex justify-center items-center p-2 bg-muted/50 rounded-lg border scale-90 md:scale-100">
                            <StudentIdCard 
                                student={sampleStudent} 
                                previewSettings={{
                                    ...watchedIdCardValues,
                                    idCardLogoUrl: idCardLogoPreview || watchedIdCardValues.idCardLogoUrl
                                }}
                            />
                        </div>
                    </div>
                </div>

              </CardContent>
              <CardFooter className="justify-end"><Button type="submit" disabled={mutation.isPending && idCardForm.formState.isSubmitting}><Save className="mr-2 h-4 w-4" /> Update ID Cards</Button></CardFooter>
            </Card>
          </form>
        </Form>
        
        {/* Homepage Card */}
         <Form {...homepageForm}>
            <form onSubmit={homepageForm.handleSubmit(onHomepageSubmit)}>
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Home /> Homepage Content</CardTitle><CardDescription>Control public homepage visibility and content.</CardDescription></CardHeader>
                    <CardContent className="space-y-4">
                        <FormField control={homepageForm.control} name="homepageSubtitle" render={({ field }) => (
                            <FormItem><FormLabel>Homepage Subtitle</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={homepageForm.control} name="showHomepage" render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3"><div className="space-y-0.5"><FormLabel>Show Public Homepage</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                        )} />
                        <FormField control={homepageForm.control} name="showFeaturesSection" render={({ field }) => (
                           <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3"><div className="space-y-0.5"><FormLabel>Show Features Section</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                        )} />
                         <FormField control={homepageForm.control} name="showTeamSection" render={({ field }) => (
                           <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3"><div className="space-y-0.5"><FormLabel>Show Team Section</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                        )} />
                        <div className="grid grid-cols-2 gap-2 pt-2">
                             <Link href="/admin/super-settings/features" passHref legacyBehavior>
                                <Button variant="outline" className="w-full">
                                    <LayoutGrid className="mr-2 h-4 w-4" /> Manage Features
                                </Button>
                            </Link>
                            <Link href="/admin/super-settings/team" passHref legacyBehavior>
                                <Button variant="outline" className="w-full">
                                    <Users className="mr-2 h-4 w-4" /> Manage Team Members
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                    <CardFooter className="justify-end"><Button type="submit" disabled={mutation.isPending && homepageForm.formState.isSubmitting}><Save className="mr-2 h-4 w-4" /> Update Homepage</Button></CardFooter>
                </Card>
            </form>
        </Form>

         {/* Passwords Card */}
        <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
                <Card>
                    <CardHeader><CardTitle>Default Passwords</CardTitle><CardDescription>Set initial password for new users.</CardDescription></CardHeader>
                    <CardContent className="space-y-6">
                         <FormField control={passwordForm.control} name="defaultSuperAdminPassword" render={({ field }) => (
                            <FormItem><FormLabel>New Super Admin Users</FormLabel><FormControl><Input type="password" {...field} placeholder="Enter new default" /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={passwordForm.control} name="defaultAdminPassword" render={({ field }) => (
                            <FormItem><FormLabel>New Admin Users</FormLabel><FormControl><Input type="password" {...field} placeholder="Enter new default" /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={passwordForm.control} name="defaultUserPassword" render={({ field }) => (
                            <FormItem><FormLabel>New Standard Users</FormLabel><FormControl><Input type="password" {...field} placeholder="Enter new default" /></FormControl><FormMessage /></FormItem>
                        )} />
                    </CardContent>
                    <CardFooter className="justify-end"><Button type="submit" disabled={mutation.isPending && passwordForm.formState.isSubmitting}><Save className="mr-2 h-4 w-4" /> Update Passwords</Button></CardFooter>
                </Card>
            </form>
        </Form>

      </div>
      
      {/* Color Theme Card (Full Width) */}
      <Form {...themeForm}>
          <form onSubmit={themeForm.handleSubmit(onThemeSubmit)}>
            <Card>
              <CardHeader><CardTitle>Color Theme</CardTitle><CardDescription>Select a color palette for the application.</CardDescription></CardHeader>
              <CardContent>
                <FormField control={themeForm.control} name="colorTheme" render={({ field }) => (
                  <FormItem>
                      <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                          {themes.map((theme) => (
                             <FormItem key={theme.name}>
                                 <FormControl>
                                  <RadioGroupItem value={theme.name} id={theme.name} className="sr-only" />
                                 </FormControl>
                                 <Label htmlFor={theme.name} className={cn("flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer", field.value === theme.name && "border-primary")}>
                                  <span className="mb-3 font-semibold">{theme.label}</span>
                                  <div className="flex gap-2">
                                      <div className="w-6 h-6 rounded-full" style={{ backgroundColor: theme.primary }}></div>
                                      <div className="w-6 h-6 rounded-full" style={{ backgroundColor: theme.accent }}></div>
                                      <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: theme.bg }}></div>
                                  </div>
                                 </Label>
                             </FormItem>
                          ))}
                      </RadioGroup>
                  </FormItem>
                )} />
              </CardContent>
              <CardFooter className="justify-end"><Button type="submit" disabled={mutation.isPending && themeForm.formState.isSubmitting}><Save className="mr-2 h-4 w-4" /> Update Theme</Button></CardFooter>
            </Card>
          </form>
        </Form>
    </div>
  );
}
