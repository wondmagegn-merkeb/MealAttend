
import type { User, PermissionKey } from "@/types";

interface RouteDefinition {
    path: string;
    permission: PermissionKey | true;
}

// Defines the priority of pages for redirection.
// The first page in this list that a user has permission for will be their "home" page.
const prioritizedRoutes: RouteDefinition[] = [
    { path: '/admin', permission: 'canReadDashboard' },
    { path: '/admin/attendance', permission: 'canReadAttendance' },
    { path: '/admin/students', permission: 'canReadStudents' },
    { path: '/admin/users', permission: 'canReadUsers' },
    { path: '/admin/activity-log', permission: 'canReadActivityLog' },
    { path: '/admin/profile/my-permissions', permission: true } // Fallback for users with no other permissions
];


/**
 * Determines the most appropriate page to redirect a user to after login.
 * @param user The authenticated user object.
 * @returns The path of the first page the user has permission to view.
 */
export function getRedirectPathForUser(user: User): string {
    // Super Admins always go to the main dashboard.
    if (user.role === 'Super Admin') {
        return '/admin';
    }

    // Find the first route in the priority list that the user has permission for.
    for (const route of prioritizedRoutes) {
        if (route.permission === true || user[route.permission]) {
            return route.path;
        }
    }

    // Default fallback, though the prioritizedRoutes should always have a 'true' permission fallback.
    return '/admin/profile/my-permissions';
}
