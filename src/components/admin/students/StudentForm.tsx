
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { Student } from "@/types/student";

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
import { useEffect } from "react";

const studentFormSchema = z.object({
  studentId: z.string().min(1, { message: "Student ID is required." }),
  name: z.string().min(1, { message: "Full Name is required." }),
  email: z.string().min(1, { message: "Email is required." }).email({ message: "Invalid email address." }),
  gender: z.enum(['Male', 'Female', 'Other', ''], { errorMap: () => ({ message: "Please select a gender." }) }).default(''),
  class: z.string().min(1, { message: "Class is required." }),
  profileImageURL: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
});

export type StudentFormData = z.infer<typeof studentFormSchema>;

interface StudentFormProps {
  onSubmit: (data: StudentFormData) => void;
  studentToEdit?: Student | null;
  isLoading?: boolean;
}

export function StudentForm({ onSubmit, studentToEdit, isLoading }: StudentFormProps) {
  const form = useForm<StudentFormData>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      studentId: "",
      name: "",
      email: "",
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
        email: studentToEdit.email,
        gender: studentToEdit.gender || "",
        class: studentToEdit.class,
        profileImageURL: studentToEdit.profileImageURL || "",
      });
    } else {
      form.reset({
        studentId: "",
        name: "",
        email: "",
        gender: "",
        class: "",
        profileImageURL: "",
      });
    }
  }, [studentToEdit, form]);

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
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input type="email" placeholder="e.g., john.doe@example.com" {...field} />
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
        <FormField
          control={form.control}
          name="profileImageURL"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Profile Image URL (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/profile.png" {...field} />
              </FormControl>
              <FormDescription>
                Link to the student's profile picture.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (studentToEdit ? "Saving..." : "Adding...") : (studentToEdit ? "Save Changes" : "Add Student")}
        </Button>
      </form>
    </Form>
  );
}

