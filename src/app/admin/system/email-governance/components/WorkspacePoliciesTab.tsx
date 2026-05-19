'use client';

import { useState, useMemo } from 'react';
import {
  Plus, Pencil, Trash2, Loader2, Save, X,
  Building2, Search, MoreHorizontal, ChevronsUpDown, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command, CommandInput, CommandList, CommandEmpty,
  CommandGroup, CommandItem,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import PolicyFormFields from './PolicyFormFields';
import { useEmailGovernancePolicies, usePolicyMutations, useWorkspaceSearch } from '../lib/hooks';
import type { EmailCapturePolicyDto } from '../lib/types';

interface WorkspacePoliciesTabProps {
  canUpdate: boolean;
  canDelete: boolean;
}

/** Default values for a brand-new workspace policy (mirrors the system default) */
function defaultWorkspacePolicy(): Partial<EmailCapturePolicyDto> {
  return {
    policyName: '',
    htmlSanitizationRequired: true,
    dangerousAttachmentsBlocked: true,
    malwareScanRequired: true,
    preserveOriginal: true,
    blockedExtensions: 'exe,bat,cmd,scr,js,vbs,wsf,ps1,msi,dll,com,pif,hta,cpl,reg,inf,lnk',
    attachmentExtractionEnabled: true,
    attachmentSubfolderEnabled: false,
    attachmentDestination: 'SAME_FOLDER',
    workflowAutoStartEnabled: false,
    userMailboxSyncAllowed: true,
    fullMailboxSyncAllowed: false,
    requireAdminApprovalForSync: false,
    maxMailboxesPerUser: 3,
    maxEmailsPerSync: 100,
    maxAttachmentSizeBytes: 25 * 1024 * 1024,
    maxEmailTotalSizeBytes: 150 * 1024 * 1024,
    allowedProviders: 'MICROSOFT_365_IMAP,GMAIL_IMAP,GENERIC_IMAP',
    duplicateHandling: 'REJECT',
    contentImmutable: true,
    auditCaptureEvent: true,
    metadataEditsAudited: true,
    recordsDeclarationEnabled: false,
    isActive: true,
    active: true,
  };
}

export default function WorkspacePoliciesTab({ canUpdate, canDelete }: WorkspacePoliciesTabProps) {
  const { policies, loading, refresh } = useEmailGovernancePolicies();
  const { saving, createPolicy, updatePolicy, deletePolicy } = usePolicyMutations(refresh);
  const { results: searchedWorkspaces, loading: wsLoading, search: searchWorkspaces } = useWorkspaceSearch();

  // ── State ──
  const [search, setSearch] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<EmailCapturePolicyDto | null>(null);
  const [formData, setFormData] = useState<Partial<EmailCapturePolicyDto>>(defaultWorkspacePolicy());
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('');
  const [selectedWorkspaceName, setSelectedWorkspaceName] = useState<string>('');
  const [wsPickerOpen, setWsPickerOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<EmailCapturePolicyDto | null>(null);

  // Filter out system default (workspaceId = null)
  const workspacePolicies = useMemo(() =>
    policies.filter(p => p.workspaceId !== null), [policies]);

  // Client-side search on the table (fine — limited to actual workspace policy rows)
  const filtered = useMemo(() => {
    if (!search.trim()) return workspacePolicies;
    const q = search.toLowerCase();
    return workspacePolicies.filter(p =>
      p.policyName?.toLowerCase().includes(q) ||
      p.workspace?.name?.toLowerCase().includes(q)
    );
  }, [workspacePolicies, search]);

  // Filter out workspaces that already have a policy (for the combobox)
  const usedWorkspaceIds = useMemo(() =>
    new Set(workspacePolicies.map(p => p.workspaceId)),
    [workspacePolicies]
  );
  const availableWorkspaces = useMemo(() =>
    searchedWorkspaces.filter(ws => !usedWorkspaceIds.has(ws.id)),
    [searchedWorkspaces, usedWorkspaceIds]
  );

  // ── Handlers ──
  const openCreate = () => {
    setEditingPolicy(null);
    setFormData(defaultWorkspacePolicy());
    setSelectedWorkspaceId('');
    setSelectedWorkspaceName('');
    searchWorkspaces(''); // Load initial workspace list
    setShowDialog(true);
  };

  const openEdit = (policy: EmailCapturePolicyDto) => {
    setEditingPolicy(policy);
    setFormData({ ...policy });
    setSelectedWorkspaceId(policy.workspaceId || '');
    setSelectedWorkspaceName(policy.workspace?.name || '');
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (editingPolicy) {
      await updatePolicy(editingPolicy.id, formData);
    } else {
      if (!selectedWorkspaceId) return;
      await createPolicy(selectedWorkspaceId, formData);
    }
    setShowDialog(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deletePolicy(deleteTarget.id);
    setDeleteTarget(null);
  };

  const formatDate = (d: string) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading workspace policies…</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or workspace…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
          <Badge variant="secondary" className="font-normal">
            {workspacePolicies.length} workspace {workspacePolicies.length === 1 ? 'policy' : 'policies'}
          </Badge>
        </div>
        <Button
          onClick={openCreate}
          disabled={!canUpdate}
          className="gap-2"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          Create Policy
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="font-semibold">Policy Name</TableHead>
              <TableHead className="font-semibold">Workspace</TableHead>
              <TableHead className="font-semibold text-center">Status</TableHead>
              <TableHead className="font-semibold">Created</TableHead>
              <TableHead className="font-semibold">Last Modified</TableHead>
              <TableHead className="font-semibold text-right w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  {workspacePolicies.length === 0 ? (
                    <div>
                      <Building2 className="h-10 w-10 mx-auto mb-2 text-muted-foreground/40" />
                      <p className="font-medium">No workspace policies yet</p>
                      <p className="text-sm mt-1">All workspaces are using the system default. Create a custom policy to override it.</p>
                    </div>
                  ) : (
                    <p>No policies match your search.</p>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => (
                <TableRow key={p.id} className="group hover:bg-muted/20 transition-colors">
                  <TableCell className="font-medium">{p.policyName || '(Unnamed)'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{p.workspace?.name || p.workspaceId}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={p.active || p.isActive ? 'default' : 'secondary'} className="text-xs">
                      {p.active || p.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(p.createdAt)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(p.updatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(p)} disabled={!canUpdate}>
                          <Pencil className="h-3.5 w-3.5 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteTarget(p)}
                          disabled={!canDelete}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Create / Edit Dialog ── */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPolicy ? 'Edit Workspace Policy' : 'Create Workspace Policy'}
            </DialogTitle>
            <DialogDescription>
              {editingPolicy
                ? `Editing policy for workspace: ${editingPolicy.workspace?.name || editingPolicy.workspaceId}`
                : 'Create a custom policy override for a specific workspace. Search to find the workspace.'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* ── Workspace Picker (search-as-you-type combobox — only for create) ── */}
            {!editingPolicy && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Target Workspace</Label>
                <Popover open={wsPickerOpen} onOpenChange={setWsPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={wsPickerOpen}
                      className="w-full justify-between font-normal"
                    >
                      {selectedWorkspaceName ? (
                        <span className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          {selectedWorkspaceName}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Search and select a workspace…</span>
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Type to search workspaces…"
                        onValueChange={(val) => searchWorkspaces(val)}
                      />
                      <CommandList>
                        {wsLoading ? (
                          <div className="flex items-center justify-center py-6">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mr-2" />
                            <span className="text-sm text-muted-foreground">Searching…</span>
                          </div>
                        ) : (
                          <>
                            <CommandEmpty>No workspaces found.</CommandEmpty>
                            <CommandGroup>
                              {availableWorkspaces.map(ws => (
                                <CommandItem
                                  key={ws.id}
                                  value={ws.id}
                                  onSelect={() => {
                                    setSelectedWorkspaceId(ws.id);
                                    setSelectedWorkspaceName(ws.name);
                                    setWsPickerOpen(false);
                                    // Auto-fill policy name
                                    if (!formData.policyName) {
                                      setFormData(prev => ({
                                        ...prev,
                                        policyName: `${ws.name} — Email Capture Policy`
                                      }));
                                    }
                                  }}
                                >
                                  <Check className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedWorkspaceId === ws.id ? "opacity-100" : "opacity-0"
                                  )} />
                                  <Building2 className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                                  <div className="flex flex-col">
                                    <span className="text-sm">{ws.name}</span>
                                    {ws.code && (
                                      <span className="text-xs text-muted-foreground">{ws.code}</span>
                                    )}
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground">
                  Workspaces that already have a custom policy are excluded from the list.
                </p>
              </div>
            )}

            {/* Policy name */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Policy Name</Label>
              <Input
                value={formData.policyName || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, policyName: e.target.value }))}
                placeholder="e.g., Marketing Workspace — Email Policy"
              />
            </div>

            {/* Full form */}
            <PolicyFormFields
              policy={formData}
              onChange={(updates) => setFormData(prev => ({ ...prev, ...updates }))}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDialog(false)} className="gap-2">
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || (!editingPolicy && !selectedWorkspaceId)}
              className="gap-2"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'Saving…' : editingPolicy ? 'Update Policy' : 'Create Policy'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workspace Policy?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the policy
              <strong className="mx-1">&quot;{deleteTarget?.policyName || 'Unnamed'}&quot;</strong>
              for workspace
              <strong className="mx-1">&quot;{deleteTarget?.workspace?.name || deleteTarget?.workspaceId}&quot;</strong>?
              <br /><br />
              Users in this workspace will fall back to the <strong>System Default</strong> policy.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete Policy
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
