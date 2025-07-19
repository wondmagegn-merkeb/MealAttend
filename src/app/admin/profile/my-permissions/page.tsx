
"use client";

import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, ShieldCheck, XCircle } from 'lucide-react';

interface PermissionItemProps {
  label: string;
  granted: boolean;
}

const PermissionItem = ({ label, granted }: PermissionItemProps) => (
  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
    <span className="font-medium text-muted-foreground">{label}</span>
    {granted ? (
      <span className="flex items-center text-sm font-semibold text-green-600">
        <CheckCircle className="mr-2 h-4 w-4" /> Granted
      </span>
    ) : (
      <span className="flex items-center text-sm font-semibold text-red-600">
        <XCircle className="mr-2 h-4 w-4" /> Denied
      </span>
    )}
  </div>
);

export default function MyPermissionsPage() {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Loading user permissions...</p>
      </div>
    );
  }

  const permissionGroups = [
    {
      title: 'General Access',
      permissions: [
        { label: 'View Dashboard', granted: currentUser.canReadDashboard },
        { label: 'Scan ID Cards', granted: currentUser.canScanId },
      ],
    },
    {
      title: 'Student Management',
      permissions: [
        { label: 'View Students', granted: currentUser.canReadStudents },
        { label: 'Create Students', granted: currentUser.canCreateStudents },
        { label: 'Edit Students', granted: currentUser.canWriteStudents },
        { label: 'Delete Students', granted: currentUser.canDeleteStudents },
        { label: 'Export Student Lists', granted: currentUser.canExportStudents },
      ],
    },
    {
      title: 'Attendance Records',
      permissions: [
        { label: 'View Attendance Records', granted: currentUser.canReadAttendance },
        { label: 'Export Attendance Data', granted: currentUser.canExportAttendance },
      ],
    },
    {
      title: 'System Administration',
      permissions: [
        { label: 'View Activity Logs', granted: currentUser.canReadActivityLog },
        { label: 'View Users', granted: currentUser.canReadUsers },
        { label: 'Manage Users', granted: currentUser.canWriteUsers },
        { label: 'View Departments', granted: currentUser.canReadDepartments },
        { label: 'Manage Departments', granted: currentUser.canWriteDepartments },
      ],
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
       <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-primary flex items-center">
            <ShieldCheck className="mr-3 h-8 w-8" /> My Permissions
          </h2>
          <p className="text-muted-foreground">
            These are the permissions assigned to your account by an administrator.
          </p>
        </div>
         <Button variant="outline" asChild>
          <Link href="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Permission Overview for {currentUser.fullName}</CardTitle>
          <CardDescription>Role: {currentUser.role}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {permissionGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-lg font-semibold mb-3 text-primary">{group.title}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {group.permissions.map((perm) => (
                  <PermissionItem key={perm.label} label={perm.label} granted={perm.granted} />
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
