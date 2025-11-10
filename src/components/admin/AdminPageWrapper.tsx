'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminPagePermissions } from '@/hooks/useAdminPagePermissions';

interface AdminPageWrapperProps {
  children: React.ReactNode;
  loading?: boolean;
}

/**
 * Wrapper component for admin pages that handles permission checks and redirects
 */
export function AdminPageWrapper({ children, loading = false }: AdminPageWrapperProps) {
  const router = useRouter();
  const { canView } = useAdminPagePermissions();

  useEffect(() => {
    if (!loading && !canView) {
      router.push('/');
    }
  }, [loading, canView, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-destructive text-lg">You don't have permission to view this page</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

