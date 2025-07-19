
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BookUser, UsersRound, PlusCircle, LayoutGrid } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function QuickActions() {
    const { currentUserRole, currentUser } = useAuth();

    const allActions = [
        { href: '/admin/attendance', label: 'View Attendance', icon: BookUser, permission: 'canReadAttendance' },
        { href: '/admin/students/new', label: 'Add New Student', icon: PlusCircle, permission: 'canCreateStudents' },
        { href: '/admin/students', label: 'Manage Students', icon: UsersRound, permission: 'canReadStudents' },
        { href: '/admin/users/new', label: 'Add New User', icon: PlusCircle, permission: 'canWriteUsers' },
    ];

    const availableActions = allActions.filter(action => {
        if (!currentUser) return false;
        // Super Admins see everything
        if (currentUser.role === 'Super Admin') return true;
        // Check permission for other roles
        return currentUser[action.permission as keyof typeof currentUser];
    });

    if (availableActions.length === 0) {
        return (
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><LayoutGrid className="h-5 w-5 text-primary"/> Quick Actions</CardTitle>
                    <CardDescription>Navigate to common tasks quickly.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-center py-4">No quick actions available for your role.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><LayoutGrid className="h-5 w-5 text-primary"/> Quick Actions</CardTitle>
                <CardDescription>Navigate to common tasks quickly.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {availableActions.map(action => (
                         <Link href={action.href} key={action.href} legacyBehavior>
                            <a className="flex flex-col items-center justify-center p-4 bg-muted/50 hover:bg-muted rounded-lg transition-colors text-center space-y-2">
                                <action.icon className="h-8 w-8 text-primary" />
                                <span className="text-sm font-medium text-muted-foreground">{action.label}</span>
                            </a>
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
