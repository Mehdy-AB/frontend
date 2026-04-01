'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { orgUnitService, ScopedRoleAssignmentDto, ScopedRoleDto } from '@/api/services/orgUnitService';
import { Shield, Plus, X, ChevronDown, Loader2, Info } from 'lucide-react';
import { useNotification } from '@/contexts/NotificationContext';

interface HeadScopedRolesPanelProps {
  orgUnitId: string;
  headUserId: string | null;
  headDisplayName: string | null;
  canEdit: boolean;
}

export default function HeadScopedRolesPanel({ orgUnitId, headUserId, headDisplayName, canEdit }: HeadScopedRolesPanelProps) {
  const { addNotification } = useNotification();
  const [assignments, setAssignments] = useState<ScopedRoleAssignmentDto[]>([]);
  const [available, setAvailable] = useState<ScopedRoleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [granting, setGranting] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!headUserId) {
      setAssignments([]);
      setAvailable([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [roles, avail] = await Promise.all([
        orgUnitService.getHeadScopedRoles(orgUnitId),
        canEdit ? orgUnitService.getAvailableScopedRoles(orgUnitId) : Promise.resolve([]),
      ]);
      setAssignments(roles);
      setAvailable(avail);
    } catch (error) {
      console.error('Failed to load scoped roles', error);
    } finally {
      setLoading(false);
    }
  }, [orgUnitId, headUserId, canEdit]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleGrant = async (roleCode: string) => {
    try {
      setGranting(roleCode);
      const assignment = await orgUnitService.grantScopedRole(orgUnitId, roleCode);
      setAssignments(prev => [...prev, assignment]);
      setAvailable(prev => prev.filter(r => r.code !== roleCode));
      setShowAddMenu(false);
      addNotification({ type: 'success', title: 'Role Granted', message: `Granted ${assignment.roleName}` });
    } catch (error: any) {
      addNotification({ type: 'error', title: 'Failed to grant role', message: error?.response?.data?.message || 'Unknown error' });
    } finally {
      setGranting(null);
    }
  };

  const handleRevoke = async (roleCode: string) => {
    try {
      setRevoking(roleCode);
      await orgUnitService.revokeScopedRole(orgUnitId, roleCode);
      setAssignments(prev => prev.filter(a => a.roleCode !== roleCode));
      // Reload available
      if (canEdit) {
        const avail = await orgUnitService.getAvailableScopedRoles(orgUnitId);
        setAvailable(avail);
      }
      addNotification({ type: 'success', title: 'Role Revoked', message: 'Scoped role revoked' });
    } catch (error: any) {
      addNotification({ type: 'error', title: 'Failed to revoke role', message: error?.response?.data?.message || 'Unknown error' });
    } finally {
      setRevoking(null);
    }
  };

  if (!headUserId) {
    return (
      <div className="p-4 rounded-xl border bg-card">
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
          <Shield className="w-4 h-4 text-purple-500" />
          Head Scoped Roles
        </h3>
        <p className="text-xs text-muted-foreground">
          No head assigned. Assign a head to manage their scoped roles.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 rounded-xl border bg-card">
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-purple-500" />
          Head Scoped Roles
        </h3>
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl border bg-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Shield className="w-4 h-4 text-purple-500" />
          Scoped Roles for {headDisplayName || 'Head'}
        </h3>
        {canEdit && available.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Role
              <ChevronDown className={`w-3 h-3 transition-transform ${showAddMenu ? 'rotate-180' : ''}`} />
            </button>

            {showAddMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowAddMenu(false)} />
                <div className="absolute right-0 top-full mt-1.5 w-72 bg-popover border rounded-xl shadow-lg z-20 py-2">
                  {available.map(role => (
                    <button
                      key={role.code}
                      onClick={() => handleGrant(role.code)}
                      disabled={granting === role.code}
                      className="w-full text-left px-3 py-2.5 hover:bg-accent/50 transition-colors disabled:opacity-50"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{role.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{role.description}</p>
                        </div>
                        {granting === role.code ? (
                          <Loader2 className="w-4 h-4 animate-spin text-primary flex-shrink-0" />
                        ) : (
                          <Plus className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Role Assignments */}
      {assignments.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">No scoped roles assigned yet.</p>
      ) : (
        <div className="space-y-2">
          {assignments.map(a => (
            <div
              key={a.id}
              className="flex items-center justify-between p-2.5 rounded-lg border bg-background/50 group"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <Shield className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{a.roleName}</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {a.roleDescription}
                    {a.source === 'system' && (
                      <span className="ml-1 text-amber-600 dark:text-amber-400">· Auto-granted</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {canEdit && (
                  <button
                    onClick={() => handleRevoke(a.roleCode)}
                    disabled={revoking === a.roleCode}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all disabled:opacity-50"
                    title="Revoke role"
                  >
                    {revoking === a.roleCode ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <X className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Footer */}
      <p className="text-[11px] text-muted-foreground mt-3 px-1">
        <Info className="w-3 h-3 inline mr-1 -mt-0.5" />
        Roles marked <span className="font-medium">Auto-granted</span> were provisioned with leadership. All roles can be added or revoked.
      </p>
    </div>
  );
}
