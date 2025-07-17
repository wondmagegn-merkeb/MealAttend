
"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Palette, Save, Settings, AlertTriangle } from "lucide-react";
import type { AppSettings } from "@prisma/client";
import { cn } from "@/lib/utils";
import { useAppSettings } from "@/hooks/useAppSettings";
import { Label } from "@/components/ui/label";

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
  colorTheme: z.string().min(1, "Color Theme is required."),
});

type SettingsFormData = z.infer<typeof settingsFormSchema>;

const fetchSettings = async (): Promise<AppSettings> => {
  const res = await fetch('/api/settings');
  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json();
};

const updateSettings = async (data: SettingsFormData): Promise<AppSettings> => {
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

  const { data: settings, isLoading: isLoadingSettings, error } = useQuery<AppSettings>({
    queryKey: ['appSettings'],
    queryFn: fetchSettings,
  });

  const mutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: (updatedData) => {
      toast({ title: "Settings Saved", description: "Your changes have been saved successfully." });
      queryClient.setQueryData(['appSettings'], updatedData);
      setGlobalSettings(updatedData); // Update context
      // Trigger a reload to apply CSS changes from the new theme class
      window.location.reload();
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
      colorTheme: "default",
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset(settings);
    }
  }, [settings, form]);

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
        <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Branding & Naming</CardTitle>
              <CardDescription>Customize names and identifiers used throughout the application.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="siteName" render={({ field }) => (
                <FormItem><FormLabel>Site Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="schoolName" render={({ field }) => (
                <FormItem><FormLabel>School Name (for ID Cards)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="idPrefix" render={({ field }) => (
                <FormItem><FormLabel>ID Prefix</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
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
