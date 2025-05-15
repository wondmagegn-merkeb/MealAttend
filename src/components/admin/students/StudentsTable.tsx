
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, Edit, Trash2, Eye } from "lucide-react"; // Added Eye icon
import type { Student } from "@/types/student";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import React from "react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link"; // Added Link for navigation

interface StudentsTableProps {
  students: Student[];
  onEdit: (student: Student) => void;
  onDelete: (studentId: string) => void;
}

export function StudentsTable({ students, onEdit, onDelete }: StudentsTableProps) {
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [studentToDelete, setStudentToDelete] = React.useState<Student | null>(null);

  const handleDeleteClick = (student: Student) => {
    setStudentToDelete(student);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (studentToDelete) {
      onDelete(studentToDelete.id);
    }
    setShowDeleteDialog(false);
    setStudentToDelete(null);
  };
  
  if (students.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        No students found. Add a new student to get started.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border shadow-sm bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Student ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="font-medium">{student.studentId}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage 
                        src={student.profileImageURL || `https://placehold.co/40x40.png?text=${student.name.split(' ').map(n => n[0]).join('')}`} 
                        alt={student.name} 
                        data-ai-hint="student profile"
                      />
                      <AvatarFallback>{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{student.name}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{student.class}</TableCell>
                <TableCell>
                  {student.gender ? <Badge variant="secondary">{student.gender}</Badge> : 'N/A'}
                </TableCell>
                <TableCell>{new Date(student.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                       <Link href={`/admin/students/${student.id}/id-card`} passHref legacyBehavior>
                        <DropdownMenuItem asChild>
                          <a>
                            <Eye className="mr-2 h-4 w-4" />
                            View ID Card
                          </a>
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuItem onClick={() => onEdit(student)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleDeleteClick(student)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the student
              &quot;{studentToDelete?.name}&quot; and remove their data from servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setStudentToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
