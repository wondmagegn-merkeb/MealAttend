
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
import { useEffect, useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Upload } from "lucide-react"; 
import { Card, CardContent } from "@/components/ui/card";
import type { Student } from "@prisma/client";
import { useToast } from "@/hooks/use-toast";


// Zod schema for validation
const studentFormSchema = z.object({
  name: z.string().min(1, { message: "Full Name is required." }),
  gender: z.enum(["Male", "Female", ""]).optional(),
  classNumber: z.string().optional().or(z.literal("")),
  classAlphabet: z.string().optional().or(z.literal("")),
  profileImageURL: z.string().optional().or(z.literal("")),
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

const fileToDataUri = (file: File): Promise<string | null> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};


export function StudentForm({
  onSubmit,
  initialData,
  isLoading = false,
  submitButtonText = "Submit",
  isEditMode = false,
}: StudentFormProps) {
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
      profileImageURL: initialData?.profileImageURL || "",
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
        profileImageURL: initialData.profileImageURL || "",
      });
      setImagePreview(initialData.profileImageURL || null);
    } else {
      form.reset({
        name: "",
        gender: "",
        classNumber: "",
        classAlphabet: "",
        profileImageURL: "",
      });
      setImagePreview(null);
    }
    setSelectedFile(null);
  }, [initialData, form]);

  useEffect(() => {
    if (imagePreview && imagePreview.startsWith("blob:")) {
      return () => {
        URL.revokeObjectURL(imagePreview);
      };
    }
  }, [imagePreview]);


  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
          title: "Image Too Large",
          description: "Please select an image smaller than 2MB.",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const onFormSubmit = async (data: StudentFormData) => {
    const { classNumber, classAlphabet, ...restOfData } = data;

    let classGrade: string | null = null;
    const finalClassNumber = classNumber === 'na' ? '' : classNumber;
    const finalClassAlphabet = classAlphabet === 'na' ? '' : classAlphabet;
    
    if (finalClassNumber) {
      classGrade = `${finalClassNumber}${finalClassAlphabet}`;
    } else if (finalClassAlphabet) {
      classGrade = finalClassAlphabet;
    }

    let finalProfileUrl = initialData?.profileImageURL || null;

    if (selectedFile) {
       try {
        toast({ title: "Processing image...", description: "Please wait." });
        finalProfileUrl = await fileToDataUri(selectedFile);
      } catch (error) {
        console.error("Image processing error:", error);
        toast({ title: "Image Error", description: "Could not process the selected image.", variant: "destructive" });
        return; // Stop submission
      }
    }

    const dataToSubmit = { 
        ...restOfData,
        gender: data.gender || null,
        classGrade, 
        profileImageURL: finalProfileUrl 
    };
    
    onSubmit(dataToSubmit);
  };


  return (
    <Card className="shadow-md border-border">
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-6">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <FormDescription>Numeric part of the grade (1-12).</FormDescription>
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
                    <FormDescription>Alphabetical part of the grade (e.g., A, B).</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                 <Input 
                    id="picture" 
                    type="file" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleImageChange}
                    accept="image/*"
                    disabled={isLoading}
                  />
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                    <Upload className="mr-2 h-4 w-4" />
                    {selectedFile ? 'Change Image' : 'Upload Image'}
                  </Button>
              </div>
              <FormDescription>
                {selectedFile ? `Selected: ${selectedFile.name}` : "Select an image (max 2MB)."} It will be processed on submission.
              </FormDescription>
              <FormField
                control={form.control}
                name="profileImageURL"
                render={({ field }) => <Input type="hidden" {...field} />}
              />
              {form.formState.errors.profileImageURL && (
                <FormMessage>{(form.formState.errors.profileImageURL as any)?.message}</FormMessage>
              )}
            </FormItem>

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
