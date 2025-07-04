
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, Trash2, Eye, ChevronsUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import React from "react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Student } from '@/types';


type SortableStudentKeys = 'studentId' | 'name' | 'classGrade' | 'gender' | 'createdAt';
type SortDirection = 'ascending' | 'descending';

interface SortConfig {
  key: SortableStudentKeys | null;
  direction: SortDirection;
}

interface StudentsTableProps {
  students: Student[];
  onEdit: (student: Student) => void;
  onDelete: (studentId: string) => void;
  sortConfig: SortConfig;
  onSort: (key: SortableStudentKeys) => void;
}

export function StudentsTable({ students, onEdit, onDelete, sortConfig, onSort }: StudentsTableProps) {
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

  const renderSortIcon = (columnKey: SortableStudentKeys) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />;
    }
    return sortConfig.direction === 'ascending' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
  };

  const SortableTableHead = ({ columnKey, children }: { columnKey: SortableStudentKeys, children: React.ReactNode }) => (
    <TableHead
      className="cursor-pointer hover:bg-muted/50 transition-colors group"
      onClick={() => onSort(columnKey)}
    >
      <div className="flex items-center">
        {children}
        {renderSortIcon(columnKey)}
      </div>
    </TableHead>
  );
  
  if (students.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        No students found. Check your search or add new students.
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="rounded-lg border shadow-sm bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead columnKey="studentId">Student ID</SortableTableHead>
              <SortableTableHead columnKey="name">Name</SortableTableHead>
              <SortableTableHead columnKey="classGrade">Grade</SortableTableHead>
              <SortableTableHead columnKey="gender">Gender</SortableTableHead>
              <SortableTableHead columnKey="createdAt">Created At</SortableTableHead>
              <TableHead className="text-right w-[130px]">Actions</TableHead>
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
                <TableCell>{student.classGrade || 'N/A'}</TableCell>
                <TableCell>
                  {student.gender ? <Badge variant="secondary">{student.gender}</Badge> : 'N/A'}
                </TableCell>
                <TableCell>{new Date(student.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/admin/students/${student.id}/id-card`}> 
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View ID Card</span>
                          </Link>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>View ID Card</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => onEdit(student)}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit Student</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Edit Student</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(student)} className="text-destructive hover:text-destructive/90 hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete Student</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Delete Student</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
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
              &quot;{studentToDelete?.name}&quot; and remove their data.
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
    </TooltipProvider>
  );
}
