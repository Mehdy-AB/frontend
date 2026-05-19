'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Mail, Plus, Trash2, Power, PowerOff, RefreshCw, Clock,
  CheckCircle2, XCircle, AlertTriangle, Wifi, WifiOff,
  ExternalLink, FolderOpen, Inbox, ChevronDown, ChevronUp,
  Shield, Zap, Activity, Eye, EyeOff, Server, Edit3,
  Search, X, Folder, FileText, Paperclip, Save, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useNotification } from '@/contexts/NotificationContext';
import {
  mailboxSyncService,
  MailboxConnectionResponse,
  MailboxConnectionRequest,
  MailboxProvider,
  MailboxConnectionStatus,
  MailboxSyncLogResponse,
  AttachmentDestination,
} from '@/api/services/emailCaptureService';
import { FilingCategoryResponseDto } from '@/types/api';
import FolderPickerModal from '@/components/modals/FolderPickerModal';

// ==================== PROPS ====================

interface MailboxSyncSectionProps {
  defaultFolderId?: number;
  defaultFolderName?: string;
  defaultModelId?: number;
  defaultModelName?: string;
  defaultAttachmentDest?: AttachmentDestination;
  defaultAutoExtract?: boolean;
  availableModels: FilingCategoryResponseDto[];
}

// ==================== CONSTANTS ====================

const PROVIDERS: { value: MailboxProvider; label: string; icon: string; color: string; desc: string }[] = [
  { value: 'MICROSOFT_365_IMAP', label: 'Microsoft 365', icon: '🏢', color: '#3b82f6', desc: 'Outlook / Office 365 via OAuth2' },
  { value: 'GMAIL_IMAP', label: 'Gmail', icon: '📧', color: '#3b82f6', desc: 'Google Workspace via OAuth2' },
  { value: 'GENERIC_IMAP', label: 'IMAP Server', icon: '🖧', color: '#3b82f6', desc: 'Any IMAP server with username/password' },
];


const ATTACHMENT_DESTS: { value: AttachmentDestination; label: string }[] = [
  { value: 'SAME_FOLDER', label: 'Same folder' },
  { value: 'SUBFOLDER', label: 'Sub-folder' },
];

const STATUS_CONFIG: Record<MailboxConnectionStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  PENDING: { label: 'Pending Setup', color: 'text-amber-600', bg: 'bg-amber-100', icon: <Clock className="h-3.5 w-3.5" /> },
  CONNECTED: { label: 'Connected', color: 'text-emerald-600', bg: 'bg-emerald-100', icon: <Wifi className="h-3.5 w-3.5" /> },
  DISCONNECTED: { label: 'Disconnected', color: 'text-gray-500', bg: 'bg-gray-100', icon: <WifiOff className="h-3.5 w-3.5" /> },
  AUTH_EXPIRED: { label: 'Auth Expired', color: 'text-red-600', bg: 'bg-red-100', icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  ERROR: { label: 'Error', color: 'text-red-600', bg: 'bg-red-100', icon: <XCircle className="h-3.5 w-3.5" /> },
  DISABLED: { label: 'Disabled', color: 'text-gray-500', bg: 'bg-gray-100', icon: <PowerOff className="h-3.5 w-3.5" /> },
  AWAITING_APPROVAL: { label: 'Awaiting Approval', color: 'text-blue-600', bg: 'bg-blue-100', icon: <Shield className="h-3.5 w-3.5" /> },
};

function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// ==================== MAIN COMPONENT ====================

export default function MailboxSyncSection({
  defaultFolderId, defaultFolderName, defaultModelId, defaultModelName,
  defaultAttachmentDest, defaultAutoExtract, availableModels,
}: MailboxSyncSectionProps) {
  const [connections, setConnections] = useState<MailboxConnectionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [activeWatchers, setActiveWatchers] = useState(0);
  // Review queue
  const [showReviewQueue, setShowReviewQueue] = useState(false);
  const [reviewItems, setReviewItems] = useState<import('@/api/services/emailCaptureService').ReviewQueueItem[]>([]);
  const [reviewCount, setReviewCount] = useState(0);
  const [reviewPage, setReviewPage] = useState(0);
  const [reviewTotalPages, setReviewTotalPages] = useState(0);
  const [loadingReview, setLoadingReview] = useState(false);
  const { addNotification } = useNotification();

  const loadConnections = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const [data, status, reviewData] = await Promise.all([
        mailboxSyncService.getConnections(),
        mailboxSyncService.getStatus().catch(() => ({ activeConnections: 0, timestamp: 0 })),
        mailboxSyncService.getReviewQueue(0, 1).catch(() => ({ content: [], totalElements: 0, totalPages: 0, number: 0, pendingCount: 0 })),
      ]);
      setConnections(data);
      setActiveWatchers(status.activeConnections || 0);
      setReviewCount(reviewData.pendingCount || 0);
    } catch {
      // Silent — no connections yet
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { loadConnections(); }, [loadConnections]);

  const loadReviewQueue = async (page = 0) => {
    try {
      setLoadingReview(true);
      const data = await mailboxSyncService.getReviewQueue(page, 10);
      setReviewItems(data.content);
      setReviewPage(data.number);
      setReviewTotalPages(data.totalPages);
      setReviewCount(data.pendingCount);
    } catch {
      addNotification({ type: 'error', title: 'Error', message: 'Failed to load review queue' });
    } finally { setLoadingReview(false); }
  };

  const [deleteConnId, setDeleteConnId] = useState<number | null>(null);

  const handleDelete = (id: number) => {
    setDeleteConnId(id);
  };

  const confirmDeleteConnection = async () => {
    if (!deleteConnId) return;
    try {
      await mailboxSyncService.deleteConnection(deleteConnId);
      setConnections(prev => prev.filter(c => c.id !== deleteConnId));
      addNotification({ type: 'success', title: 'Deleted', message: 'Mailbox connection removed.' });
    } catch (e: any) {
      addNotification({ type: 'error', title: 'Error', message: e?.message || 'Failed to delete' });
    } finally {
      setDeleteConnId(null);
    }
  };

  const handleToggleSync = async (conn: MailboxConnectionResponse) => {
    try {
      const updated = conn.autoSyncEnabled
        ? await mailboxSyncService.disableSync(conn.id)
        : await mailboxSyncService.enableSync(conn.id);
      setConnections(prev => prev.map(c => c.id === conn.id ? updated : c));
      addNotification({
        type: 'success',
        title: updated.autoSyncEnabled ? 'Sync Enabled' : 'Sync Disabled',
        message: `Auto-sync ${updated.autoSyncEnabled ? 'started' : 'stopped'} for ${conn.emailAddress}`,
      });
    } catch (e: any) {
      addNotification({ type: 'error', title: 'Error', message: e?.message || 'Failed to toggle sync' });
    }
  };

  const handleOAuth2 = async (conn: MailboxConnectionResponse) => {
    try {
      const { authorizationUrl } = await mailboxSyncService.getAuthorizationUrl(conn.id);
      window.open(authorizationUrl, '_blank', 'width=600,height=700');
      addNotification({ type: 'info', title: 'OAuth2', message: 'Complete authentication in the popup window.' });
    } catch (e: any) {
      addNotification({ type: 'error', title: 'Error', message: e?.message || 'Failed to get auth URL' });
    }
  };

  const handleCreated = async (conn: MailboxConnectionResponse) => {
    setConnections(prev => [conn, ...prev]);
    setShowAdd(false);
    addNotification({ type: 'success', title: 'Connected', message: `Mailbox ${conn.emailAddress} added.` });
    // Auto-open OAuth2 for cloud providers
    if (conn.provider !== 'GENERIC_IMAP' && !conn.oauthConfigured) {
      setTimeout(() => handleOAuth2(conn), 500);
    }
  };

  const handleUpdated = (updated: MailboxConnectionResponse) => {
    setConnections(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  const connectedCount = connections.filter(c => c.status === 'CONNECTED').length;

  return (
    <>
      <Card className="rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-150 border-border/50 overflow-hidden">
        <CardHeader className="p-5 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2.5 text-base font-semibold">
              <Zap className="h-4.5 w-4.5 text-blue-500" />
              Mailbox Connections
              {activeWatchers > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {activeWatchers} active
                </span>
              )}
              <span className="text-xs font-normal text-gray-400">{connections.length} total</span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <button onClick={loadConnections} disabled={isRefreshing}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50">
                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setShowAdd(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Add Mailbox
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 pt-0 space-y-3">

          {/* Connection List */}
          {loading ? (
            <div className="text-center py-10">
              <Loader2 className="h-6 w-6 text-muted-foreground animate-spin mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Loading connections...</p>
            </div>
          ) : connections.length === 0 && !showAdd ? (
            <div className="py-12 text-center border border-dashed border-gray-200 rounded-xl">
              <Mail className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-600">No mailbox connections yet</p>
              <p className="text-xs text-gray-400 mt-1">Click &quot;Add Mailbox&quot; to start capturing emails automatically</p>
            </div>
          ) : (
            connections.map(conn => (
              <ConnectionCard
                key={conn.id}
                connection={conn}
                expanded={expandedId === conn.id}
                onToggleExpand={() => setExpandedId(expandedId === conn.id ? null : conn.id)}
                onDelete={() => handleDelete(conn.id)}
                onToggleSync={() => handleToggleSync(conn)}
                onOAuth2={() => handleOAuth2(conn)}
                onUpdated={handleUpdated}
                availableModels={availableModels}
              />
            ))
          )}

          {/* ── Review Queue ── */}
          {reviewCount > 0 && (
            <div className="mt-4 border border-amber-200 rounded-xl bg-amber-50 overflow-hidden">
              <button
                onClick={() => { setShowReviewQueue(!showReviewQueue); if (!showReviewQueue && reviewItems.length === 0) loadReviewQueue(); }}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-amber-100/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-amber-600" />
                  <span className="text-xs font-semibold text-amber-800">Needs Review</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-800">
                    {reviewCount}
                  </span>
                </div>
                <span className="text-[10px] text-amber-600/60">
                  {showReviewQueue ? '▲ Collapse' : '▼ View Documents'}
                </span>
              </button>
              {showReviewQueue && (
                <div className="px-4 pb-4 space-y-2 border-t border-amber-200 animate-in slide-in-from-top-1 duration-200">
                  <p className="text-xs text-amber-700/70 pt-2">
                    These auto-captured emails have a filing category but are missing required metadata.
                  </p>
                  {loadingReview ? (
                    <div className="text-center py-4"><Loader2 className="h-4 w-4 text-amber-600 animate-spin mx-auto" /></div>
                  ) : reviewItems.length === 0 ? (
                    <p className="text-xs text-amber-600/50 text-center py-3">No items</p>
                  ) : (
                    <div className="space-y-1.5">
                      {reviewItems.map(item => (
                        <div key={item.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white border border-amber-100 hover:border-amber-300 transition-colors group">
                          <div className="flex-1 min-w-0 mr-3">
                            <p className="text-xs font-medium text-gray-900 truncate">{item.subject || '(No Subject)'}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-gray-400 truncate">{item.fromAddress}</span>
                              <span className="text-[10px] text-gray-300">•</span>
                              <span className="text-[10px] text-gray-400">{formatTimeAgo(item.archivedAt)}</span>
                              {item.document?.filingCategory && (
                                <>
                                  <span className="text-[10px] text-gray-300">•</span>
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium">{item.document.filingCategory.name}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <span className="text-[9px] px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-semibold flex-shrink-0">
                            PROVISIONAL
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Pagination */}
                  {reviewTotalPages > 1 && (
                    <div className="flex items-center justify-between pt-2 border-t border-amber-200/50">
                      <Button size="sm" variant="ghost" onClick={() => loadReviewQueue(reviewPage - 1)} disabled={reviewPage <= 0} className="h-7 text-xs px-3 text-amber-700">← Prev</Button>
                      <span className="text-xs text-amber-600/60">Page {reviewPage + 1} / {reviewTotalPages}</span>
                      <Button size="sm" variant="ghost" onClick={() => loadReviewQueue(reviewPage + 1)} disabled={reviewPage >= reviewTotalPages - 1} className="h-7 text-xs px-3 text-amber-700">Next →</Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Add Mailbox Dialog ── */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-500" />
              New Mailbox Connection
            </DialogTitle>
            <DialogDescription>
              Connect an email account to automatically capture incoming emails.
            </DialogDescription>
          </DialogHeader>
          <AddConnectionForm
            onCreated={(conn) => { handleCreated(conn); setShowAdd(false); }}
            onCancel={() => setShowAdd(false)}
            defaultFolderId={defaultFolderId}
            defaultFolderName={defaultFolderName}
            defaultModelId={defaultModelId}
            defaultModelName={defaultModelName}
            defaultAttachmentDest={defaultAttachmentDest}
            defaultAutoExtract={defaultAutoExtract}
            availableModels={availableModels}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Connection Confirmation Dialog */}
      <AlertDialog open={deleteConnId !== null} onOpenChange={(open) => !open && setDeleteConnId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Mailbox Connection?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the connection for <strong>{connections.find(c => c.id === deleteConnId)?.emailAddress}</strong>.
              <br /><br />
              This action cannot be undone. Any emails already captured will remain in the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteConnection} className="bg-red-600 hover:bg-red-700 focus:ring-red-600">
              Yes, Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ==================== ADD CONNECTION FORM ====================

function AddConnectionForm({ onCreated, onCancel, defaultFolderId, defaultFolderName,
  defaultModelId, defaultModelName, defaultAttachmentDest, defaultAutoExtract, availableModels }: {
    onCreated: (conn: MailboxConnectionResponse) => void;
    onCancel: () => void;
    defaultFolderId?: number;
    defaultFolderName?: string;
    defaultModelId?: number;
    defaultModelName?: string;
    defaultAttachmentDest?: AttachmentDestination;
    defaultAutoExtract?: boolean;
    availableModels: FilingCategoryResponseDto[];
  }) {
  const [provider, setProvider] = useState<MailboxProvider | null>(null);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  // IMAP fields
  const [imapHost, setImapHost] = useState('');
  const [imapPort, setImapPort] = useState(993);
  const [imapUsername, setImapUsername] = useState('');
  const [imapPassword, setImapPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  // Capture config — pre-filled from defaults (always INCOMING — historical is a separate action)
  const [destFolderId, setDestFolderId] = useState<number | undefined>(defaultFolderId);
  const [destFolderName, setDestFolderName] = useState(defaultFolderName || '');
  const [modelId, setModelId] = useState<number | undefined>(defaultModelId);
  const [modelName, setModelName] = useState(defaultModelName || '');
  const [autoExtract, setAutoExtract] = useState(defaultAutoExtract ?? true);
  const [attachDest, setAttachDest] = useState<AttachmentDestination>(defaultAttachmentDest || 'SAME_FOLDER');
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [modelSearch, setModelSearch] = useState('');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const modelRef = useRef<HTMLDivElement>(null);
  const [creating, setCreating] = useState(false);
  const { addNotification } = useNotification();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) setShowModelDropdown(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filteredModels = availableModels.filter(m =>
    m.name.toLowerCase().includes(modelSearch.toLowerCase())
  );

  const handleCreate = async () => {
    if (!provider || !email) return;
    try {
      setCreating(true);
      const data: MailboxConnectionRequest = {
        provider,
        emailAddress: email,
        displayName: displayName || undefined,
        destinationFolderId: destFolderId,
        filingCategoryId: modelId,
        autoExtractAttachments: autoExtract,
        attachmentDestination: attachDest,
      };
      if (provider === 'GENERIC_IMAP') {
        data.imapHost = imapHost;
        data.imapPort = imapPort;
        data.imapUsername = imapUsername || email;
        data.imapPassword = imapPassword;
      }
      const conn = await mailboxSyncService.createConnection(data);
      onCreated(conn);
    } catch (e: any) {
      addNotification({ type: 'error', title: 'Error', message: e?.message || 'Failed to create connection' });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">

      {/* Provider Selector */}
      <div className="grid grid-cols-3 gap-2">
        {PROVIDERS.map(p => (
          <button
            key={p.value}
            onClick={() => setProvider(p.value)}
            className={`p-3 rounded-xl border-2 text-left transition-all duration-200 ${provider === p.value
              ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20'
              : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
              }`}
          >
            <span className="text-lg">{p.icon}</span>
            <p className="text-xs font-semibold mt-1.5 text-gray-900">{p.label}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{p.desc}</p>
          </button>
        ))}
      </div>

      {provider && (
        <div className="space-y-4">
          {/* Email + Display Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-gray-600 font-medium">Email Address *</Label>
              <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="user@example.com" className="mt-1 h-9 text-sm rounded-lg border-gray-200" />
            </div>
            <div>
              <Label className="text-xs text-gray-600 font-medium">Display Name</Label>
              <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="My Work Email" className="mt-1 h-9 text-sm rounded-lg border-gray-200" />
            </div>
          </div>

          {/* GENERIC IMAP server fields */}
          {provider === 'GENERIC_IMAP' && (
            <div className="space-y-3 p-4 rounded-xl bg-gray-50 border border-gray-200">
              <p className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <Server className="h-3.5 w-3.5 text-blue-500" /> IMAP Server Details
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Label className="text-xs text-gray-600 font-medium">Host *</Label>
                  <Input value={imapHost} onChange={e => setImapHost(e.target.value)} placeholder="imap.example.com" className="mt-1 h-9 text-sm rounded-lg border-gray-200" />
                </div>
                <div>
                  <Label className="text-xs text-gray-600 font-medium">Port</Label>
                  <Input type="number" value={imapPort} onChange={e => setImapPort(parseInt(e.target.value) || 993)} className="mt-1 h-9 text-sm rounded-lg border-gray-200" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-600 font-medium">Username</Label>
                  <Input value={imapUsername} onChange={e => setImapUsername(e.target.value)} placeholder="Same as email" className="mt-1 h-9 text-sm rounded-lg border-gray-200" />
                </div>
                <div>
                  <Label className="text-xs text-gray-600 font-medium">Password *</Label>
                  <div className="relative mt-1">
                    <Input type={showPassword ? 'text' : 'password'} value={imapPassword} onChange={e => setImapPassword(e.target.value)} className="h-9 text-sm pr-8 rounded-lg border-gray-200" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* OAuth2 info banner */}
          {provider !== 'GENERIC_IMAP' && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50 border border-blue-100">
              <Shield className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700">
                After creating, a popup will open to authorize with {provider === 'MICROSOFT_365_IMAP' ? 'Microsoft' : 'Google'}.
                Only encrypted OAuth2 tokens are stored — never your password.
              </p>
            </div>
          )}

          {/* ── Capture Configuration (pre-filled from defaults) ── */}
          <div className="space-y-3 p-4 rounded-xl bg-gray-50 border border-gray-200">
            <p className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-blue-500" /> Capture Configuration
              {(destFolderName || modelName) && (
                <span className="text-[10px] text-blue-500/60 ml-1">(inherited from defaults)</span>
              )}
            </p>

            <div className="grid grid-cols-2 gap-3">

              {/* Destination Folder */}
              <div>
                <Label className="text-xs text-gray-600 font-medium">Destination Folder</Label>
                <button
                  onClick={() => setShowFolderPicker(true)}
                  className="mt-1 w-full h-9 px-3 text-sm rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-blue-300 transition-all text-left flex items-center gap-2"
                >
                  <FolderOpen className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                  <span className={`truncate ${destFolderName ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                    {destFolderName || 'Select folder...'}
                  </span>
                </button>
              </div>

              {/* Document Model */}
              <div ref={modelRef} className="relative">
                <Label className="text-xs text-gray-600 font-medium">Document Model</Label>
                {modelName ? (
                  <div className="mt-1 h-9 px-3 text-sm rounded-lg border border-gray-200 bg-white flex items-center justify-between">
                    <span className="text-gray-900 font-medium truncate">{modelName}</span>
                    <button onClick={() => { setModelId(undefined); setModelName(''); }} className="text-gray-400 hover:text-gray-600 ml-1">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <Input
                    value={modelSearch}
                    onChange={e => { setModelSearch(e.target.value); setShowModelDropdown(true); }}
                    onFocus={() => setShowModelDropdown(true)}
                    placeholder="Search models..."
                    className="mt-1 h-9 text-sm rounded-lg border-gray-200"
                  />
                )}
                {showModelDropdown && !modelName && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                    {filteredModels.length === 0 ? (
                      <p className="px-3 py-2 text-xs text-gray-400">No models found</p>
                    ) : filteredModels.map(m => (
                      <button key={m.id} onClick={() => { setModelId(m.id); setModelName(m.name); setModelSearch(''); setShowModelDropdown(false); }}
                        className="w-full text-left px-3 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-gray-900 transition-colors font-medium">
                        {m.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Attachment row */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={autoExtract} onChange={e => setAutoExtract(e.target.checked)} className="rounded text-blue-500 focus:ring-blue-500/20" />
                <span className="text-xs text-gray-600 font-medium">Auto-extract attachments</span>
              </label>
              {autoExtract && (
                <select value={attachDest} onChange={e => setAttachDest(e.target.value as AttachmentDestination)}
                  className="h-7 px-2 text-xs rounded-lg border border-gray-200 bg-white text-gray-700">
                  {ATTACHMENT_DESTS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onCancel} className="text-xs rounded-xl border-gray-200 text-gray-600">Cancel</Button>
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={creating || !email || (provider === 'GENERIC_IMAP' && !imapHost)}
              className="gap-2 rounded-xl text-xs bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border-0"
            >
              {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              {creating ? 'Creating...' : 'Create Connection'}
            </Button>
          </div>
        </div>
      )}

      {showFolderPicker && (
        <FolderPickerModal
          isOpen={showFolderPicker}
          onClose={() => setShowFolderPicker(false)}
          onSelect={(folderId: number, name: string) => { setDestFolderId(folderId); setDestFolderName(name); setShowFolderPicker(false); }}
        />
      )}
    </div>
  );
}

// ==================== CONNECTION CARD ====================

function ConnectionCard({ connection, expanded, onToggleExpand, onDelete, onToggleSync, onOAuth2, onUpdated, availableModels }: {
  connection: MailboxConnectionResponse;
  expanded: boolean;
  onToggleExpand: () => void;
  onDelete: () => void;
  onToggleSync: () => void;
  onOAuth2: () => void;
  onUpdated: (conn: MailboxConnectionResponse) => void;
  availableModels: FilingCategoryResponseDto[];
}) {
  const [syncHistory, setSyncHistory] = useState<MailboxSyncLogResponse[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyPage, setHistoryPage] = useState(0);
  const [totalHistoryPages, setTotalHistoryPages] = useState(0);
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [modelSearch, setModelSearch] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [updating, setUpdating] = useState(false);
  // IMAP folder browser
  const [imapFolders, setImapFolders] = useState<import('@/api/services/emailCaptureService').ImapFolderDto[]>([]);
  const [loadingImapFolders, setLoadingImapFolders] = useState(false);
  const [showImapDropdown, setShowImapDropdown] = useState(false);
  const [imapFolderSearch, setImapFolderSearch] = useState('');
  // ALL mode inline confirmation
  const [showAllConfirm, setShowAllConfirm] = useState(false);
  const [showFullSyncConfirm, setShowFullSyncConfirm] = useState(false);
  const [pendingLookbackMode, setPendingLookbackMode] = useState<'preset' | 'custom'>('preset');
  const [pendingLookback, setPendingLookback] = useState<number | null>(7);
  const [pendingLookbackSince, setPendingLookbackSince] = useState<string>('');
  const [pendingLookbackUntil, setPendingLookbackUntil] = useState<string>('');
  const [folderCounts, setFolderCounts] = useState<Record<string, number>>({});
  // Sync history filters
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string>('');
  const [historyDateFilter, setHistoryDateFilter] = useState<'all' | '24h' | '7d' | '30d'>('all');
  const modelRef = useRef<HTMLDivElement>(null);
  const imapFolderRef = useRef<HTMLDivElement>(null);
  const { addNotification } = useNotification();

  const status = STATUS_CONFIG[connection.status] || STATUS_CONFIG.ERROR;
  const providerInfo = PROVIDERS.find(p => p.value === connection.provider);
  const needsOAuth = (connection.provider !== 'GENERIC_IMAP') && !connection.oauthConfigured;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) setShowModelDropdown(false);
      if (imapFolderRef.current && !imapFolderRef.current.contains(e.target as Node)) setShowImapDropdown(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const loadHistory = async (page = 0) => {
    try {
      setLoadingHistory(true);
      const filters: { status?: any; from?: string; to?: string } = {};
      if (historyStatusFilter) filters.status = historyStatusFilter;
      if (historyDateFilter !== 'all') {
        const now = new Date();
        const hoursMap = { '24h': 24, '7d': 168, '30d': 720 };
        const from = new Date(now.getTime() - hoursMap[historyDateFilter] * 3600000);
        filters.from = from.toISOString();
      }
      const data = await mailboxSyncService.getSyncHistory(connection.id, page, 5, filters);
      setSyncHistory(data.content);
      setHistoryPage(data.number);
      setTotalHistoryPages(data.totalPages);
    } catch { /* silent */ } finally { setLoadingHistory(false); }
  };

  // Track current page in a ref so the polling interval always sees the latest value
  const historyPageRef = useRef(historyPage);
  historyPageRef.current = historyPage;

  // Ref to track if initial load for this expand has happened
  const expandedPrevRef = useRef(false);

  // Manual refresh handler for sync history + connection stats
  const handleRefreshHistory = useCallback(() => {
    loadHistory(historyPageRef.current);
    mailboxSyncService.getConnection(connection.id)
      .then(data => onUpdated(data))
      .catch(() => { });
  }, [connection.id]);

  // Fetch on expand (NO polling — manual refresh only)
  useEffect(() => {
    if (expanded) {
      if (!expandedPrevRef.current) {
        setSyncHistory([]);
        setHistoryPage(0);
        historyPageRef.current = 0;
        loadHistory(0);
      }
      expandedPrevRef.current = true;
    } else {
      expandedPrevRef.current = false;
    }
  }, [expanded]);

  // Re-fetch when the user changes page (without resetting)
  useEffect(() => {
    if (expanded && expandedPrevRef.current) {
      loadHistory(historyPage);
    }
  }, [historyPage]);

  // Re-fetch when filters change — reset to page 0
  useEffect(() => {
    if (expanded) {
      setHistoryPage(0);
      historyPageRef.current = 0;
      loadHistory(0);
    }
  }, [historyDateFilter, historyStatusFilter]);

  const loadImapFolders = async () => {
    if (imapFolders.length > 0) { setShowImapDropdown(true); return; }
    try {
      setLoadingImapFolders(true);
      const folders = await mailboxSyncService.listImapFolders(connection.id);
      setImapFolders(folders);
      setShowImapDropdown(true);
    } catch (e: any) {
      addNotification({ type: 'error', title: 'Error', message: 'Could not load IMAP folders. Is the connection authenticated?' });
    } finally { setLoadingImapFolders(false); }
  };

  // ---- Inline update helpers ----
  const updateField = async (patch: Partial<MailboxConnectionRequest>) => {
    try {
      setUpdating(true);
      const updated = await mailboxSyncService.updateConnection(connection.id, patch);
      onUpdated(updated);
    } catch (e: any) {
      addNotification({ type: 'error', title: 'Error', message: e?.message || 'Failed to update' });
    } finally { setUpdating(false); }
  };

  const handleSetDestination = async (folderId: number) => {
    await updateField({ destinationFolderId: folderId });
    setShowFolderPicker(false);
    addNotification({ type: 'success', title: 'Updated', message: 'Destination folder set.' });
  };

  const handleHistoricalFetch = async () => {
    try {
      setUpdating(true);

      const params: { sinceDate?: string; untilDate?: string; lookbackDays?: number } = {};

      if (pendingLookbackMode === 'preset') {
        params.lookbackDays = pendingLookback ?? 7;
      } else {
        if (pendingLookbackSince) {
          params.sinceDate = new Date(pendingLookbackSince).toISOString();
        }
        if (pendingLookbackUntil) {
          params.untilDate = new Date(pendingLookbackUntil).toISOString();
        }
      }

      await mailboxSyncService.triggerHistoricalFetch(connection.id, params);
      setShowAllConfirm(false);
      addNotification({
        type: 'success',
        title: 'Historical Fetch Started',
        message: 'Emails are being captured in the background. Check sync history for progress.',
      });
    } catch (e: any) {
      addNotification({ type: 'error', title: 'Error', message: e?.message || 'Failed to trigger historical fetch' });
    } finally { setUpdating(false); }
  };

  const handleSetModel = async (model: FilingCategoryResponseDto) => {
    await updateField({ filingCategoryId: model.id } as any);
    setShowModelDropdown(false);
    setModelSearch('');
    addNotification({ type: 'success', title: 'Updated', message: `Model set to "${model.name}".` });
  };

  const handleClearModel = async () => {
    await updateField({ filingCategoryId: undefined } as any);
  };

  const handleAddFolder = async () => {
    const name = newFolderName.trim();
    if (!name) return;
    try {
      setUpdating(true);
      await mailboxSyncService.addWatchedFolder(connection.id, { folderName: name, displayName: name });
      const updated = await mailboxSyncService.getConnection(connection.id);
      onUpdated(updated);
      setNewFolderName('');
      addNotification({ type: 'success', title: 'Added', message: `Watching "${name}".` });
    } catch (e: any) {
      addNotification({ type: 'error', title: 'Error', message: e?.message || 'Failed to add folder' });
    } finally { setUpdating(false); }
  };

  const handleAddImapFolder = async (folderName: string, displayName: string) => {
    // Check if already watched
    if (connection.watchedFolders?.some(f => f.folderName === folderName)) {
      addNotification({ type: 'warning', title: 'Already Watched', message: `"${folderName}" is already being watched.` });
      return;
    }
    try {
      setUpdating(true);
      await mailboxSyncService.addWatchedFolder(connection.id, { folderName, displayName });
      const updated = await mailboxSyncService.getConnection(connection.id);
      onUpdated(updated);
      setShowImapDropdown(false);
      setImapFolderSearch('');
      addNotification({ type: 'success', title: 'Added', message: `Now watching "${displayName}".` });
    } catch (e: any) {
      addNotification({ type: 'error', title: 'Error', message: e?.message || 'Failed to add folder' });
    } finally { setUpdating(false); }
  };

  const handleToggleFolder = async (folderId: number, active: boolean) => {
    try {
      await mailboxSyncService.toggleWatchedFolder(folderId, active);
      const updated = await mailboxSyncService.getConnection(connection.id);
      onUpdated(updated);
    } catch { /* silent */ }
  };

  const handleRemoveFolder = async (folderId: number) => {
    try {
      await mailboxSyncService.removeWatchedFolder(folderId);
      const updated = await mailboxSyncService.getConnection(connection.id);
      onUpdated(updated);
    } catch { /* silent */ }
  };

  const filteredModels = availableModels.filter(m =>
    m.name.toLowerCase().includes(modelSearch.toLowerCase())
  );

  return (
    <div className={`rounded-xl border transition-all duration-300 overflow-hidden hover:shadow-md ${connection.autoSyncEnabled && connection.status === 'CONNECTED'
      ? 'border-emerald-200 bg-white'
      : 'border-gray-100 bg-white'
      }`}>
      {/* ── Main Row ── */}
      <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={onToggleExpand}>
        {/* Provider Icon */}
        <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-base flex-shrink-0 shadow-sm">
          <span className="text-white text-sm">{providerInfo?.icon}</span>
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
              {connection.displayName || connection.emailAddress}
            </p>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${status.color} ${status.bg}`}>
              {status.icon} {status.label}
            </span>
            {connection.activeTransport && connection.status === 'CONNECTED' && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-100 text-emerald-700 font-semibold">
                {connection.activeTransport === 'IMAP_IDLE' ? 'IDLE' : 'POLL'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <p className="text-xs text-gray-400 font-mono truncate">{connection.emailAddress}</p>
            <span className="text-[10px] text-gray-300">•</span>
            <p className="text-[11px] text-gray-400 flex items-center gap-1">
              <Activity className="h-3 w-3" /> {connection.totalEmailsSynced} captured
            </p>
            {connection.lastSyncAt && (
              <>
                <span className="text-[10px] text-gray-300">•</span>
                <p className="text-[11px] text-gray-400">Synced {formatTimeAgo(connection.lastSyncAt)}</p>
              </>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
          {needsOAuth && (
            <button onClick={onOAuth2} className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-medium rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors">
              <ExternalLink className="h-3 w-3" /> Authenticate
            </button>
          )}
          {connection.status === 'AUTH_EXPIRED' && (
            <button onClick={onOAuth2} className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors">
              <RefreshCw className="h-3 w-3" /> Re-auth
            </button>
          )}
          {!needsOAuth && connection.status !== 'AUTH_EXPIRED' && (
            <button
              onClick={onToggleSync}
              className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${connection.autoSyncEnabled ? 'text-emerald-500 hover:bg-red-50 hover:text-red-500' : 'text-gray-400 hover:bg-emerald-50 hover:text-emerald-500'}`}
              title={connection.autoSyncEnabled ? 'Disable sync' : 'Enable sync'}
            >
              {connection.autoSyncEnabled ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
            </button>
          )}
          <button onClick={onDelete} className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
            <Trash2 className="h-4 w-4" />
          </button>
          <div className="text-gray-300 ml-0.5">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </div>

      {/* ── Expanded Details ── */}
      {expanded && (
        <div className="border-t border-gray-100 px-5 pb-5 space-y-4 animate-in slide-in-from-top-1 duration-200 bg-gray-50/50">

          {/* ── Watched Folders ── */}
          <div className="pt-4">
            <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
              <Inbox className="h-3.5 w-3.5 text-blue-500" /> Watched Folders
            </p>
            <div className="space-y-1.5">
              {connection.watchedFolders.map(f => (
                <div key={f.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white border border-gray-100 group hover:border-blue-200 transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <FolderOpen className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                    <span className="text-xs font-medium text-gray-900 truncate">{f.displayName || f.folderName}</span>
                    {f.overrideDestinationFolderPath && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium">→ {f.overrideDestinationFolderPath}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 font-medium">{f.totalCaptured} captured</span>
                    <button onClick={() => handleToggleFolder(f.id, !f.active)} title={f.active ? 'Pause' : 'Resume'}
                      className={`h-5 w-9 rounded-full relative transition-colors ${f.active ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${f.active ? 'left-[18px]' : 'left-0.5'}`} />
                    </button>
                    <button onClick={() => handleRemoveFolder(f.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {connection.watchedFolders.length === 0 && (
                <p className="text-xs text-gray-400 px-3 py-2 bg-white border border-dashed border-gray-200 rounded-lg text-center">No watched folders — add one below</p>
              )}
            </div>
            {/* Add folder — IMAP browser + manual input */}
            <div className="mt-2 space-y-2 relative" ref={imapFolderRef}>
              <div className="flex items-center gap-2">
                <Button
                  size="sm" variant="outline" onClick={loadImapFolders}
                  disabled={loadingImapFolders || updating}
                  className="h-8 text-xs px-3 flex-shrink-0 rounded-lg border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  {loadingImapFolders ? (
                    <><RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Loading...</>
                  ) : (
                    <><FolderOpen className="h-3 w-3 mr-1" /> Browse Folders</>
                  )}
                </Button>
                <span className="text-[10px] text-gray-400">or</span>
                <Input
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  placeholder="Type folder name..."
                  className="h-8 text-xs flex-1 rounded-lg border-gray-200"
                  onKeyDown={e => e.key === 'Enter' && handleAddFolder()}
                />
                <Button size="sm" variant="outline" onClick={handleAddFolder} disabled={!newFolderName.trim() || updating} className="h-8 text-xs px-3 rounded-lg border-gray-200 text-gray-600 hover:bg-gray-50">
                  <Plus className="h-3 w-3 mr-1" /> Add
                </Button>
              </div>

              {/* IMAP Folder Dropdown */}
              {showImapDropdown && imapFolders.length > 0 && (
                <div className="absolute z-50 left-0 right-0 mt-1 border border-gray-200 rounded-xl bg-white shadow-xl overflow-hidden">
                  <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
                    <Input
                      value={imapFolderSearch}
                      onChange={e => setImapFolderSearch(e.target.value)}
                      placeholder="Filter folders..."
                      className="h-8 text-xs rounded-lg border-gray-200"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto py-1">
                    {imapFolders
                      .filter(f => f.selectable)
                      .filter(f => !imapFolderSearch || f.name.toLowerCase().includes(imapFolderSearch.toLowerCase()) || (f.displayName && f.displayName.toLowerCase().includes(imapFolderSearch.toLowerCase())))
                      .map(f => {
                        const isWatched = connection.watchedFolders?.some(wf => wf.folderName === f.name);
                        return (
                          <button
                            key={f.name}
                            onClick={() => !isWatched && handleAddImapFolder(f.name, f.displayName)}
                            disabled={isWatched}
                            className={`w-full text-left py-2.5 px-4 text-xs flex items-center transition-colors overflow-hidden
                              ${isWatched ? 'opacity-40 cursor-not-allowed bg-gray-50' : 'hover:bg-blue-50 cursor-pointer'}`}
                          >
                            <FolderOpen className={`h-3.5 w-3.5 flex-shrink-0 mr-2.5 ${isWatched ? 'text-gray-300' : 'text-blue-500'}`} />
                            <span className="truncate font-medium flex-1 text-gray-900">{f.displayName || f.name}</span>
                            {f.messageCount != null && f.messageCount >= 0 && (
                              <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2 tabular-nums font-medium">{f.messageCount.toLocaleString()}</span>
                            )}
                            {isWatched && <span className="text-[9px] text-emerald-600 font-semibold flex-shrink-0 ml-2">✓ watching</span>}
                          </button>
                        );
                      })}
                    {imapFolders.filter(f => f.selectable).length === 0 && (
                      <p className="text-xs text-gray-400 px-3 py-3 text-center">No selectable folders found</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Configuration (editable) ── */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
              <Edit3 className="h-3.5 w-3.5 text-blue-500" /> Configuration
            </p>
            <div className="grid grid-cols-3 gap-3">
              {/* Get Historical Emails — one-shot action, NOT a mode change */}
              <div className="col-span-3 sm:col-span-1 relative">
                <Label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Historical Fetch</Label>
                <Button
                  size="sm" variant="outline"
                  onClick={() => setShowAllConfirm(!showAllConfirm)}
                  disabled={!connection.autoSyncEnabled || connection.status !== 'CONNECTED'}
                  className="mt-1 w-full h-8 text-xs gap-1.5 rounded-lg border-gray-200 text-gray-600 hover:bg-gray-50"
                  title="Fetch emails from a specific date range (one-shot, INCOMING stays active)"
                >
                  <Clock className="h-3 w-3" />
                  Get Historical Emails
                </Button>
                <p className="text-[9px] text-gray-400 mt-1">
                  Fetch emails by date range (one-shot)
                </p>

                {/* ── Policy-gated: Fetch ALL Emails button ── */}
                <Button
                  size="sm" variant="outline"
                  onClick={() => setShowFullSyncConfirm(true)}
                  disabled={!connection.autoSyncEnabled || connection.status !== 'CONNECTED' || updating}
                  className="mt-1 w-full h-8 text-xs gap-1.5 rounded-lg border-blue-200 text-blue-600 hover:bg-blue-50"
                  title="Fetch ALL emails from the entire mailbox history (requires admin policy approval)"
                >
                  <Mail className="h-3 w-3" />
                  Fetch All Emails
                </Button>
                <p className="text-[9px] text-gray-400 mt-1">
                  Requires <code className="text-[8px] bg-gray-100 px-1 py-0.5 rounded">full_mailbox_sync_allowed</code> policy
                </p>

                {/* Full Sync Confirmation Dialog */}
                <AlertDialog open={showFullSyncConfirm} onOpenChange={setShowFullSyncConfirm}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Fetch All Emails?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will capture <strong>every email from the entire mailbox history</strong>. Depending on the mailbox size, this could take a long time and consume significant storage.
                        <br /><br />
                        This action requires the <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">full_mailbox_sync_allowed</code> admin policy to be enabled.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={async () => {
                          try {
                            setUpdating(true);
                            await mailboxSyncService.triggerHistoricalFetch(connection.id, {});
                            addNotification({
                              type: 'success',
                              title: 'Full Mailbox Sync Started',
                              message: 'All emails from all time are being captured. Check sync history for progress.',
                            });
                          } catch (e: any) {
                            addNotification({
                              type: 'error',
                              title: 'Full Sync Blocked',
                              message: e?.message || 'Full mailbox sync is disabled by admin policy.',
                            });
                          } finally { setUpdating(false); }
                        }}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Yes, Fetch All Emails
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                {/* Date picker panel */}
                {showAllConfirm && (
                  <div className="mt-2 p-3 bg-card border border-primary/20 rounded-lg shadow-sm animate-in fade-in slide-in-from-top-2 absolute z-10 w-[380px]">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <h4 className="text-sm font-semibold text-foreground">Fetch Historical Emails</h4>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3 text-wrap">
                      This will fetch emails from a date range. INCOMING mode stays active — both run simultaneously.
                    </p>

                    <div className="space-y-3">
                      <div className="flex bg-muted/40 p-1 rounded-lg">
                        <button
                          onClick={() => setPendingLookbackMode('preset')}
                          className={`flex-1 text-xs py-1 rounded-md transition-colors ${pendingLookbackMode === 'preset' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                          Recent Days
                        </button>
                        <button
                          onClick={() => setPendingLookbackMode('custom')}
                          className={`flex-1 text-xs py-1 rounded-md transition-colors ${pendingLookbackMode === 'custom' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                          Custom Date
                        </button>
                      </div>

                      {pendingLookbackMode === 'preset' ? (
                        <div className="grid grid-cols-4 gap-1.5">
                          {[
                            { value: 7, label: '7 days' },
                            { value: 30, label: '30 days' },
                            { value: 90, label: '90 days' },
                            { value: 365, label: '1 year' },
                          ].map(opt => (
                            <button
                              key={String(opt.value)}
                              onClick={() => setPendingLookback(opt.value)}
                              className={`h-8 text-xs rounded-lg border transition-all ${pendingLookback === opt.value
                                ? 'border-primary bg-primary/10 text-primary font-medium'
                                : 'border-border/30 text-muted-foreground hover:bg-muted/20'
                                }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-[10px] text-muted-foreground">From Date *</Label>
                            <Input
                              type="date"
                              className="h-8 text-xs mt-1"
                              value={pendingLookbackSince}
                              onChange={e => setPendingLookbackSince(e.target.value)}
                            />
                          </div>
                          <div>
                            <Label className="text-[10px] text-muted-foreground">To Date (Optional)</Label>
                            <Input
                              type="date"
                              className="h-8 text-xs mt-1"
                              value={pendingLookbackUntil}
                              onChange={e => setPendingLookbackUntil(e.target.value)}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end gap-2 pt-2 mt-2 border-t border-border/20">
                        <Button size="sm" variant="ghost" onClick={() => setShowAllConfirm(false)} className="h-7 text-xs px-2">Cancel</Button>
                        <Button size="sm" onClick={handleHistoricalFetch} disabled={updating || (pendingLookbackMode === 'custom' && !pendingLookbackSince)} className="h-7 text-xs px-3">
                          {updating ? <><Loader2 className="h-3 w-3 animate-spin mr-1" /> ...</> : 'Fetch Emails'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Destination Folder */}
              <div>
                <Label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Destination</Label>
                <button
                  onClick={() => setShowFolderPicker(true)}
                  className="mt-1 w-full h-8 px-3 text-xs rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-blue-300 transition-all text-left flex items-center gap-2"
                >
                  <FolderOpen className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                  <span className={`truncate ${connection.destinationFolderPath ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                    {connection.destinationFolderPath || 'Select...'}
                  </span>
                </button>
              </div>

              {/* Document Model */}
              <div ref={modelRef} className="relative">
                <Label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Model</Label>
                {connection.filingCategoryName ? (
                  <div className="mt-1 h-8 px-3 text-xs rounded-lg border border-gray-200 bg-white flex items-center justify-between">
                    <span className="text-gray-900 font-medium truncate">{connection.filingCategoryName}</span>
                    <button onClick={() => handleClearModel()} className="text-gray-400 hover:text-gray-600 ml-1">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <Input
                    value={modelSearch}
                    onChange={e => { setModelSearch(e.target.value); setShowModelDropdown(true); }}
                    onFocus={() => setShowModelDropdown(true)}
                    placeholder="Search..."
                    className="mt-1 h-8 text-xs rounded-lg border-gray-200"
                  />
                )}
                {showModelDropdown && !connection.filingCategoryName && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-36 overflow-y-auto">
                    {filteredModels.length === 0 ? (
                      <p className="px-3 py-2 text-xs text-gray-400">No models</p>
                    ) : filteredModels.map(m => (
                      <button key={m.id} onClick={() => handleSetModel(m)}
                        className="w-full text-left px-3 py-2.5 text-xs text-gray-700 hover:bg-blue-50 hover:text-gray-900 transition-colors font-medium">
                        {m.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Attachment settings */}
            <div className="flex items-center gap-4 mt-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={connection.autoExtractAttachments}
                  onChange={e => updateField({ autoExtractAttachments: e.target.checked })}
                  className="rounded text-blue-500 focus:ring-blue-500/20" />
                <span className="text-xs text-gray-600 font-medium">Auto-extract attachments</span>
              </label>
              <select value={connection.attachmentDestination}
                onChange={e => updateField({ attachmentDestination: e.target.value as AttachmentDestination })}
                className="h-7 px-2 text-xs rounded-lg border border-gray-200 bg-white text-gray-700">
                {ATTACHMENT_DESTS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
          </div>

          {/* ── Sync Error ── */}
          {connection.lastSyncError && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100">
              <XCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-700">{connection.lastSyncError}</p>
            </div>
          )}

          {/* ── OAuth2 Token Info ── */}
          {connection.provider !== 'GENERIC_IMAP' && connection.oauthConfigured && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-700">
              <Shield className="h-3.5 w-3.5 text-blue-500" />
              <span>OAuth2 token expires: {connection.tokenExpiresAt ? new Date(connection.tokenExpiresAt).toLocaleString() : 'N/A'}</span>
              {connection.approvedByName && <span>• Approved by: {connection.approvedByName}</span>}
            </div>
          )}

          {/* ── Sync History ── */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-blue-500" /> Recent Sync Activity
              </p>
              <div className="flex items-center gap-1.5">
                <select
                  value={historyStatusFilter}
                  onChange={e => setHistoryStatusFilter(e.target.value)}
                  className="h-7 px-2 text-[10px] rounded-lg border border-gray-200 bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-200"
                >
                  <option value="">All Status</option>
                  <option value="COMPLETED">✓ Completed</option>
                  <option value="PARTIAL">⚠ Partial</option>
                  <option value="FAILED">✗ Failed</option>
                  <option value="RUNNING">⟳ Running</option>
                </select>
                <select
                  value={historyDateFilter}
                  onChange={e => setHistoryDateFilter(e.target.value as any)}
                  className="h-7 px-2 text-[10px] rounded-lg border border-gray-200 bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-200"
                >
                  <option value="all">All Time</option>
                  <option value="24h">Last 24h</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                </select>
                <button
                  onClick={handleRefreshHistory}
                  disabled={loadingHistory}
                  className="h-7 w-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  title="Refresh sync history"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingHistory ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
            {loadingHistory ? (
              <p className="text-xs text-gray-400 text-center py-4">Loading...</p>
            ) : syncHistory.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No sync activity yet</p>
            ) : (
              <div className="space-y-1">
                {syncHistory.map(log => (
                  <SyncLogRow key={log.id} log={log} />
                ))}
              </div>
            )}
            {/* Pagination Controls */}
            {totalHistoryPages > 1 && (
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                <Button
                  size="sm" variant="ghost"
                  onClick={() => loadHistory(historyPage - 1)}
                  disabled={historyPage <= 0 || loadingHistory}
                  className="h-7 text-xs px-3 text-gray-500 hover:text-gray-700 rounded-lg"
                >
                  ← Previous
                </Button>
                <span className="text-xs text-gray-400">
                  Page {historyPage + 1} of {totalHistoryPages}
                </span>
                <Button
                  size="sm" variant="ghost"
                  onClick={() => loadHistory(historyPage + 1)}
                  disabled={historyPage >= totalHistoryPages - 1 || loadingHistory}
                  className="h-7 text-xs px-3 text-gray-500 hover:text-gray-700 rounded-lg"
                >
                  Next →
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Folder Picker Modal */}
      {showFolderPicker && (
        <FolderPickerModal
          isOpen={showFolderPicker}
          onClose={() => setShowFolderPicker(false)}
          onSelect={(folderId: number) => handleSetDestination(folderId)}
        />
      )}
    </div>
  );
}

// ==================== SYNC LOG ROW ====================

function SyncLogRow({ log }: { log: MailboxSyncLogResponse }) {
  const statusIcon = {
    RUNNING: <RefreshCw className="h-3.5 w-3.5 text-blue-500 animate-spin" />,
    COMPLETED: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />,
    PARTIAL: <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />,
    FAILED: <XCircle className="h-3.5 w-3.5 text-red-500" />,
  }[log.status];

  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white border border-gray-100 hover:border-blue-200 transition-colors">
      <div className="flex items-center gap-2.5">
        {statusIcon}
        <span className="text-xs text-gray-500 font-medium">{formatTimeAgo(log.startedAt)}</span>
        <span className="text-[10px] text-gray-400 px-1.5 py-0.5 bg-gray-50 rounded font-medium">{log.syncType}</span>
      </div>
      <div className="flex items-center gap-3 text-xs">
        <span className="text-emerald-600 font-medium">{log.emailsCaptured} captured</span>
        {log.emailsSkipped > 0 && <span className="text-amber-600 font-medium">{log.emailsSkipped} skipped</span>}
        {log.emailsFailed > 0 && <span className="text-red-600 font-medium">{log.emailsFailed} failed</span>}
      </div>
    </div>
  );
}
