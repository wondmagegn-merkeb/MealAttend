
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StudentForm, type StudentFormData } from "./StudentForm";
import type { Student } from "@/types/student";

interface StudentFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: StudentFormData) => void;
  studentToEdit?: Student | null;
  triggerButton?: React.ReactNode; // Optional custom trigger
  isLoading?: boolean;
}

export function StudentFormDialog({
  isOpen,
  onOpenChange,
  onSubmit,
  studentToEdit,
  triggerButton,
  isLoading,
}: StudentFormDialogProps) {
  const dialogTitle = studentToEdit ? "Edit Student" : "Add New Student";
  const dialogDescription = studentToEdit
    ? "Update the details of the existing student."
    : "Enter the details for the new student.";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {triggerButton && <DialogTrigger asChild>{triggerButton}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px] shadow-xl">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        <StudentForm onSubmit={onSubmit} studentToEdit={studentToEdit} isLoading={isLoading} />
        {/* Footer can be part of the form or here if needed */}
        {/* <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogClose>
        </DialogFooter> */}
      </DialogContent>
    </Dialog>
  );
}
