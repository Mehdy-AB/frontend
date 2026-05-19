'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Globe, Building2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminPagePermissions } from '@/hooks/useAdminPagePermissions';
import SystemDefaultTab from './components/SystemDefaultTab';
import WorkspacePoliciesTab from './components/WorkspacePoliciesTab';

export default function EmailGovernancePage() {
  const router = useRouter();
  const { canView, canUpdate, canDelete } = useAdminPagePermissions();
  const [activeTab, setActiveTab] = useState('system-default');

  useEffect(() => {
    if (!canView) {
      router.push('/');
    }
  }, [canView, router]);

  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto mb-3 text-destructive/50" />
          <p className="text-destructive text-lg font-medium">Access Denied</p>
          <p className="text-muted-foreground text-sm mt-1">You don&apos;t have permission to view email governance settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-semibold">Email Governance</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Configure email capture policies, security enforcement, and compliance rules.
            The system default applies to all workspaces unless overridden.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="system-default" className="gap-2">
            <Globe className="h-4 w-4" />
            System Default
          </TabsTrigger>
          <TabsTrigger value="workspace-policies" className="gap-2">
            <Building2 className="h-4 w-4" />
            Workspace Policies
          </TabsTrigger>
        </TabsList>

        <TabsContent value="system-default">
          <SystemDefaultTab canUpdate={canUpdate} />
        </TabsContent>

        <TabsContent value="workspace-policies">
          <WorkspacePoliciesTab canUpdate={canUpdate} canDelete={canDelete} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
