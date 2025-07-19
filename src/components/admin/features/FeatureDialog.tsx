
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import type { HomepageFeature } from "@prisma/client";

const featureSchema = z.object({
  icon: z.string().min(1, "Icon name is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  isVisible: z.boolean().default(true),
});
type FeatureFormData = z.infer<typeof featureSchema>;

interface FeatureDialogProps {
  isOpen: boolean;
  onClose: () => void;
  feature: HomepageFeature | null;
}

export function FeatureDialog({ isOpen, onClose, feature }: FeatureDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const token = localStorage.getItem('mealAttendAuthToken_v1');

  const form = useForm<FeatureFormData>({
    resolver: zodResolver(featureSchema),
    defaultValues: {
      icon: "",
      title: "",
      description: "",
      isVisible: true,
    },
  });

  useEffect(() => {
    if (isOpen && feature) {
      form.reset(feature);
    } else {
      form.reset({ icon: "", title: "", description: "", isVisible: true });
    }
  }, [isOpen, feature, form]);
  
  const mutation = useMutation({
    mutationFn: async (data: FeatureFormData) => {
      const url = feature ? `/api/features/${feature.id}` : "/api/features";
      const method = feature ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to save feature');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homepageFeatures"] });
      toast({ title: "Success", description: `Feature ${feature ? 'updated' : 'created'}.` });
      onClose();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (featureId: string) => {
      const res = await fetch(`/api/features/${featureId}`, { 
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        throw new Error("Failed to delete feature");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homepageFeatures"] });
      toast({ title: "Success", description: "Feature deleted." });
      onClose();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const onSubmit = (data: FeatureFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{feature ? "Edit Feature" : "Add New Feature"}</DialogTitle>
          <DialogDescription>
            {feature ? "Update the details for this homepage feature." : "Fill in the details for the new feature."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField control={form.control} name="icon" render={({ field }) => (
              <FormItem><FormLabel>Icon Name</FormLabel><FormControl><Input {...field} placeholder="e.g., QrCode" /></FormControl><FormDescription>Use a valid name from lucide-react library.</FormDescription><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="isVisible" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3"><FormLabel>Visible on Homepage</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
              )} />
            <DialogFooter className="pt-4">
                {feature && (
                    <Button type="button" variant="destructive" onClick={() => deleteMutation.mutate(feature.id)} disabled={deleteMutation.isPending}>
                       {deleteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />} Delete
                    </Button>
                )}
                <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {feature ? "Save Changes" : "Create Feature"}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
