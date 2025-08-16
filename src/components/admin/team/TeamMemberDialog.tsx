
"use client";

import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { TeamMember } from "@prisma/client";

const teamMemberSchema = z.object({
  name: z.string().min(1, "Name is required"),
  role: z.string().min(1, "Role is required"),
  bio: z.string().min(1, "Bio is required"),
  avatarUrl: z.string().optional().nullable(),
  isCeo: z.boolean().default(false),
  isVisible: z.boolean().default(true),
});
type TeamMemberFormData = z.infer<typeof teamMemberSchema>;

interface TeamMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  member: TeamMember | null;
}

const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
};

export function TeamMemberDialog({ isOpen, onClose, member }: TeamMemberDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const token = localStorage.getItem('mealAttendAuthToken_v1');

  const form = useForm<TeamMemberFormData>({
    resolver: zodResolver(teamMemberSchema),
    defaultValues: {
      name: "",
      role: "",
      bio: "",
      avatarUrl: null,
      isCeo: false,
      isVisible: true,
    },
  });

  useEffect(() => {
    if (isOpen && member) {
      form.reset(member);
      setImagePreview(member.avatarUrl);
    } else {
      form.reset({ name: "", role: "", bio: "", avatarUrl: null, isCeo: false, isVisible: true });
      setImagePreview(null);
    }
    setSelectedFile(null);
  }, [isOpen, member, form]);
  
  const mutation = useMutation({
    mutationFn: async (data: TeamMemberFormData) => {
      let finalAvatarUrl = member?.avatarUrl ?? null;
      if (selectedFile) {
        toast({ title: "Uploading image..." });
        finalAvatarUrl = await fileToDataUri(selectedFile);
      }
      
      const payload = {...data, avatarUrl: finalAvatarUrl};

      const url = member ? `/api/team/${member.id}` : "/api/team";
      const method = member ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',  // Declares that the body content is JSON
          'Authorization': `Bearer ${token}`   // Sends a bearer token for authorization
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to save team member');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamMembers"] });
      toast({ title: "Success", description: `Team member ${member ? 'updated' : 'created'}.` });
      onClose();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const res = await fetch(`/api/team/${memberId}`, { method: 'DELETE' });
      if (!res.ok) {
        throw new Error("Failed to delete member");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamMembers"] });
      toast({ title: "Success", description: "Team member deleted." });
      onClose();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const onSubmit = (data: TeamMemberFormData) => {
    mutation.mutate(data);
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({ title: "Image Too Large", description: "Please select an image smaller than 2MB.", variant: "destructive" });
        return;
      }
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{member ? "Edit Team Member" : "Add New Team Member"}</DialogTitle>
          <DialogDescription>
            {member ? "Update the details for this team member." : "Fill in the details for the new team member."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="avatarUrl"
              render={({ field }) => (
                <FormItem className="flex flex-col items-center">
                  <Avatar className="h-24 w-24">
                     <AvatarImage src={imagePreview || `https://placehold.co/96x96.png?text=Avatar`} alt="Avatar Preview" data-ai-hint="professional" />
                     <AvatarFallback>AV</AvatarFallback>
                  </Avatar>
                  <Input id="avatar-upload" type="file" className="hidden" ref={fileInputRef} onChange={handleImageChange} accept="image/*" />
                  <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" /> Upload Image
                  </Button>
                </FormItem>
              )}
            />
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="role" render={({ field }) => (
              <FormItem><FormLabel>Role</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="bio" render={({ field }) => (
              <FormItem><FormLabel>Bio</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="flex justify-between gap-4">
              <FormField control={form.control} name="isVisible" render={({ field }) => (
                <FormItem className="flex items-center gap-2"><FormLabel>Visible</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="isCeo" render={({ field }) => (
                <FormItem className="flex items-center gap-2"><FormLabel>Is CEO</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
              )} />
            </div>
            <DialogFooter className="pt-4">
                {member && (
                    <Button type="button" variant="destructive" onClick={() => deleteMutation.mutate(member.id)} disabled={deleteMutation.isPending}>
                       {deleteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />} Delete
                    </Button>
                )}
                <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {member ? "Save Changes" : "Create Member"}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
