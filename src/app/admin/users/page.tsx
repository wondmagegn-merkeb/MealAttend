
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PlusCircle, Users as UsersIcon, Loader2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { UsersTable } from "@/components/admin/users/UsersTable";
import type { User } from "@/types/user";
import { useToast } from "@/hooks/use-toast";
import { USERS_STORAGE_KEY } from '@/lib/constants';

// Initial seed data if localStorage is empty
const initialSeedUsers: User[] = [
  { id: 'usr_smp_001', fullName: 'Alice Admin', department: 'Management', email: 'alice.admin@example.com', createdAt: new Date('2023-01-10T10:00:00Z').toISOString(), updatedAt: new Date('2023-01-10T10:00:00Z').toISOString() },
  { id: 'usr_smp_002', fullName: 'Bob Operator', department: 'Operations', email: 'bob.operator@example.com', createdAt: new Date('2023-02-15T11:30:00Z').toISOString(), updatedAt: new Date('2023-02-15T11:30:00Z').toISOString() },
  { id: 'usr_smp_003', fullName: 'Carol Support', department: 'Customer Support', email: 'carol.support@example.com', createdAt: new Date('2023-03-20T09:15:00Z').toISOString(), updatedAt: new Date('2023-03-20T09:15:00Z').toISOString() },
];

type SortableUserKeys = 'fullName' | 'department' | 'email' | 'createdAt';
type SortDirection = 'ascending' | 'descending';

interface SortConfig {
  key: SortableUserKeys | null;
  direction: SortDirection;
}

const ITEMS_PER_PAGE = 5;

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoadingTable, setIsLoadingTable] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'createdAt', direction: 'descending' });
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setIsMounted(true);
    try {
      const storedUsersRaw = localStorage.getItem(USERS_STORAGE_KEY);
      if (storedUsersRaw) {
        setUsers(JSON.parse(storedUsersRaw));
      } else {
        setUsers(initialSeedUsers);
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(initialSeedUsers));
      }
    } catch (error) {
      console.error("Failed to load users from localStorage", error);
      setUsers(initialSeedUsers); 
      toast({
        title: "Error",
        description: "Could not load user data. Displaying default list.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const handleEditUser = (user: User) => {
    router.push(`/admin/users/${user.id}/edit`);
  };

  const handleDeleteUser = (userIdToDelete: string) => {
    setIsLoadingTable(true);
    setTimeout(() => {
      try {
        const updatedUsers = users.filter(u => u.id !== userIdToDelete);
        setUsers(updatedUsers);
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
        toast({
          title: "User Deleted",
          description: "The user record has been successfully deleted.",
        });
        
        const totalPagesAfterDelete = Math.ceil(updatedUsers.filter(user =>
          user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
        ).length / ITEMS_PER_PAGE);

        if (currentPage > totalPagesAfterDelete && totalPagesAfterDelete > 0) {
          setCurrentPage(totalPagesAfterDelete);
        } else if (totalPagesAfterDelete === 0) {
          setCurrentPage(1);
        }

      } catch (error) {
        console.error("Failed to delete user from localStorage", error);
        toast({
          title: "Error",
          description: "Failed to delete user. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingTable(false);
      }
    }, 500);
  };

  const handleSort = (key: SortableUserKeys) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const filteredAndSortedUsers = useMemo(() => {
    let processedUsers = [...users];

    if (searchTerm) {
      processedUsers = processedUsers.filter(user =>
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (sortConfig.key) {
      processedUsers.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];

        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;
        
        let comparison = 0;
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = aValue.localeCompare(bValue);
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue;
        } else { 
          comparison = String(aValue).localeCompare(String(bValue));
        }

        return sortConfig.direction === 'ascending' ? comparison : -comparison;
      });
    }
    return processedUsers;
  }, [users, searchTerm, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedUsers.length / ITEMS_PER_PAGE));
  
  const currentTableData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredAndSortedUsers.slice(startIndex, endIndex);
  }, [filteredAndSortedUsers, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);


  if (!isMounted) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading user management...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-primary flex items-center">
            <UsersIcon className="mr-3 h-8 w-8" /> Manage Users
          </h2>
          <p className="text-muted-foreground">Add, edit, or remove user records.</p>
        </div>
        <Button asChild size="lg" className="shadow-md hover:shadow-lg transition-shadow">
          <Link href="/admin/users/new">
            <PlusCircle className="mr-2 h-5 w-5" /> Add New User
          </Link>
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>User List</CardTitle>
          <CardDescription>Browse and manage all registered users. Data is stored in your browser's local storage.</CardDescription>
           <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name, department, or email..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10 w-full sm:w-1/2 md:w-1/3"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingTable && (
            <div className="flex justify-center items-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2">Updating table...</span>
            </div>
          )}
          <UsersTable 
            users={currentTableData} 
            onEdit={handleEditUser} 
            onDelete={handleDeleteUser}
            sortConfig={sortConfig}
            onSort={handleSort}
          />
          {filteredAndSortedUsers.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between pt-4 mt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages} ({filteredAndSortedUsers.length} users)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
           {filteredAndSortedUsers.length === 0 && !isLoadingTable && (
             <p className="text-center text-muted-foreground py-4">No users match your current search criteria.</p>
           )}
        </CardContent>
      </Card>
    </div>
  );
}
