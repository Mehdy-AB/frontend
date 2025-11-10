/**
 * Helper utility to add permission checks to admin pages
 * This provides a consistent pattern for permission checking
 */

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAdminPagePermissions } from '@/hooks/useAdminPagePermissions';

/**
 * Hook that adds permission checking and redirect logic to admin pages
 * Returns permission flags and handles redirect if user lacks view permission
 */
export function useAdminPageAccess() {
  const router = useRouter();
  const permissions = useAdminPagePermissions();

  useEffect(() => {
    if (!permissions.canView) {
      router.push('/');
    }
  }, [permissions.canView, router]);

  return permissions;
}

