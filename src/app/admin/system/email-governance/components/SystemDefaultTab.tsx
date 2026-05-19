'use client';

import { Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import PolicyFormFields from './PolicyFormFields';
import { useDefaultPolicy } from '../lib/hooks';

interface SystemDefaultTabProps {
  canUpdate: boolean;
}

export default function SystemDefaultTab({ canUpdate }: SystemDefaultTabProps) {
  const { policy, setPolicy, loading, saving, savePolicy } = useDefaultPolicy();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading system default policy…</span>
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p>System default policy not found.</p>
        <p className="text-sm mt-1">This should not happen — the system seeds a default on startup.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header info */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{policy.policyName}</h3>
            <Badge variant="outline" className="text-xs font-normal">System Default</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            These settings apply to all workspaces that don&apos;t have a custom override policy.
          </p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => savePolicy(policy)}
              disabled={saving || !canUpdate}
              className="gap-2"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </TooltipTrigger>
          {!canUpdate && (
            <TooltipContent>
              <p>You don&apos;t have permission to update policies</p>
            </TooltipContent>
          )}
        </Tooltip>
      </div>

      {/* Form fields */}
      <PolicyFormFields
        policy={policy}
        onChange={(updates) => setPolicy((prev) => prev ? { ...prev, ...updates } : prev)}
        disabled={!canUpdate}
      />

      {/* Bottom save bar */}
      <div className="flex justify-end pt-2 border-t">
        <Button
          onClick={() => savePolicy(policy)}
          disabled={saving || !canUpdate}
          className="gap-2"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
