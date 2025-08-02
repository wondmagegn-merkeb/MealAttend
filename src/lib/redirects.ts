
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
    // Super Admins are typically expected to have all permissions, but we still check.
    if (user.role === 'Super Admin' && user.canReadDashboard) {
        return '/admin';
    }

    // Find the first route in the priority list that the user has permission for.
    for (const route of prioritizedRoutes) {
        // The permission property can be a permission key or `true` for a public/fallback page.
        // `user[route.permission]` checks if the user object has a truthy value for that permission key.
        if (route.permission === true || (user.role !== 'Super Admin' && user[route.permission as PermissionKey])) {
            return route.path;
        }
    }
    
    // Fallback for users (including Super Admins without dashboard access) who don't match any route.
    return '/admin/profile/my-permissions';
}
