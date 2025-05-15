
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { Department } from "@/types/department";

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
import { Textarea } from "@/components/ui/textarea";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const departmentFormSchema = z.object({
  name: z.string().min(1, { message: "Department Name is required." }),
  description: z.string().optional(),
  headOfDepartment: z.string().optional(),
});

export type DepartmentFormData = z.infer<typeof departmentFormSchema>;

interface DepartmentFormProps {
  onSubmit: (data: DepartmentFormData) => void;
  initialData?: Department | null;
  isLoading?: boolean;
  submitButtonText?: string;
}

export function DepartmentForm({ onSubmit, initialData, isLoading, submitButtonText = "Submit" }: DepartmentFormProps) {
  const form = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: initialData || {
      name: "",
      description: "",
      headOfDepartment: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    } else {
      form.reset({
        name: "",
        description: "",
        headOfDepartment: "",
      });
    }
  }, [initialData, form]);

  return (
    <Card className="shadow-md border-border">
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Kitchen Staff" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Brief description of the department's role..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="headOfDepartment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Head of Department (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Mr. John Chef" {...field} />
                  </FormControl>
                  <FormDescription>
                    Name or ID of the person leading this department.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end pt-2">
              <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  submitButtonText
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
