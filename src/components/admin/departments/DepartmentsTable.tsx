
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
import { Edit, Trash2, ChevronsUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Department } from "@/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

type SortableDepartmentKeys = 'departmentId' | 'name'; 
type SortDirection = 'ascending' | 'descending';

interface SortConfig {
  key: SortableDepartmentKeys | null;
  direction: SortDirection;
}

interface DepartmentsTableProps {
  departments: Department[];
  onEdit: (department: Department) => void;
  onDelete: (departmentId: string) => void;
  sortConfig: SortConfig;
  onSort: (key: SortableDepartmentKeys) => void;
}

export function DepartmentsTable({ departments, onEdit, onDelete, sortConfig, onSort }: DepartmentsTableProps) {
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [departmentToDelete, setDepartmentToDelete] = React.useState<Department | null>(null);

  const handleDeleteClick = (department: Department) => {
    setDepartmentToDelete(department);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (departmentToDelete) {
      onDelete(departmentToDelete.id);
    }
    setShowDeleteDialog(false);
    setDepartmentToDelete(null);
  };

  const renderSortIcon = (columnKey: SortableDepartmentKeys) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />;
    }
    return sortConfig.direction === 'ascending' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
  };

  const SortableTableHead = ({ columnKey, children, className }: { columnKey: SortableDepartmentKeys, children: React.ReactNode, className?: string }) => (
    <TableHead
      className={cn("cursor-pointer hover:bg-muted/50 transition-colors group whitespace-nowrap", className)}
      onClick={() => onSort(columnKey)}
    >
      <div className="flex items-center">
        {children}
        {renderSortIcon(columnKey)}
      </div>
    </TableHead>
  );
  
  if (departments.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        No departments found. Check your search term or add new departments.
      </div>
    );
  }

  return (
    <TooltipProvider>
      {/* Mobile View */}
      <div className="md:hidden space-y-4">
        {departments.map((department) => (
          <Card key={department.id} className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">{department.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                <span className="font-semibold">ID:</span> {department.departmentId}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => onEdit(department)}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </Button>
              <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(department)}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block rounded-lg border shadow-sm bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead columnKey="departmentId">Department ID</SortableTableHead>
              <SortableTableHead columnKey="name">Name</SortableTableHead>
              <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {departments.map((department) => (
              <TableRow key={department.id}>
                <TableCell className="font-mono text-xs whitespace-nowrap">{department.departmentId}</TableCell>
                <TableCell className="font-medium whitespace-nowrap">{department.name}</TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <div className="flex justify-end items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => onEdit(department)}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit Department</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Edit Department</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(department)} className="text-destructive hover:text-destructive/90 hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete Department</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Delete Department</p>
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
              This action cannot be undone. This will permanently delete the department
              &quot;{departmentToDelete?.name}&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDepartmentToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
