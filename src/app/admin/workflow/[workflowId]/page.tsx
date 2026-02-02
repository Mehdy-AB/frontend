'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

/**
 * Redirects to the visual workflow designer page when accessing /workflow/[workflowId]
 * The designer page handles both creating new workflows and editing existing ones.
 */
export default function WorkflowDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workflowId = params?.workflowId as string;

  useEffect(() => {
    if (workflowId) {
      // Redirect to the visual designer for editing
      router.replace(`/admin/workflow/designer?id=${workflowId}`);
    } else {
      // Fallback to workflow list
      router.replace('/admin/workflow');
    }
  }, [workflowId, router]);

  // Show loading while redirecting
  return (
    <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}
