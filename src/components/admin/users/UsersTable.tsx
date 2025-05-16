
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
import type { User } from "@/types/user";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

type SortableUserKeys = 'userId' | 'fullName' | 'department' | 'email' | 'role' | 'createdAt';
type SortDirection = 'ascending' | 'descending';

interface SortConfig {
  key: SortableUserKeys | null;
  direction: SortDirection;
}

interface UsersTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
  sortConfig: SortConfig;
  onSort: (key: SortableUserKeys) => void;
}

export function UsersTable({ users, onEdit, onDelete, sortConfig, onSort }: UsersTableProps) {
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [userToDelete, setUserToDelete] = React.useState<User | null>(null);

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      onDelete(userToDelete.id);
    }
    setShowDeleteDialog(false);
    setUserToDelete(null);
  };

  const renderSortIcon = (columnKey: SortableUserKeys) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />;
    }
    return sortConfig.direction === 'ascending' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
  };

  const SortableTableHead = ({ columnKey, children, className }: { columnKey: SortableUserKeys, children: React.ReactNode, className?: string }) => (
    <TableHead
      className={`cursor-pointer hover:bg-muted/50 transition-colors group ${className}`}
      onClick={() => onSort(columnKey)}
    >
      <div className="flex items-center">
        {children}
        {renderSortIcon(columnKey)}
      </div>
    </TableHead>
  );
  
  if (users.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        No users found. Check your search term or add new users.
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="rounded-lg border shadow-sm bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead columnKey="userId" className="w-[200px]">User ID</SortableTableHead>
              <SortableTableHead columnKey="fullName">Full Name</SortableTableHead>
              <SortableTableHead columnKey="department">Department</SortableTableHead>
              <SortableTableHead columnKey="email">Email</SortableTableHead>
              <SortableTableHead columnKey="role">Role</SortableTableHead>
              <SortableTableHead columnKey="createdAt">Created At</SortableTableHead>
              <TableHead className="text-right w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-mono text-xs">{user.userId || ''}</TableCell>
                <TableCell className="font-medium">{user.fullName}</TableCell>
                <TableCell>{user.department}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant={user.role === 'Admin' ? 'default' : 'secondary'}>
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => onEdit(user)}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit User</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Edit User</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(user)} className="text-destructive hover:text-destructive/90 hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete User</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Delete User</p>
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
              This action cannot be undone. This will permanently delete the user
              &quot;{userToDelete?.fullName}&quot; and remove their data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
