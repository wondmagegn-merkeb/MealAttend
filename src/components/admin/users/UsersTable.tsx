
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
import { Edit, Trash2, ChevronsUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { UserWithDepartment } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

type SortableUserKeys = 'userId' | 'fullName' | 'department' | 'email' | 'role' | 'status' | 'createdAt';
type SortDirection = 'ascending' | 'descending';

interface SortConfig {
  key: SortableUserKeys | null;
  direction: SortDirection;
}

interface UsersTableProps {
  users: UserWithDepartment[];
  onEdit: (user: UserWithDepartment) => void;
  onDelete: (userId: string) => void;
  sortConfig: SortConfig;
  onSort: (key: SortableUserKeys) => void;
}

export function UsersTable({ users, onEdit, onDelete, sortConfig, onSort }: UsersTableProps) {
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [userToDelete, setUserToDelete] = React.useState<UserWithDepartment | null>(null);

  const handleDeleteClick = (user: UserWithDepartment) => {
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
      className={`cursor-pointer hover:bg-muted/50 transition-colors group whitespace-nowrap ${className}`}
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
      {/* Mobile View */}
      <div className="md:hidden space-y-4">
        {users.map((user) => (
          <Card key={user.id} className="shadow-md">
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user.profileImageURL || undefined} alt={user.fullName} data-ai-hint="user avatar" />
                  <AvatarFallback>{user.fullName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg">{user.fullName}</CardTitle>
                  <CardDescription>{user.email}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">User ID:</span>
                <span className="font-mono text-xs">{user.userId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Department:</span>
                <span>{user.department?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Role:</span>
                <Badge variant={user.role === 'Admin' ? 'default' : 'secondary'}>{user.role}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={user.status === 'Active' ? 'default' : 'destructive'} className={user.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'}>{user.status}</Badge>
              </div>
               <div className="flex justify-between">
                <span className="text-muted-foreground">Created:</span>
                <span>{format(new Date(user.createdAt), "yyyy-MM-dd")}</span>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => onEdit(user)}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </Button>
              <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(user)}>
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
              <SortableTableHead columnKey="userId">User ID</SortableTableHead>
              <SortableTableHead columnKey="fullName">Full Name</SortableTableHead>
              <SortableTableHead columnKey="department">Department</SortableTableHead>
              <SortableTableHead columnKey="email">Email</SortableTableHead>
              <SortableTableHead columnKey="role">Role</SortableTableHead>
              <SortableTableHead columnKey="status">Status</SortableTableHead>
              <SortableTableHead columnKey="createdAt">Created At</SortableTableHead>
              <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-mono text-xs whitespace-nowrap">{user.userId || ''}</TableCell>
                <TableCell className="whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage 
                        src={user.profileImageURL || undefined} 
                        alt={user.fullName} 
                        data-ai-hint="user avatar"
                      />
                      <AvatarFallback>{user.fullName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{user.fullName}</span>
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap">{user.department?.name || 'N/A'}</TableCell>
                <TableCell className="whitespace-nowrap">{user.email}</TableCell>
                <TableCell className="whitespace-nowrap">
                  <Badge variant={user.role === 'Admin' ? 'default' : 'secondary'}>
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                    <Badge variant={user.status === 'Active' ? 'default' : 'destructive'}
                        className={user.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'}>
                        {user.status}
                    </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap">{format(new Date(user.createdAt), "yyyy-MM-dd")}</TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <div className="flex justify-end items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => onEdit(user)}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit User</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Edit User</p></TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(user)} className="text-destructive hover:text-destructive/90 hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete User</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Delete User</p></TooltipContent>
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
