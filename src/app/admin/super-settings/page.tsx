
"use client";

import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Palette, Save, Settings, AlertTriangle, Home, Users, Upload, KeyRound, CreditCard } from "lucide-react";
import type { AppSettings } from "@prisma/client";
import { cn } from "@/lib/utils";
import { useAppSettings } from "@/hooks/useAppSettings";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const themes = [
  { name: "default", label: "Default", primary: "hsl(207 90% 54%)", accent: "hsl(174 100% 29%)", bg: "hsl(0 0% 96%)" },
  { name: "forest", label: "Forest", primary: "hsl(142 76% 36%)", accent: "hsl(158 29% 52%)", bg: "hsl(120 10% 96%)" },
  { name: "ocean", label: "Ocean", primary: "hsl(222 84% 50%)", accent: "hsl(187 100% 42%)", bg: "hsl(210 20% 97%)" },
  { name: "sunset", label: "Sunset", primary: "hsl(24 96% 53%)", accent: "hsl(45 93% 47%)", bg: "hsl(30 50% 97%)" },
  { name: "rose", label: "Rose", primary: "hsl(346 77% 49%)", accent: "hsl(240 5% 65%)", bg: "hsl(330 20% 97%)" },
];

const settingsFormSchema = z.object({
  siteName: z.string().min(1, "Site Name is required."),
  idPrefix: z.string().min(1, "ID Prefix is required.").max(5, "Prefix cannot exceed 5 characters."),
  schoolName: z.string().min(1, "School Name is required."),
  idCardTitle: z.string().min(1, "ID Card Title is required."),
  colorTheme: z.string().min(1, "Color Theme is required."),
  showHomepage: z.boolean().default(true),
  showTeamSection: z.boolean().default(true),
  companyLogoUrl: z.string().optional().nullable(),
  idCardLogoUrl: z.string().optional().nullable(),
  defaultUserPassword: z.string().min(6, "Password must be at least 6 characters.").optional().or(z.literal('')),
  defaultAdminPassword: z.string().min(6, "Password must be at least 6 characters.").optional().or(z.literal('')),
});

type SettingsFormData = z.infer<typeof settingsFormSchema>;

const fetchSettings = async (): Promise<AppSettings> => {
  const res = await fetch('/api/settings');
  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json();
};

const fileToDataUri = (file: File): Promise<string | null> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

const updateSettings = async (data: Partial<SettingsFormData>): Promise<AppSettings> => {
  const res = await fetch('/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Failed to update settings');
  }
  return res.json();
};

export default function SuperAdminSettingsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { setSettings: setGlobalSettings } = useAppSettings();
  const companyLogoInputRef = useRef<HTMLInputElement>(null);
  const idCardLogoInputRef = useRef<HTMLInputElement>(null);

  const [companyLogoPreview, setCompanyLogoPreview] = useState<string | null>(null);
  const [idCardLogoPreview, setIdCardLogoPreview] = useState<string | null>(null);
  
  const [selectedCompanyLogoFile, setSelectedCompanyLogoFile] = useState<File | null>(null);
  const [selectedIdCardLogoFile, setSelectedIdCardLogoFile] = useState<File | null>(null);

  const { data: settings, isLoading: isLoadingSettings, error } = useQuery<AppSettings>({
    queryKey: ['appSettings'],
    queryFn: fetchSettings,
  });

  const mutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: (updatedData) => {
      queryClient.setQueryData(['appSettings'], updatedData);
      setGlobalSettings(updatedData); // Update context
      toast({ title: "Settings Saved", description: "Your changes have been saved. Page will now reload to apply theme changes." });
      setTimeout(() => window.location.reload(), 1500);
    },
    onError: (error: Error) => {
      toast({ title: "Save Failed", description: error.message, variant: "destructive" });
    },
  });

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      siteName: "MealAttend",
      idPrefix: "ADERA",
      schoolName: "Tech University",
      idCardTitle: "STUDENT ID",
      colorTheme: "default",
      showHomepage: true,
      showTeamSection: true,
      companyLogoUrl: null,
      idCardLogoUrl: null,
      defaultUserPassword: "",
      defaultAdminPassword: "",
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        ...settings,
        defaultUserPassword: "",
        defaultAdminPassword: "",
      });
      setCompanyLogoPreview(settings.companyLogoUrl || null);
      setIdCardLogoPreview(settings.idCardLogoUrl || null);
    }
  }, [settings, form]);
  
  const handleImageChange = (
    event: React.ChangeEvent<HTMLInputElement>, 
    setFile: React.Dispatch<React.SetStateAction<File | null>>, 
    setPreview: React.Dispatch<React.SetStateAction<string | null>>,
    logoName: string
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 1 * 1024 * 1024) { 
        toast({ title: "Image Too Large", description: `Please select a ${logoName} smaller than 1MB.`, variant: "destructive" });
        return;
      }
      setFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const onFormSubmit = async (data: SettingsFormData) => {
    let finalCompanyLogoUrl = settings?.companyLogoUrl || null;
    let finalIdCardLogoUrl = settings?.idCardLogoUrl || null;

    if (selectedCompanyLogoFile) {
        try {
            toast({ title: "Processing company logo...", description: "Please wait." });
            finalCompanyLogoUrl = await fileToDataUri(selectedCompanyLogoFile);
        } catch (error) {
            toast({ title: "Logo Error", description: "Could not process the company logo.", variant: "destructive" });
            return; 
        }
    }

    if (selectedIdCardLogoFile) {
        try {
            toast({ title: "Processing ID card logo...", description: "Please wait." });
            finalIdCardLogoUrl = await fileToDataUri(selectedIdCardLogoFile);
        } catch (error) {
            toast({ title: "Logo Error", description: "Could not process the ID card logo.", variant: "destructive" });
            return; 
        }
    }
    
    const dataToSubmit: Partial<SettingsFormData> = { 
      ...data, 
      companyLogoUrl: finalCompanyLogoUrl,
      idCardLogoUrl: finalIdCardLogoUrl
    };
    if (!data.defaultUserPassword) delete dataToSubmit.defaultUserPassword;
    if (!data.defaultAdminPassword) delete dataToSubmit.defaultAdminPassword;
    
    mutation.mutate(dataToSubmit);
  };

  if (isLoadingSettings) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /> <span className="ml-2">Loading Settings...</span></div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-destructive">
        <AlertTriangle className="h-10 w-10 mb-2" />
        <p className="font-semibold">Failed to load settings</p>
        <p className="text-sm">{(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
       <div>
          <h2 className="text-3xl font-semibold tracking-tight text-primary flex items-center">
            <Settings className="mr-3 h-8 w-8" /> Super Admin Settings
          </h2>
          <p className="text-muted-foreground">Manage global application settings. Changes here affect all users.</p>
        </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>General Branding & Naming</CardTitle>
              <CardDescription>Customize names and identifiers used throughout the application.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <FormField control={form.control} name="siteName" render={({ field }) => (
                    <FormItem><FormLabel>Site Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="idPrefix" render={({ field }) => (
                    <FormItem><FormLabel>ID Prefix</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
              </div>
              <div>
                  <FormLabel>Company Logo (for Homepage)</FormLabel>
                   <div className="flex items-center gap-4 mt-2">
                    <Avatar className="h-24 w-24 rounded-md">
                      <AvatarImage src={companyLogoPreview || `https://placehold.co/96x96.png?text=Logo`} alt="Company Logo" className="object-contain" data-ai-hint="company logo" />
                      <AvatarFallback>LOGO</AvatarFallback>
                    </Avatar>
                    <Input id="company-logo-upload" type="file" className="hidden" ref={companyLogoInputRef} onChange={(e) => handleImageChange(e, setSelectedCompanyLogoFile, setCompanyLogoPreview, "company logo")} accept="image/*" disabled={mutation.isPending}/>
                    <Button type="button" variant="outline" onClick={() => companyLogoInputRef.current?.click()} disabled={mutation.isPending}>
                      <Upload className="mr-2 h-4 w-4" />
                      {selectedCompanyLogoFile ? 'Change Logo' : 'Upload Logo'}
                    </Button>
                  </div>
                   <FormDescription className="mt-2">
                    {selectedCompanyLogoFile ? `Selected: ${selectedCompanyLogoFile.name}` : "Upload a logo (max 1MB)."}
                  </FormDescription>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard /> ID Card Settings</CardTitle><CardDescription>Customize the content and appearance of generated ID cards.</CardDescription></CardHeader>
            <CardContent className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField control={form.control} name="schoolName" render={({ field }) => (
                    <FormItem><FormLabel>School/Organization Name</FormLabel><FormControl><Input {...field} /></FormControl><FormDescription>This name appears at the top of the ID card.</FormDescription><FormMessage /></FormItem>
                  )} />
                   <FormField control={form.control} name="idCardTitle" render={({ field }) => (
                    <FormItem><FormLabel>ID Card Title</FormLabel><FormControl><Input {...field} /></FormControl><FormDescription>E.g., "STUDENT ID", "STAFF ID".</FormDescription><FormMessage /></FormItem>
                  )} />
              </div>
               <div>
                  <FormLabel>ID Card Logo</FormLabel>
                   <div className="flex items-center gap-4 mt-2">
                    <Avatar className="h-24 w-24 rounded-md">
                      <AvatarImage src={idCardLogoPreview || `https://placehold.co/96x96.png?text=Logo`} alt="ID Card Logo" className="object-contain" data-ai-hint="school crest" />
                      <AvatarFallback>LOGO</AvatarFallback>
                    </Avatar>
                    <Input id="id-card-logo-upload" type="file" className="hidden" ref={idCardLogoInputRef} onChange={(e) => handleImageChange(e, setSelectedIdCardLogoFile, setIdCardLogoPreview, "ID card logo")} accept="image/*" disabled={mutation.isPending}/>
                    <Button type="button" variant="outline" onClick={() => idCardLogoInputRef.current?.click()} disabled={mutation.isPending}>
                      <Upload className="mr-2 h-4 w-4" />
                      {selectedIdCardLogoFile ? 'Change Logo' : 'Upload Logo'}
                    </Button>
                  </div>
                   <FormDescription className="mt-2">
                    {selectedIdCardLogoFile ? `Selected: ${selectedIdCardLogoFile.name}` : "Upload a logo (max 1MB) for the ID card."}
                  </FormDescription>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Home /> Homepage Settings</CardTitle>
                <CardDescription>Control the visibility of the public homepage and its sections.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <FormField control={form.control} name="showHomepage" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Show Public Homepage</FormLabel>
                    <FormDescription>If disabled, the root URL will redirect to the login page.</FormDescription>
                  </div>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
               <FormField control={form.control} name="showTeamSection" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Show "Our Team" Section</FormLabel>
                    <FormDescription>Control the visibility of the team section on the homepage.</FormDescription>
                  </div>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
            </CardContent>
          </Card>
          
          <Card>
             <CardHeader>
                <CardTitle className="flex items-center gap-2"><KeyRound /> Default Passwords</CardTitle>
                <CardDescription>Set the initial password for newly created users. Leave blank to keep the current password.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="defaultAdminPassword" render={({ field }) => (
                    <FormItem>
                        <FormLabel>New Admin Users</FormLabel>
                        <FormControl><Input type="password" {...field} placeholder="Enter new default password" /></FormControl>
                        <FormDescription>Default for users with the 'Admin' role.</FormDescription>
                        <FormMessage />
                    </FormItem>
                )} />
                 <FormField control={form.control} name="defaultUserPassword" render={({ field }) => (
                    <FormItem>
                        <FormLabel>New Standard Users</FormLabel>
                        <FormControl><Input type="password" {...field} placeholder="Enter new default password" /></FormControl>
                        <FormDescription>Default for users with the 'User' role.</FormDescription>
                        <FormMessage />
                    </FormItem>
                )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Palette/> Color Theme</CardTitle>
              <CardDescription>Select a color palette for the entire application. Changes will require a page reload.</CardDescription>
            </CardHeader>
            <CardContent>
               <FormField control={form.control} name="colorTheme" render={({ field }) => (
                <FormItem>
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save All Settings
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
