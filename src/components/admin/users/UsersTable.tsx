
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
import { Edit, Trash2, ChevronsUpDown, ArrowUp, ArrowDown, KeyRound, Loader2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { UserWithCreator } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { logUserActivity } from "@/lib/activityLogger";


type SortableUserKeys = 'userId' | 'fullName' | 'position' | 'email' | 'role' | 'status' | 'createdAt' | 'createdBy' | 'passwordResetRequested';
type SortDirection = 'ascending' | 'descending';

interface SortConfig {
  key: SortableUserKeys | null;
  direction: SortDirection;
}

interface UsersTableProps {
  users: UserWithCreator[];
  onEdit: (user: UserWithCreator) => void;
  onDelete: (userId: string) => void;
  sortConfig: SortConfig;
  onSort: (key: SortableUserKeys) => void;
}

const resetPassword = async (userId: string) => {
    const token = localStorage.getItem('mealAttendAuthToken_v1');
    const response = await fetch(`/api/users/${userId}/reset-password`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reset password');
    }
    return response.json();
};


export function UsersTable({ users, onEdit, onDelete, sortConfig, onSort }: UsersTableProps) {
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [userToDelete, setUserToDelete] = React.useState<UserWithCreator | null>(null);
  const { currentUser, currentUserId: actorUserId } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const resetPasswordMutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: (data, userId) => {
        toast({ title: "Password Reset", description: data.message });
        const user = users.find(u => u.id === userId);
        if (user) {
            logUserActivity(actorUserId, "PASSWORD_RESET_SUCCESS", `Reset password for user: ${user.fullName} (${user.userId})`);
        }
        queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: Error, userId) => {
        toast({ title: "Reset Failed", description: error.message, variant: "destructive" });
        const user = users.find(u => u.id === userId);
         if (user) {
            logUserActivity(actorUserId, "PASSWORD_RESET_FAILURE", `Failed to reset password for user: ${user.fullName} (${user.userId}). Error: ${error.message}`);
        }
    }
  });

  const handleDeleteClick = (user: UserWithCreator) => {
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
  
  const showCreatedByColumn = currentUser?.role === 'Super Admin';

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
                <span className="text-muted-foreground">Position:</span>
                <span>{user.position || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Role:</span>
                <Badge variant={user.role === 'Admin' || user.role === 'Super Admin' ? 'default' : 'secondary'}>{user.role}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={user.status === 'Active' ? 'default' : 'destructive'} className={user.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'}>{user.status}</Badge>
              </div>
               {showCreatedByColumn && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created By:</span>
                  <span>{user.createdBy?.fullName || 'N/A'}</span>
                </div>
               )}
               <div className="flex justify-between">
                <span className="text-muted-foreground">Created:</span>
                <span>{format(new Date(user.createdAt), "yyyy-MM-dd")}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Reset Request:</span>
                {user.passwordResetRequested ? (
                    <Badge variant="destructive">Requested</Badge>
                ) : (
                    <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-200 dark:border-green-800">No</Badge>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              {user.passwordResetRequested && (
                <Button variant="secondary" size="sm" onClick={() => resetPasswordMutation.mutate(user.id)} disabled={resetPasswordMutation.isPending && resetPasswordMutation.variables === user.id}>
                    {resetPasswordMutation.isPending && resetPasswordMutation.variables === user.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <KeyRound className="mr-2 h-4 w-4" />}
                    Reset Pass
                </Button>
              )}
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
              <SortableTableHead columnKey="role">Role</SortableTableHead>
              <SortableTableHead columnKey="status">Status</SortableTableHead>
              <SortableTableHead columnKey="passwordResetRequested">Reset Request</SortableTableHead>
              {showCreatedByColumn && <SortableTableHead columnKey="createdBy">Created By</SortableTableHead>}
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
                <TableCell className="whitespace-nowrap">
                  <Badge variant={user.role === 'Admin' || user.role === 'Super Admin' ? 'default' : 'secondary'}>
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                    <Badge variant={user.status === 'Active' ? 'default' : 'destructive'}
                        className={user.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'}>
                        {user.status}
                    </Badge>
                </TableCell>
                 <TableCell>
                    {user.passwordResetRequested ? (
                        <Badge variant="destructive">Requested</Badge>
                    ) : (
                         <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-200 dark:border-green-800">No</Badge>
                    )}
                 </TableCell>
                 {showCreatedByColumn && (
                    <TableCell className="whitespace-nowrap">{user.createdBy?.fullName || 'N/A'}</TableCell>
                 )}
                <TableCell className="whitespace-nowrap">{format(new Date(user.createdAt), "yyyy-MM-dd")}</TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <div className="flex justify-end items-center gap-1">
                    {user.passwordResetRequested && (
                       <Tooltip>
                         <TooltipTrigger asChild>
                            <Button variant="secondary" size="icon" onClick={() => resetPasswordMutation.mutate(user.id)} disabled={resetPasswordMutation.isPending && resetPasswordMutation.variables === user.id}>
                               {resetPasswordMutation.isPending && resetPasswordMutation.variables === user.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <KeyRound className="h-4 w-4" />}
                               <span className="sr-only">Reset Password</span>
                            </Button>
                         </TooltipTrigger>
                         <TooltipContent><p>Reset Password</p></TooltipContent>
                       </Tooltip>
                    )}
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
