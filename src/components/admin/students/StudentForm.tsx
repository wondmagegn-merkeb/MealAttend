
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
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Student } from "@prisma/client";


// Zod schema for validation
const studentFormSchema = z.object({
  name: z.string().min(1, { message: "Full Name is required." }),
  gender: z.string().optional().or(z.literal("")), // Optional or empty string
  classNumber: z.string().optional().or(z.literal("")), // Made optional
  classAlphabet: z.string().optional().or(z.literal("")), // Made optional
  profileImageURL: z.string().optional().or(z.literal("")),
  // classGrade is not directly in the form, but constructed/parsed
});

export type StudentFormData = z.infer<typeof studentFormSchema>;

interface StudentFormProps {
  onSubmit: (data: Omit<StudentFormData, 'classNumber' | 'classAlphabet'> & { classGrade?: string }) => void;
  initialData?: Student | null; // Prisma Student type
  isLoading?: boolean;
  submitButtonText?: string;
  isEditMode?: boolean;
}

const gradeAlphabetOptions = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const classNumberOptions = Array.from({ length: 12 }, (_, i) => (i + 1).toString());

// Helper function to parse classGrade into classNumber and classAlphabet
const parseClassGrade = (classGrade: string | null | undefined): { classNumber: string, classAlphabet: string } => {
  if (!classGrade) return { classNumber: "", classAlphabet: "" };
  const match = classGrade.match(/^(\d+)([A-Za-z]*)$/);
  if (match) {
    return { classNumber: match[1], classAlphabet: match[2] };
  }
  const numericMatch = classGrade.match(/^(\d+)$/);
  if (numericMatch) {
    return { classNumber: numericMatch[1], classAlphabet: "" };
  }
  // If it's just letters or unparsable, treat as alphabet part of an unknown number
  return { classNumber: "", classAlphabet: classGrade };
};


export function StudentForm({
  onSubmit,
  initialData,
  isLoading = false,
  submitButtonText = "Submit",
  isEditMode = false,
}: StudentFormProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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
  }, [initialData, form.reset]);

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
      const originalImageUrl = initialData?.profileImageURL || "";
      setImagePreview(originalImageUrl || null);
      form.setValue("profileImageURL", originalImageUrl, { shouldValidate: true });
    }
  };

  const onFormSubmit = (data: StudentFormData) => {
    const { classNumber, classAlphabet, ...restOfData } = data;
    let classGrade: string | undefined = undefined;
    if (classNumber && classAlphabet) {
      classGrade = `${classNumber}${classAlphabet}`;
    } else if (classNumber) {
      classGrade = classNumber;
    } else if (classAlphabet) {
      // This case might be less common (e.g., "A" without a number)
      // but depends on how you want to treat it.
      classGrade = classAlphabet;
    }

    onSubmit({ ...restOfData, classGrade });
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
                  <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                      <SelectItem value="">Prefer not to say / N/A</SelectItem>
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
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select number" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">N/A</SelectItem>
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
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select letter" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">N/A</SelectItem>
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
              <FormField
                control={form.control}
                name="profileImageURL"
                render={({ field }) => <Input type="hidden" {...field} />}
              />
              {form.formState.errors.profileImageURL && (
                <FormMessage>{form.formState.errors.profileImageURL.message}</FormMessage>
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
