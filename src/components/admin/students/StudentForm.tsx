
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { Student } from "@/types/student";
import Image from 'next/image';

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
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const studentFormSchema = z.object({
  studentId: z.string().min(1, { message: "Student ID is required." }),
  name: z.string().min(1, { message: "Full Name is required." }),
  gender: z.enum(['Male', 'Female', 'Other', ''], { errorMap: () => ({ message: "Please select a gender." }) }).default(''),
  class: z.string().min(1, { message: "Class is required." }),
  profileImageURL: z.string().optional().or(z.literal('')), // Stores Data URL or existing http URL
});

export type StudentFormData = z.infer<typeof studentFormSchema>;

interface StudentFormProps {
  onSubmit: (data: StudentFormData) => void;
  studentToEdit?: Student | null;
  isLoading?: boolean;
}

export function StudentForm({ onSubmit, studentToEdit, isLoading }: StudentFormProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const form = useForm<StudentFormData>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      studentId: "",
      name: "",
      gender: "",
      class: "",
      profileImageURL: "",
    },
  });

  useEffect(() => {
    if (studentToEdit) {
      form.reset({
        studentId: studentToEdit.studentId,
        name: studentToEdit.name,
        gender: studentToEdit.gender || "",
        class: studentToEdit.class,
        profileImageURL: studentToEdit.profileImageURL || "",
      });
      setImagePreview(studentToEdit.profileImageURL || null);
    } else {
      form.reset({
        studentId: "",
        name: "",
        gender: "",
        class: "",
        profileImageURL: "",
      });
      setImagePreview(null);
    }
  }, [studentToEdit, form]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setImagePreview(dataUrl);
        form.setValue("profileImageURL", dataUrl, { shouldValidate: true });
      };
      reader.readAsDataURL(file);
    } else {
      // If no file is selected (e.g., user cancels file dialog), 
      // reset to original if editing, or clear if adding new
      const originalImageUrl = studentToEdit?.profileImageURL || "";
      setImagePreview(originalImageUrl || null);
      form.setValue("profileImageURL", originalImageUrl, { shouldValidate: true });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="studentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Student ID</FormLabel>
              <FormControl>
                <Input placeholder="e.g., S1001" {...field} />
              </FormControl>
              <FormDescription>
                The unique identifier for the student.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gender</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="class"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Class/Grade</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Grade 10" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormItem>
          <FormLabel>Profile Image</FormLabel>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 rounded-md">
              <AvatarImage 
                src={imagePreview || `https://placehold.co/80x80.png?text=No+Image`} 
                alt="Profile preview"
                className="object-cover" 
                data-ai-hint="student profile"
              />
              <AvatarFallback>IMG</AvatarFallback>
            </Avatar>
            <FormControl>
                <Input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange} 
                  className="block w-full text-sm text-slate-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary/10 file:text-primary
                    hover:file:bg-primary/20"
                />
            </FormControl>
          </div>
           <FormDescription>
                Upload a profile picture for the student.
            </FormDescription>
          {/* Hidden field to store the URL string, managed by handleImageChange and useEffect */}
          <FormField
            control={form.control}
            name="profileImageURL"
            render={({ field }) => <Input type="hidden" {...field} />}
          />
          <FormMessage />
        </FormItem>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (studentToEdit ? "Saving..." : "Adding...") : (studentToEdit ? "Save Changes" : "Add Student")}
        </Button>
      </form>
    </Form>
  );
}
