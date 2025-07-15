
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Users as UsersIcon, Loader2, Search, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { UsersTable } from "@/components/admin/users/UsersTable";
import { useToast } from "@/hooks/use-toast";
import { logUserActivity } from '@/lib/activityLogger';
import { useAuth } from '@/hooks/useAuth';
import type { UserWithDepartment } from '@/types';


const fetchUsers = async (): Promise<UserWithDepartment[]> => {
  const response = await fetch('/api/users');
  if (!response.ok) throw new Error('Failed to fetch users');
  return response.json();
};

const deleteUser = async (userId: string) => {
  const response = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to delete user');
  }
};


type SortableUserKeys = 'userId' | 'fullName' | 'department' | 'email' | 'role' | 'status' | 'createdAt';
type SortDirection = 'ascending' | 'descending';

interface SortConfig {
  key: SortableUserKeys | null;
  direction: SortDirection;
}

const ITEMS_PER_PAGE = 5;

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentUserId: actorUserId } = useAuth();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'createdAt', direction: 'descending' });
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: users = [], isLoading: isLoadingUsers, error: usersError } = useQuery<UserWithDepartment[]>({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: (_, deletedUserId) => {
      const deletedUser = users.find(u => u.id === deletedUserId);
      toast({ title: "User Deleted", description: "The user record has been successfully deleted." });
      logUserActivity(actorUserId, "USER_DELETE_SUCCESS", `Deleted user ID: ${deletedUser?.userId || 'N/A'}, Name: ${deletedUser?.fullName || 'Unknown'}`);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: Error) => {
      toast({ title: "Error Deleting User", description: error.message, variant: "destructive" });
    }
  });


  const handleEditUser = (user: UserWithDepartment) => {
    router.push(`/admin/users/${user.id}/edit`);
  };

  const handleDeleteUser = (internalUserId: string) => {
    deleteMutation.mutate(internalUserId);
  };

  const handleSort = (key: SortableUserKeys) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const filteredAndSortedUsers = useMemo(() => {
    let processedUsers = [...users];
    
    if (statusFilter !== 'all') {
      processedUsers = processedUsers.filter(user => user.status === statusFilter);
    }
    
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      processedUsers = processedUsers.filter(user =>
        (user.userId && user.userId.toLowerCase().includes(lowerSearchTerm)) ||
        user.fullName.toLowerCase().includes(lowerSearchTerm) ||
        (user.department && user.department.name.toLowerCase().includes(lowerSearchTerm)) ||
        user.email.toLowerCase().includes(lowerSearchTerm) ||
        user.role.toLowerCase().includes(lowerSearchTerm) 
      );
    }
    if (sortConfig.key) {
      processedUsers.sort((a, b) => {
        const aValue = sortConfig.key === 'department' ? a.department?.name : a[sortConfig.key!];
        const bValue = sortConfig.key === 'department' ? b.department?.name : b[sortConfig.key!];
        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;
        let comparison = String(aValue).localeCompare(String(bValue));
        return sortConfig.direction === 'ascending' ? comparison : -comparison;
      });
    }
    return processedUsers;
  }, [users, searchTerm, sortConfig, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedUsers.length / ITEMS_PER_PAGE));
  
  const currentTableData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredAndSortedUsers.slice(startIndex, endIndex);
  }, [filteredAndSortedUsers, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
    else if (currentPage < 1 && totalPages > 0) setCurrentPage(1);
    else if (filteredAndSortedUsers.length === 0) setCurrentPage(1);
  }, [currentPage, totalPages, filteredAndSortedUsers.length]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-primary flex items-center"><UsersIcon className="mr-3 h-8 w-8" /> Manage Users</h2>
          <p className="text-muted-foreground">Add, edit, or remove user records. Access restricted to Admins.</p>
        </div>
        <Button asChild size="lg" className="shadow-md hover:shadow-lg transition-shadow">
          <Link href="/admin/users/new"><PlusCircle className="mr-2 h-5 w-5" /> Add New User</Link>
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>User List</CardTitle>
          <CardDescription>Browse and manage all registered users.</CardDescription>
           <div className="mt-4 flex flex-col sm:flex-row gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Search by ID, name, email, etc..." value={searchTerm} onChange={handleSearchChange} className="pl-10 w-full sm:w-64 md:w-72" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingUsers ? (
            <div className="flex justify-center items-center py-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /><span className="ml-2">Loading users...</span></div>
          ) : usersError ? (
            <div className="text-center py-10 text-destructive"><AlertTriangle className="mx-auto h-8 w-8 mb-2" /><p>Error loading users: {(usersError as Error).message}</p></div>
          ) : (
             <UsersTable users={currentTableData} onEdit={handleEditUser} onDelete={handleDeleteUser} sortConfig={sortConfig} onSort={handleSort} />
          )}
          
          {!isLoadingUsers && !usersError && filteredAndSortedUsers.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between pt-4 mt-4 border-t">
              <p className="text-sm text-muted-foreground">Page {currentPage} of {totalPages} ({filteredAndSortedUsers.length} users)</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}><ChevronLeft className="mr-1 h-4 w-4" />Previous</Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>Next<ChevronRight className="ml-1 h-4 w-4" /></Button>
              </div>
            </div>
          )}
          {!isLoadingUsers && !usersError && filteredAndSortedUsers.length === 0 && (<p className="text-center text-muted-foreground py-4">No users match your current search criteria.</p>)}
        </CardContent>
      </Card>
    </div>
  );
}
