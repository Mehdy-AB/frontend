'use client';

import { useSession } from 'next-auth/react';

/**
 * Hook to access user permissions from the session
 */
export function usePermissions() {
  const { data: session } = useSession();
  
  // Get permissions from session user
  const permissions: string[] = (session?.user as any)?.permissions || [];

  /**
   * Check if user has a specific permission
   */
  const hasPermission = (permission: string): boolean => {
    if (!permission) return false;
    return permissions.includes(permission);
  };

  /**
   * Check if user has any of the specified permissions
   */
  const hasAnyPermission = (...permissionList: string[]): boolean => {
    if (permissionList.length === 0) return false;
    return permissionList.some(permission => permissions.includes(permission));
  };

  /**
   * Check if user has all of the specified permissions
   */
  const hasAllPermissions = (...permissionList: string[]): boolean => {
    if (permissionList.length === 0) return false;
    return permissionList.every(permission => permissions.includes(permission));
  };

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
}

