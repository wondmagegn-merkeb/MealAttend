
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BookUser, UsersRound, PlusCircle, LayoutGrid } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function QuickActions() {
    const { currentUserRole } = useAuth();

    const allActions = [
        { href: '/admin/attendance', label: 'View Attendance', icon: BookUser, roles: ['Admin', 'User'] },
        { href: '/admin/students/new', label: 'Add New Student', icon: PlusCircle, roles: ['Admin', 'User'] },
        { href: '/admin/students', label: 'Manage Students', icon: UsersRound, roles: ['Admin', 'User'] },
        { href: '/admin/users/new', label: 'Add New User', icon: PlusCircle, roles: ['Admin'] },
    ];

    const availableActions = allActions.filter(action => currentUserRole && action.roles.includes(currentUserRole));

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
