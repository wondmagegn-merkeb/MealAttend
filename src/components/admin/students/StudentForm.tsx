
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState, useRef } from "react";
import { Loader2, Upload } from "lucide-react"; 

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Student } from "@prisma/client";

const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

// Zod schema for validation
const studentFormSchema = z.object({
  name: z.string().min(1, { message: "Full Name is required." }),
  gender: z.enum(["Male", "Female", ""]).optional(),
  classNumber: z.string().optional().or(z.literal("")),
  classAlphabet: z.string().optional().or(z.literal("")),
  profileImageURL: z.string().optional().nullable(),
});

export type StudentFormData = z.infer<typeof studentFormSchema>;

interface StudentFormProps {
  onSubmit: (data: Omit<StudentFormData, 'classNumber' | 'classAlphabet'> & { classGrade?: string | null }) => void;
  initialData?: Student | null; // Prisma Student type
  isLoading?: boolean;
  submitButtonText?: string;
  isEditMode?: boolean;
}

const gradeAlphabetOptions = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const classNumberOptions = Array.from({ length: 12 }, (_, i) => (i + 1).toString());

const parseClassGrade = (classGrade: string | null | undefined): { classNumber: string, classAlphabet: string } => {
  if (!classGrade) return { classNumber: "", classAlphabet: "" };
  const match = classGrade.match(/^(\d+)([A-Za-z]*)$/);
  if (match) {
    return { classNumber: match[1], classAlphabet: match[2].toUpperCase() };
  }
  const numericMatch = classGrade.match(/^(\d+)$/);
  if (numericMatch) {
     return { classNumber: numericMatch[1], classAlphabet: "" };
  }
  return { classNumber: "", classAlphabet: classGrade.toUpperCase() };
};

export function StudentForm({
  onSubmit,
  initialData,
  isLoading = false,
  submitButtonText = "Submit",
  isEditMode = false,
}: StudentFormProps) {

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { classNumber: initialClassNumber, classAlphabet: initialClassAlphabet } = initialData?.classGrade
    ? parseClassGrade(initialData.classGrade)
    : { classNumber: "", classAlphabet: "" };

  const form = useForm<StudentFormData>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      gender: initialData?.gender || "",
      classNumber: initialClassNumber,
      classAlphabet: initialClassAlphabet,
      profileImageURL: initialData?.profileImageURL || null,
    },
  });

  useEffect(() => {
    if (initialData) {
      const { classNumber, classAlphabet } = parseClassGrade(initialData.classGrade);
      form.reset({
        name: initialData.name || "",
        gender: initialData.gender || "",
        classNumber: classNumber,
        classAlphabet: classAlphabet,
        profileImageURL: initialData.profileImageURL || null,
      });
      setImagePreview(initialData.profileImageURL);
    } else {
      form.reset({
        name: "",
        gender: "",
        classNumber: "",
        classAlphabet: "",
        profileImageURL: null,
      });
      setImagePreview(null);
    }
  }, [initialData, form]);

  const onFormSubmit = async (data: StudentFormData) => {
    let finalData = { ...data };
    const fileInput = fileInputRef.current;
    
    if (fileInput?.files?.[0]) {
        const dataUrl = await fileToDataUri(fileInput.files[0]);
        finalData.profileImageURL = dataUrl;
    }

    const { classNumber, classAlphabet, ...restOfData } = finalData;

    let classGrade: string | null = null;
    const finalClassNumber = classNumber === 'na' ? '' : classNumber;
    const finalClassAlphabet = classAlphabet === 'na' ? '' : classAlphabet;
    
    if (finalClassNumber) {
      classGrade = `${finalClassNumber}${finalClassAlphabet}`;
    } else if (finalClassAlphabet) {
      classGrade = finalClassAlphabet;
    }

    const dataToSubmit = { 
        ...restOfData,
        gender: data.gender || null,
        classGrade, 
    };
    
    onSubmit(dataToSubmit);
  };


  return (
    <Card className="shadow-md border-border">
      <CardHeader>
          <CardTitle>Student Details</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 flex flex-col items-center gap-4 pt-4">
                  <Avatar className="h-32 w-32">
                    <AvatarImage src={imagePreview || `https://placehold.co/128x128.png?text=Avatar`} alt="Avatar Preview" data-ai-hint="student avatar" />
                    <AvatarFallback>{initialData?.name?.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <FormControl>
                    <>
                      <Input 
                        type="file" 
                        className="hidden" 
                        ref={fileInputRef} 
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            const previewUrl = URL.createObjectURL(e.target.files[0]);
                            setImagePreview(previewUrl);
                          }
                        }}
                        accept="image/*"
                      />
                      <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="mr-2 h-4 w-4" /> Upload Image
                      </Button>
                    </>
                  </FormControl>
                  <FormMessage />
              </div>
              <div className="md:col-span-2 space-y-6">
                {isEditMode && initialData?.studentId && (
                  <FormItem>
                    <FormLabel>Student ID</FormLabel>
                    <FormControl>
                      <Input value={initialData.studentId} readOnly className="bg-muted/50" />
                    </FormControl>
                    <FormDescription>
                      The unique identifier for the student (auto-generated).
                    </FormDescription>
                  </FormItem>
                )}
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
                      <Select onValueChange={field.onChange} value={field.value || ""} defaultValue={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="classNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class Number</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""} defaultValue={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select number" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="na">N/A</SelectItem>
                            {classNumberOptions.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="classAlphabet"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grade Stream/Letter</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""} defaultValue={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select letter" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="na">N/A</SelectItem>
                            {gradeAlphabetOptions.map((option) => (
                              <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

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
