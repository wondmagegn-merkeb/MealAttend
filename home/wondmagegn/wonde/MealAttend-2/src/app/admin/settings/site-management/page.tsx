
"use client";

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, MonitorCog, Save, Image as ImageIcon, Palette, Settings, Building, KeyRound, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import type { SiteSettings } from '@prisma/client';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { themes } from '@/lib/themes';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const siteSettingsSchema = z.object({
  siteName: z.string().min(1, { message: 'Site Name is required.' }),
  headerContent: z.string().optional(),
  idPrefix: z.string().min(1, { message: 'ID Prefix is required.' }).regex(/^[A-Z0-9_]+$/, 'Prefix can only contain uppercase letters, numbers, and underscores.'),
  theme: z.string(),
  showFeaturesSection: z.boolean(),
  showTeamSection: z.boolean(),
  addisSparkLogoUrl: z.string().url({ message: 'Please enter a valid URL.' }).or(z.literal('')),
  leoMaxwellPhotoUrl: z.string().url({ message: 'Please enter a valid URL.' }).or(z.literal('')),
  owenGrantPhotoUrl: z.string().url({ message: 'Please enter a valid URL.' }).or(z.literal('')),
  eleanorVancePhotoUrl: z.string().url({ message: 'Please enter a valid URL.' }).or(z.literal('')),
  sofiaReyesPhotoUrl: z.string().url({ message: 'Please enter a valid URL.' }).or(z.literal('')),
  calebFinnPhotoUrl: z.string().url({ message: 'Please enter a valid URL.' }).or(z.literal('')),
  defaultSuperAdminPassword: z.string().optional(),
  defaultAdminPassword: z.string().optional(),
  defaultUserPassword: z.string().optional(),
  idCardLogoUrl: z.string().url({ message: 'Please enter a valid URL for the ID card logo.' }).or(z.literal('')),
  idCardSchoolName: z.string().optional(),
  idCardTitle: z.string().optional(),
});

type SiteSettingsFormData = z.infer<typeof siteSettingsSchema>;

const fetchSiteSettings = async (): Promise<SiteSettings> => {
  const response = await fetch('/api/settings/site-management');
  if (!response.ok) {
    throw new Error('Failed to fetch site settings');
  }
  return response.json();
};

const updateSiteSettings = async (data: SiteSettingsFormData): Promise<SiteSettings> => {
  const response = await fetch('/api/settings/site-management', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to update site settings');
  }
  return response.json();
};

export default function SiteManagementPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: settings, isLoading: isLoadingSettings } = useQuery<SiteSettings>({
    queryKey: ['siteSettings'],
    queryFn: fetchSiteSettings,
  });

  const form = useForm<SiteSettingsFormData>({
    resolver: zodResolver(siteSettingsSchema),
    defaultValues: {
      siteName: 'MealAttend',
      headerContent: 'MealAttend Information Center',
      idPrefix: 'ADERA',
      theme: 'default',
      showFeaturesSection: true,
      showTeamSection: true,
      addisSparkLogoUrl: '',
      leoMaxwellPhotoUrl: '',
      owenGrantPhotoUrl: '',
      eleanorVancePhotoUrl: '',
      sofiaReyesPhotoUrl: '',
      calebFinnPhotoUrl: '',
      defaultSuperAdminPassword: '',
      defaultAdminPassword: '',
      defaultUserPassword: '',
      idCardLogoUrl: '',
      idCardSchoolName: '',
      idCardTitle: '',
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        ...settings,
        addisSparkLogoUrl: settings.addisSparkLogoUrl || '',
        leoMaxwellPhotoUrl: settings.leoMaxwellPhotoUrl || '',
        owenGrantPhotoUrl: settings.owenGrantPhotoUrl || '',
        eleanorVancePhotoUrl: settings.eleanorVancePhotoUrl || '',
        sofiaReyesPhotoUrl: settings.sofiaReyesPhotoUrl || '',
        calebFinnPhotoUrl: settings.calebFinnPhotoUrl || '',
        defaultSuperAdminPassword: settings.defaultSuperAdminPassword || '',
        defaultAdminPassword: settings.defaultAdminPassword || '',
        defaultUserPassword: settings.defaultUserPassword || '',
        idCardLogoUrl: settings.idCardLogoUrl || '',
        idCardSchoolName: settings.idCardSchoolName || '',
        idCardTitle: settings.idCardTitle || '',
      });
    }
  }, [settings, form]);

  const mutation = useMutation({
    mutationFn: updateSiteSettings,
    onSuccess: (updatedData) => {
      queryClient.setQueryData(['siteSettings'], updatedData);
      toast({
        title: 'Settings Saved',
        description: 'Your site settings have been successfully updated. Changes may require a page refresh to fully apply.',
      });
       // Force a reload to apply theme and name changes globally
      window.location.reload();
    },
    onError: (error: Error) => {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: SiteSettingsFormData) => {
    mutation.mutate(data);
  };

  if (isLoadingSettings) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Loading Site Settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <MonitorCog className="h-8 w-8 text-primary" />
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Site Management</h2>
          <p className="text-muted-foreground">Control the branding, content, and appearance of the application.</p>
        </div>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
         <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5"/> General Settings</CardTitle>
                <CardDescription>Manage the core branding and identification of your application.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <FormField control={form.control} name="siteName" render={({ field }) => (<FormItem><FormLabel>Site Name</FormLabel><FormControl><Input placeholder="e.g., MealAttend" {...field} /></FormControl><FormDescription>This name appears in the browser tab and throughout the application.</FormDescription><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="headerContent" render={({ field }) => (<FormItem><FormLabel>Homepage Header Content</FormLabel><FormControl><Textarea placeholder="e.g., MealAttend Information Center" {...field} /></FormControl><FormDescription>The main title text displayed on the public homepage.</FormDescription><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="idPrefix" render={({ field }) => (<FormItem><FormLabel>ID Prefix</FormLabel><FormControl><Input placeholder="e.g., ADERA" {...field} readOnly className="bg-muted/50" /></FormControl><FormDescription>The prefix for all auto-generated IDs. This is a critical setting and cannot be changed.</FormDescription><FormMessage /></FormItem>)} />
            </CardContent>
          </Card>
          
           <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" /> Default Passwords</CardTitle>
              <CardDescription>Set the initial passwords for newly created users.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <FormField control={form.control} name="defaultSuperAdminPassword" render={({ field }) => (<FormItem><FormLabel>Default Super Admin Password</FormLabel><FormControl><Input type="password" placeholder="Leave blank for system default" {...field} /></FormControl><FormDescription>Password for newly created Super Admins.</FormDescription><FormMessage /></FormItem>)} />
                 <FormField control={form.control} name="defaultAdminPassword" render={({ field }) => (<FormItem><FormLabel>Default Admin Password</FormLabel><FormControl><Input type="password" placeholder="Leave blank for system default" {...field} /></FormControl><FormDescription>Password for newly created Admins.</FormDescription><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="defaultUserPassword" render={({ field }) => (<FormItem><FormLabel>Default User Password</FormLabel><FormControl><Input type="password" placeholder="Leave blank for system default" {...field} /></FormControl><FormDescription>Password for newly created standard Users.</FormDescription><FormMessage /></FormItem>)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5" /> Theme & Appearance</CardTitle>
              <CardDescription>Customize the look and feel of the entire application.</CardDescription>
            </CardHeader>
            <CardContent>
                 <FormField
                    control={form.control}
                    name="theme"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Color Theme</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-2 md:grid-cols-4 gap-4"
                          >
                            {themes.map((theme) => (
                                <FormItem key={theme.name} className="flex-1">
                                    <FormControl>
                                         <RadioGroupItem value={theme.name} id={theme.name} className="sr-only" />
                                    </FormControl>
                                    <Label htmlFor={theme.name} className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                                        <span style={{'--theme-primary': `hsl(${theme.primary})`} as React.CSSProperties} className="w-full h-8 rounded-md bg-[var(--theme-primary)] mb-2"></span>
                                        {theme.label}
                                    </Label>
                                </FormItem>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5"/> ID Card Customization</CardTitle>
              <CardDescription>Control the branding of the student ID cards.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <FormField control={form.control} name="idCardLogoUrl" render={({ field }) => (<FormItem><FormLabel>ID Card Logo URL</FormLabel><FormControl><Input placeholder="URL for the logo on ID cards..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="idCardSchoolName" render={({ field }) => (<FormItem><FormLabel>School/Institution Name</FormLabel><FormControl><Input placeholder="e.g., Wachemo University" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="idCardTitle" render={({ field }) => (<FormItem><FormLabel>ID Card Title</FormLabel><FormControl><Input placeholder="e.g., STUDENT ID" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </CardContent>
          </Card>


          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Building className="h-5 w-5"/> Homepage Content</CardTitle>
              <CardDescription>Control the sections and images displayed on the public homepage.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
               <h3 className="text-lg font-medium">Section Visibility</h3>
               <div className="space-y-4">
                 <FormField
                  control={form.control}
                  name="showFeaturesSection"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">System Features Section</FormLabel>
                        <FormDescription>Show or hide the section that lists the system's key features.</FormDescription>
                      </div>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="showTeamSection"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Our Team Section</FormLabel>
                        <FormDescription>Show or hide the section that introduces the development team.</FormDescription>
                      </div>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )}
                />
               </div>
              
              <Separator />
              <h3 className="text-lg font-medium">Image Management</h3>
               <FormField control={form.control} name="addisSparkLogoUrl" render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><ImageIcon className="h-4 w-4" /> AddisSpark Logo URL</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem>)} />
              
              <Separator />
              <h4 className="font-medium">Team Member Photos</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="leoMaxwellPhotoUrl" render={({ field }) => (<FormItem><FormLabel>Leo Maxwell</FormLabel><FormControl><Input placeholder="URL..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="owenGrantPhotoUrl" render={({ field }) => (<FormItem><FormLabel>Owen Grant</FormLabel><FormControl><Input placeholder="URL..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="eleanorVancePhotoUrl" render={({ field }) => (<FormItem><FormLabel>Eleanor Vance</FormLabel><FormControl><Input placeholder="URL..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="sofiaReyesPhotoUrl" render={({ field }) => (<FormItem><FormLabel>Sofia Reyes</FormLabel><FormControl><Input placeholder="URL..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="calebFinnPhotoUrl" render={({ field }) => (<FormItem><FormLabel>Caleb Finn</FormLabel><FormControl><Input placeholder="URL..." {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
