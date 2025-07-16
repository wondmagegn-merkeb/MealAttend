
"use client";

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, MonitorCog, Save, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import type { SiteSettings } from '@prisma/client';

const siteSettingsSchema = z.object({
  showFeaturesSection: z.boolean(),
  showTeamSection: z.boolean(),
  addisSparkLogoUrl: z.string().url({ message: 'Please enter a valid URL.' }),
  leoMaxwellPhotoUrl: z.string().url({ message: 'Please enter a valid URL.' }),
  owenGrantPhotoUrl: z.string().url({ message: 'Please enter a valid URL.' }),
  eleanorVancePhotoUrl: z.string().url({ message: 'Please enter a valid URL.' }),
  sofiaReyesPhotoUrl: z.string().url({ message: 'Please enter a valid URL.' }),
  calebFinnPhotoUrl: z.string().url({ message: 'Please enter a valid URL.' }),
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
      showFeaturesSection: true,
      showTeamSection: true,
      addisSparkLogoUrl: '',
      leoMaxwellPhotoUrl: '',
      owenGrantPhotoUrl: '',
      eleanorVancePhotoUrl: '',
      sofiaReyesPhotoUrl: '',
      calebFinnPhotoUrl: '',
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset(settings);
    }
  }, [settings, form]);

  const mutation = useMutation({
    mutationFn: updateSiteSettings,
    onSuccess: (updatedData) => {
      queryClient.setQueryData(['siteSettings'], updatedData);
      toast({
        title: 'Settings Saved',
        description: 'Your homepage settings have been successfully updated.',
      });
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
          <p className="text-muted-foreground">Control the content displayed on the public homepage.</p>
        </div>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Section Visibility</CardTitle>
              <CardDescription>Toggle which sections are visible on the homepage.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="showFeaturesSection"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">System Features Section</FormLabel>
                      <FormDescription>Show or hide the section that lists the system's key features.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
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
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Image Management</CardTitle>
              <CardDescription>Update the URLs for images displayed on the homepage.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="addisSparkLogoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><ImageIcon className="h-4 w-4" /> AddisSpark Logo URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/logo.png" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Separator />
              <h3 className="text-lg font-medium">Team Member Photos</h3>
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
