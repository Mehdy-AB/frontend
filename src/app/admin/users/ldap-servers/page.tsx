'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Plus, Upload, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { notificationApiClient } from '@/api/notificationClient';
import { useGlobalNotifications } from '@/contexts/GlobalNotificationContext';
import type {
  LdapServer,
  LdapStatistics,
  LdapServerFormValues,
  AttributeMapping,
} from './_components/ldap-types';
import { getSecurityLabel } from './_components/ldap-types';
import type { LdapServerDto } from '@/api/services/ldapServerService';
import LdapMetricCards from './_components/LdapMetricCards';
import LdapToolbar from './_components/LdapToolbar';
import LdapServerTable from './_components/LdapServerTable';
import LdapServerModal from './_components/LdapServerModal';
import DeleteServerDialog from './_components/DeleteServerDialog';

// ─── API → UI mapping ───────────────────────────────────────────────────────

function mapDtoToServer(dto: LdapServerDto): LdapServer {
  const statusMap: Record<string, LdapServer['status']> = {
    CONNECTED: 'Connected',
    DISCONNECTED: 'Disconnected',
    ERROR: 'Error',
    TESTING: 'Testing',
    MAINTENANCE: 'Maintenance',
  };
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description || '',
    serverType: dto.serverType || 'Active Directory',
    hostname: dto.hostname,
    port: dto.port,
    sslPort: dto.sslPort,
    baseDN: dto.baseDn,
    bindDN: dto.bindDn || '',
    isActive: dto.enabled,
    isSecure: dto.useSSL || dto.useTLS,
    useSSL: dto.useSSL,
    useTLS: dto.useTLS,
    connectionTimeout: dto.connectionTimeout,
    searchTimeout: dto.searchTimeout,
    lastSync: dto.lastSync || '',
    lastTest: dto.lastTest || '',
    status: statusMap[dto.status] || 'Unknown',
    createdBy: dto.createdByName || 'System',
    createdAt: dto.createdAt,
    lastModified: dto.updatedAt,
    syncCount: dto.syncCount,
    errorCount: dto.errorCount,
    userCount: dto.userCount,
    groupCount: dto.groupCount,
    attributes: dto.attributeMappings || {},
    defaultRoleName: '',
    filters: {
      userFilter: dto.userFilter || '',
      groupFilter: dto.groupFilter || '',
      enabledFilter: '',
    },
    syncSchedule: dto.syncSchedule || 'DAILY',
    autoDisableUsers: dto.autoDisableUsers ?? true,
    nextSyncAt: dto.nextSyncAt || '',
  };
}

// ─── Page component ──────────────────────────────────────────────────────────

export default function LdapServersPage() {
  // ── Data state ──
  const [servers, setServers] = useState<LdapServer[]>([]);
  const [statistics, setStatistics] = useState<LdapStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // ── Pagination state ──
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // ── Filter state ──
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [selectedType, setSelectedType] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedSecurity, setSelectedSecurity] = useState('All');

  // ── Selection & expansion ──
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [expandedServers, setExpandedServers] = useState<string[]>([]);
  const [syncingServers, setSyncingServers] = useState<string[]>([]);
  const [testingServers, setTestingServers] = useState<string[]>([]);

  // ── Modal state ──
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<LdapServer | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingServer, setDeletingServer] = useState<LdapServer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Debounced search ──
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setCurrentPage(0); // Reset to first page on new search
    }, 300);
  }, []);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  // ── Data fetching ──
  const fetchServers = useCallback(async (page = currentPage, search = debouncedSearch) => {
    try {
      setLoading(true);
      const response = await notificationApiClient.getAllLdapServers({
        page,
        size: pageSize,
        search: search || undefined,
      });
      setServers(response.content.map(mapDtoToServer));
      setTotalElements(response.totalElements || 0);
      setTotalPages(response.totalPages || 0);
    } catch (error) {
      console.error('Failed to fetch LDAP servers:', error);
      toast.error('Failed to load LDAP servers', {
        description: 'Please try refreshing the page.',
      });
      setServers([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, pageSize]);

  const fetchStatistics = useCallback(async () => {
    try {
      setStatsLoading(true);
      const stats = await notificationApiClient.getLdapStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
      // Fallback: compute from local data
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServers(currentPage, debouncedSearch);
  }, [currentPage, debouncedSearch, fetchServers]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  // ── Real-time sync updates via SSE notifications ──
  const { notifications } = useGlobalNotifications();
  const lastSyncNotifIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Look for the latest LDAP_SYNC_COMPLETED notification
    const syncNotif = notifications.find((n) => n.type === 'LDAP_SYNC_COMPLETED');
    if (syncNotif && syncNotif.id !== lastSyncNotifIdRef.current) {
      lastSyncNotifIdRef.current = syncNotif.id;
      // Refetch data immediately
      fetchServers(currentPage, debouncedSearch);
      fetchStatistics();
    }
  }, [notifications, fetchServers, fetchStatistics, currentPage, debouncedSearch]);

  // ── Filtered servers ──
  const filteredServers = useMemo(() => {
    let result = servers;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.hostname.toLowerCase().includes(q) ||
          s.baseDN.toLowerCase().includes(q)
      );
    }

    if (selectedType !== 'All') {
      result = result.filter((s) => s.serverType === selectedType);
    }

    if (selectedStatus !== 'All') {
      result = result.filter((s) => s.status === selectedStatus);
    }

    if (selectedSecurity !== 'All') {
      result = result.filter((s) => {
        const label = getSecurityLabel(s);
        return label === selectedSecurity;
      });
    }

    return result;
  }, [servers, searchQuery, selectedType, selectedStatus, selectedSecurity]);

  const hasActiveFilters =
    selectedType !== 'All' || selectedStatus !== 'All' || selectedSecurity !== 'All';

  // ── Computed fallback stats ──
  const displayStats: LdapStatistics = statistics || {
    totalServers: servers.length,
    enabledServers: servers.filter((s) => s.isActive).length,
    connectedServers: servers.filter((s) => s.status === 'Connected').length,
    totalLdapUsers: servers.reduce((sum, s) => sum + s.userCount, 0),
    totalSyncs: servers.reduce((sum, s) => sum + s.syncCount, 0),
  };

  // ── Selection handlers ──
  const handleToggleSelect = (serverId: string) => {
    setSelectedItems((prev) =>
      prev.includes(serverId)
        ? prev.filter((id) => id !== serverId)
        : [...prev, serverId]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedItems.length === filteredServers.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredServers.map((s) => s.id));
    }
  };

  const handleToggleExpand = (serverId: string) => {
    setExpandedServers((prev) =>
      prev.includes(serverId)
        ? prev.filter((id) => id !== serverId)
        : [...prev, serverId]
    );
  };

  // ── CRUD handlers ──
  const handleAddServer = () => {
    setEditingServer(null);
    setIsModalOpen(true);
  };

  const handleEditServer = (server: LdapServer) => {
    setEditingServer(server);
    setIsModalOpen(true);
  };

  const handleSaveServer = async (
    values: LdapServerFormValues,
    mappings: AttributeMapping[]
  ) => {
    const request = {
      name: values.name,
      serverType: values.serverType,
      description: values.description,
      hostname: values.hostname,
      port: values.port,
      sslPort: values.useSSL ? 636 : 636,
      useSSL: values.useSSL,
      useTLS: values.useTLS,
      baseDn: values.baseDn,
      bindDn: values.bindDn,
      bindPassword: values.bindPassword || undefined,
      connectionTimeout: values.connectionTimeout,
      searchTimeout: values.searchTimeout,
      userFilter: values.userFilter,
      groupFilter: values.groupFilter,
      attributeMappings: Object.fromEntries(
        mappings.map((m) => [m.dmsField, m.ldapAttribute])
      ),
      enabled: true,
      syncSchedule: values.syncSchedule,
      autoDisableUsers: values.autoDisableUsers,
    };

    try {
      if (editingServer) {
        await notificationApiClient.updateLdapServer(editingServer.id, request);
        toast.success('Server updated successfully', {
          description: `"${values.name}" configuration has been saved.`,
        });
      } else {
        await notificationApiClient.createLdapServer(request);
        toast.success('Server added successfully', {
          description: `"${values.name}" has been added to your LDAP servers.`,
        });
      }
      setIsModalOpen(false);
      fetchServers();
      fetchStatistics();
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'An error occurred';
      toast.error(editingServer ? 'Failed to update server' : 'Failed to add server', {
        description: message,
      });
      throw error; // Let the modal handle its own loading state
    }
  };

  const handleTestConnection = async (values: LdapServerFormValues): Promise<boolean> => {
    try {
      // For existing servers, use the server ID endpoint
      if (editingServer) {
        const result = await notificationApiClient.testLdapConnection(editingServer.id);
        if (result.success) {
          toast.success('Connection successful', {
            description: result.message || `Connected to ${values.hostname}`,
          });
        } else {
          toast.error('Connection failed', {
            description: result.message || 'Could not connect to the LDAP server.',
          });
        }
        return result.success;
      }

      // For new servers, use raw parameters endpoint
      const { ldapServerService } = await import('@/api/services/ldapServerService');
      const result = await ldapServerService.testConnectionWithParams({
        hostname: values.hostname,
        port: values.port,
        sslPort: values.sslPort,
        useSSL: values.useSSL,
        useTLS: values.useTLS,
        baseDn: values.baseDn,
        bindDn: values.bindDn,
        bindPassword: values.bindPassword,
        connectionTimeout: values.connectionTimeout,
      });

      if (result.success) {
        toast.success('Connection successful', {
          description: `Successfully connected to ${values.hostname}:${values.port}`,
        });
      } else {
        toast.error('Connection failed', {
          description: result.message || `Could not reach ${values.hostname}:${values.port}. Check your settings.`,
        });
      }
      return result.success;
    } catch (error: any) {
      toast.error('Connection test failed', {
        description: error?.message || 'An unexpected error occurred during the test.',
      });
      return false;
    }
  };

  const handleDeleteClick = (server: LdapServer) => {
    setDeletingServer(server);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingServer) return;
    setIsDeleting(true);
    try {
      await notificationApiClient.deleteLdapServer(deletingServer.id);
      toast.success('Server deleted', {
        description: `"${deletingServer.name}" has been permanently removed.`,
      });
      setIsDeleteOpen(false);
      setDeletingServer(null);
      setSelectedItems((prev) => prev.filter((id) => id !== deletingServer.id));
      fetchServers();
      fetchStatistics();
    } catch (error: any) {
      toast.error('Failed to delete server', {
        description: error?.message || 'An error occurred while deleting.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Sync handler ──
  const handleSync = async (serverId: string) => {
    setSyncingServers((prev) => [...prev, serverId]);
    const server = servers.find((s) => s.id === serverId);
    try {
      const result = await notificationApiClient.syncLdapUsers(serverId);
      if (result.success) {
        toast.success('Synchronization complete', {
          description: `${result.imported} users imported, ${result.updated} updated from "${server?.name}".`,
        });
      } else {
        toast.warning('Synchronization completed with errors', {
          description: result.errorMessage || `${result.errors} errors occurred.`,
        });
      }
      fetchServers();
      fetchStatistics();
    } catch (error: any) {
      toast.error('Synchronization failed', {
        description: error?.message || `Failed to sync users from "${server?.name}".`,
      });
    } finally {
      setSyncingServers((prev) => prev.filter((id) => id !== serverId));
    }
  };

  // ── Test connection from table ──
  const handleTestFromTable = async (serverId: string) => {
    setTestingServers((prev) => [...prev, serverId]);
    const server = servers.find((s) => s.id === serverId);
    try {
      const result = await notificationApiClient.testLdapConnection(serverId);
      if (result.success) {
        toast.success('Connection successful', {
          description: `"${server?.name}" is reachable.`,
        });
      } else {
        toast.error('Connection failed', {
          description: result.message || `"${server?.name}" is unreachable.`,
        });
      }
      fetchServers();
    } catch (error: any) {
      toast.error('Connection test failed', {
        description: error?.message || 'An unexpected error occurred.',
      });
    } finally {
      setTestingServers((prev) => prev.filter((id) => id !== serverId));
    }
  };

  // ── Bulk actions ──
  const handleBulkDelete = () => {
    if (selectedItems.length === 1) {
      const server = servers.find((s) => s.id === selectedItems[0]);
      if (server) handleDeleteClick(server);
    } else {
      toast.info(`Bulk delete ${selectedItems.length} servers`, {
        description: 'Bulk deletion is not yet implemented. Please delete servers individually.',
      });
    }
  };

  const handleBulkTest = async () => {
    toast.info('Testing connections...', {
      description: `Running connection tests for ${selectedItems.length} servers.`,
    });
    for (const serverId of selectedItems) {
      await handleTestFromTable(serverId);
    }
  };

  // ── Import Config ──
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImportConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);

        // Validate required fields
        if (!json.name || !json.hostname || !json.port || !json.baseDn) {
          toast.error('Invalid config file', {
            description: 'Missing required fields: name, hostname, port, or baseDn.',
          });
          return;
        }

        const request = {
          name: json.name,
          serverType: json.serverType || 'Other',
          description: json.description || '',
          hostname: json.hostname,
          port: json.port,
          sslPort: json.sslPort || 636,
          useSSL: json.useSSL ?? false,
          useTLS: json.useTLS ?? false,
          baseDn: json.baseDn,
          bindDn: json.bindDn || '',
          bindPassword: json.bindPassword || undefined,
          connectionTimeout: json.connectionTimeout || 5000,
          searchTimeout: json.searchTimeout || 10000,
          userFilter: json.userFilter || '(objectClass=inetOrgPerson)',
          groupFilter: json.groupFilter || '(&(objectClass=groupOfNames))',
          attributeMappings: json.attributeMappings || {},
          enabled: json.enabled ?? true,
          syncSchedule: json.syncSchedule || 'MANUAL',
          autoDisableUsers: json.autoDisableUsers ?? true,
        };

        await notificationApiClient.createLdapServer(request);
        toast.success('Server imported successfully', {
          description: `"${json.name}" has been created from the config file.`,
        });
        fetchServers();
        fetchStatistics();
      } catch (err: any) {
        if (err instanceof SyntaxError) {
          toast.error('Invalid JSON file', {
            description: 'The file could not be parsed as valid JSON.',
          });
        } else {
          toast.error('Import failed', {
            description: err?.response?.data?.message || err?.message || 'An unexpected error occurred.',
          });
        }
      } finally {
        // Reset file input so the same file can be re-imported
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">LDAP Servers</h1>
          <p className="text-muted-foreground mt-1">
            Manage LDAP server connections and synchronization
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImportConfig}
          />
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            Import Config
          </Button>
          <Button onClick={handleAddServer} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Server
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <LdapMetricCards statistics={displayStats} loading={loading && statsLoading} />

      {/* Toolbar */}
      <LdapToolbar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        selectedSecurity={selectedSecurity}
        onSecurityChange={setSelectedSecurity}
        selectedCount={selectedItems.length}
        onBulkDelete={handleBulkDelete}
        onBulkTest={handleBulkTest}
      />

      {/* Data Table */}
      <LdapServerTable
        servers={filteredServers}
        loading={loading}
        selectedItems={selectedItems}
        expandedServers={expandedServers}
        syncingServers={syncingServers}
        testingServers={testingServers}
        onToggleSelect={handleToggleSelect}
        onToggleSelectAll={handleToggleSelectAll}
        onToggleExpand={handleToggleExpand}
        onEdit={handleEditServer}
        onDelete={handleDeleteClick}
        onSync={handleSync}
        onTest={handleTestFromTable}
        onAddServer={handleAddServer}
        searchQuery={searchQuery}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-4">
          <p className="text-sm text-muted-foreground">
            Showing {currentPage * pageSize + 1}–{Math.min((currentPage + 1) * pageSize, totalElements)} of {totalElements} servers
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0 || loading}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                // Show pages around current page
                let page: number;
                if (totalPages <= 5) {
                  page = i;
                } else if (currentPage <= 2) {
                  page = i;
                } else if (currentPage >= totalPages - 3) {
                  page = totalPages - 5 + i;
                } else {
                  page = currentPage - 2 + i;
                }
                return (
                  <Button
                    key={page}
                    variant={page === currentPage ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage(page)}
                    disabled={loading}
                  >
                    {page + 1}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1 || loading}
              className="gap-1"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <LdapServerModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        server={editingServer}
        onSave={handleSaveServer}
        onTestConnection={handleTestConnection}
      />

      {/* Delete Confirmation */}
      <DeleteServerDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        server={deletingServer}
        onConfirm={handleDeleteConfirm}
        loading={isDeleting}
      />
    </div>
  );
}
