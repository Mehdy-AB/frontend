'use client';

import { usePathname } from 'next/navigation';
import { usePermissions } from './usePermissions';
import { AdminPagePermissions } from '@/constants/permissions';

/**
 * Hook to get permissions for the current admin page
 */
export function useAdminPagePermissions() {
  const pathname = usePathname();
  const { hasPermission } = usePermissions();
  
  const pagePermissions = AdminPagePermissions[pathname] || {};
  
  return {
    canView: !pagePermissions.view || hasPermission(pagePermissions.view),
    canCreate: pagePermissions.create ? hasPermission(pagePermissions.create) : false,
    canUpdate: pagePermissions.update ? hasPermission(pagePermissions.update) : false,
    canDelete: pagePermissions.delete ? hasPermission(pagePermissions.delete) : false,
    canAssign: pagePermissions.assign ? hasPermission(pagePermissions.assign) : false,
  };
}

