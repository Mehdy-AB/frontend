'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Link2,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Play,
  Pause,
  Settings,
  Eye,
  EyeOff,
  BarChart3,
  RefreshCw,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  Upload,
  FileText,
  ExternalLink,
  ChevronDown,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { linkRuleService } from '@/api/services/linkRuleService';
import { filingCategoryService } from '@/api/services/filingCategoryService';
import { userManagementService } from '@/api/services/userManagementService';
import ServerSearchInput from '@/components/main/ServerSearchInput';
import Pagination from '@/components/main/Pagination';
import UserAvatar from '@/components/main/UserAvatar';
import { useServerSideSearch } from '@/components/main/useServerSideSearch';
import { SearchSelect } from '@/components/main/SearchSelect';
import {
  LinkRuleResponseDto,
  LinkRuleRequestDto,
  RuleStatistics,
  LinkRuleCacheStatistics,
  PageResponse,
  LinkRuleExecutionLogDto,
  LinkRuleAggregatedStats,
  LinkRuleTrendDto,
  LinkRuleAuditLogDto
} from '@/types/api';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { useNotifications } from '../../../../hooks/useNotifications';
import { useAdminPagePermissions } from '@/hooks/useAdminPagePermissions';

export default function LinkRulesManagementPage() {
  const { t } = useLanguage();
  const { showNotification, showSuccess } = useNotifications();
  const router = useRouter();
  const { canView, canCreate, canUpdate, canDelete } = useAdminPagePermissions();

  useEffect(() => {
    if (!canView) {
      router.push('/');
    }
  }, [canView, router]);

  // Filters
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterLinkType, setFilterLinkType] = useState<string>('all');
  const [selectedRules, setSelectedRules] = useState<number[]>([]);

  const pageSize = 20;

  // Memoize fetch function to prevent infinite loops
  const fetchFunction = useCallback(async (page: number, searchTerm?: string) => {
    const filters: { enabled?: boolean; linkType?: string; name?: string } = {}; // linkType stays as query param name for backend compat
    if (filterStatus !== 'all') {
      filters.enabled = filterStatus === 'active';
    }
    if (filterLinkType !== 'all') {
      filters.linkType = filterLinkType;
    }
    if (searchTerm) {
      filters.name = searchTerm;
    }
    return await linkRuleService.getLinkRules(page, pageSize, 'name', 'asc', filters);
  }, [filterStatus, filterLinkType, pageSize]);

  // Server-side search hook
  const {
    displayData: linkRules,
    searchQuery,
    setSearchQuery,
    page: currentPage,
    setPage: setCurrentPage,
    totalPages,
    totalElements,
    loading,
    tableLoading,
    error,
    fetchData,
    addItem: addRule,
    updateItem: updateRule,
    removeItem: removeRule
  } = useServerSideSearch<LinkRuleResponseDto>({
    fetchFunction,
    searchFields: (rule) => [rule.name, rule.description || '', rule.relationType],
    debounceMs: 500
  });

  // Statistics and cache
  const [ruleStatistics, setRuleStatistics] = useState<RuleStatistics[]>([]);
  const [cacheStatistics, setCacheStatistics] = useState<LinkRuleCacheStatistics | null>(null);
  const [showStatistics, setShowStatistics] = useState(false);

  // Rule execution
  const [executingRules, setExecutingRules] = useState<Set<number>>(new Set());
  const [bulkOperationLoading, setBulkOperationLoading] = useState(false);

  // UI state
  const [activeTab, setActiveTab] = useState<'rules' | 'monitoring' | 'analytics'>('rules');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRule, setEditingRule] = useState<LinkRuleResponseDto | null>(null);
  const [viewingRule, setViewingRule] = useState<LinkRuleResponseDto | null>(null);

  // Execution history state
  const [recentExecutions, setRecentExecutions] = useState<LinkRuleExecutionLogDto[]>([]);
  const [executionHistoryLoading, setExecutionHistoryLoading] = useState(false);
  const [executionHistoryPage, setExecutionHistoryPage] = useState(0);
  const [executionHistoryTotalPages, setExecutionHistoryTotalPages] = useState(0);
  const [executionHistoryTotalElements, setExecutionHistoryTotalElements] = useState(0);
  const [executionHistoryPageSize, setExecutionHistoryPageSize] = useState(20);
  const [selectedRuleStats, setSelectedRuleStats] = useState<LinkRuleAggregatedStats | null>(null);

  // Audit Logs state
  const [showAuditLogsModal, setShowAuditLogsModal] = useState(false);
  const [selectedAuditRule, setSelectedAuditRule] = useState<LinkRuleResponseDto | null>(null);
  const [auditLogs, setAuditLogs] = useState<LinkRuleAuditLogDto[]>([]);
  const [auditLogsLoading, setAuditLogsLoading] = useState(false);
  const [auditLogsPage, setAuditLogsPage] = useState(0);
  const [auditLogsTotalPages, setAuditLogsTotalPages] = useState(0);

  const openEditRule = async (ruleId: number) => {
    try {
      const full = await linkRuleService.getLinkRuleById(ruleId);
      setEditingRule(full);
    } catch (e) {
      console.error('Failed to load rule details', e);
    }
  };
  const [importing, setImporting] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Unique categories from loaded rules for the filter
  const uniqueCategories = useMemo(() => {
    const cats = new Map<number, string>();
    linkRules.forEach(rule => {
      if (rule.sourceCategory) cats.set(rule.sourceCategory.id, rule.sourceCategory.name);
      if (rule.targetCategory) cats.set(rule.targetCategory.id, rule.targetCategory.name);
    });
    return Array.from(cats.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [linkRules]);

  // Client-side filtered rules (category filter)
  const filteredLinkRules = useMemo(() => {
    if (filterCategory === 'all') return linkRules;
    const catId = parseInt(filterCategory);
    return linkRules.filter(rule =>
      rule.sourceCategory?.id === catId || rule.targetCategory?.id === catId
    );
  }, [linkRules, filterCategory]);

  // Track previous filter values to avoid unnecessary refetches
  const prevFiltersRef = useRef({ filterStatus, filterLinkType });
  const isFirstRender = useRef(true);

  // Refetch when filters change (but not on initial mount - hook handles that)
  useEffect(() => {
    // Skip on first render - hook handles initial fetch
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevFiltersRef.current = { filterStatus, filterLinkType };
      return;
    }

    // Only refetch if filters actually changed
    if (prevFiltersRef.current.filterStatus !== filterStatus ||
      prevFiltersRef.current.filterLinkType !== filterLinkType) {
      fetchData(false);
      prevFiltersRef.current = { filterStatus, filterLinkType };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, filterLinkType]);

  // Load statistics when switching to monitoring tab
  useEffect(() => {
    if (activeTab === 'monitoring') {
      loadRuleStatistics();
    }
  }, [activeTab]);

  // Load cache statistics when switching to analytics tab
  useEffect(() => {
    if (activeTab === 'analytics') {
      loadCacheStatistics();
    }
  }, [activeTab]);

  // Load execution history when switching to monitoring tab
  useEffect(() => {
    if (activeTab === 'monitoring') {
      loadRecentExecutions();
    }
  }, [activeTab]);

  // Load recent execution history
  const loadRecentExecutions = async (page: number = 0, size?: number) => {
    try {
      setExecutionHistoryLoading(true);
      const ps = size ?? executionHistoryPageSize;
      const response = await linkRuleService.getRecentExecutions(page, ps);
      setRecentExecutions(response.content);
      setExecutionHistoryTotalPages(response.totalPages);
      setExecutionHistoryTotalElements(response.totalElements ?? 0);
      setExecutionHistoryPage(page);
    } catch (error) {
      console.error('Error loading execution history:', error);
      showNotification('error', 'Error', 'Failed to load execution history');
    } finally {
      setExecutionHistoryLoading(false);
    }
  };

  // Load rule statistics
  const loadRuleStatistics = async () => {
    try {
      const stats = await linkRuleService.getAllLinkRuleStatistics();
      setRuleStatistics(stats);
    } catch (error) {
      console.error('Error loading rule statistics:', error);
      showNotification('error', 'Error', 'Failed to load rule statistics');
    }
  };

  // Load cache statistics
  const loadCacheStatistics = async () => {
    try {
      const stats = await linkRuleService.getCacheStatistics();
      setCacheStatistics(stats);
    } catch (error) {
      console.error('Error loading cache statistics:', error);
      showNotification('error', 'Error', 'Failed to load cache statistics');
    }
  };

  // Approval handlers
  const handleApproveRule = async (ruleId: number) => {
    try {
      await linkRuleService.approveRule(ruleId);
      showSuccess('Success', 'Rule has been approved');
      fetchData(false);
    } catch (error) {
      console.error('Failed to approve rule:', error);
      showNotification('error', 'Error', 'Failed to approve rule');
    }
  };

  const handleRejectRule = async (ruleId: number, reason: string) => {
    if (!reason?.trim()) {
      showNotification('error', 'Operation Cancelled', 'You must provide a reason for rejecting the rule.');
      return;
    }

    try {
      await linkRuleService.rejectRule(ruleId, reason);
      showSuccess('Success', 'Rule has been rejected');
      fetchData(false);
    } catch (error) {
      console.error('Failed to reject rule:', error);
      showNotification('error', 'Error', 'Failed to reject rule');
    }
  };

  const handleOpenAuditLogs = async (rule: LinkRuleResponseDto) => {
    setSelectedAuditRule(rule);
    setShowAuditLogsModal(true);
    await loadAuditLogs(rule.id, 0);
  };

  const loadAuditLogs = async (ruleId: number, page: number = 0) => {
    try {
      setAuditLogsLoading(true);
      const response = await linkRuleService.getRuleAuditLogs(ruleId, page, 20);
      setAuditLogs(response.content);
      setAuditLogsTotalPages(response.totalPages);
      setAuditLogsPage(page);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
      showNotification('error', 'Error', 'Failed to load audit logs');
    } finally {
      setAuditLogsLoading(false);
    }
  };

  // Enhanced CRUD operations
  const handleCreateRule = async (ruleData: LinkRuleRequestDto) => {
    try {
      const newRule = await linkRuleService.createLinkRule(ruleData);
      addRule(newRule);
      showNotification('success', 'Success', 'Link rule created successfully');
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating link rule:', error);
      showNotification('error', 'Error', 'Failed to create link rule');
      throw error;
    }
  };

  const handleUpdateRule = async (ruleId: number, ruleData: LinkRuleRequestDto) => {
    try {
      const updatedRule = await linkRuleService.updateLinkRule(ruleId, ruleData);
      updateRule(ruleId, () => updatedRule);
      showNotification('success', 'Success', 'Link rule updated successfully');
      setEditingRule(null);
    } catch (error) {
      console.error('Error updating link rule:', error);
      showNotification('error', 'Error', 'Failed to update link rule');
      throw error;
    }
  };

  const handleDeleteRule = async (ruleId: number) => {
    if (!confirm('Are you sure you want to delete this link rule?')) return;

    try {
      await linkRuleService.deleteLinkRule(ruleId);
      removeRule(ruleId);
      showNotification('success', 'Success', 'Link rule deleted successfully');
    } catch (error) {
      console.error('Error deleting link rule:', error);
      showNotification('error', 'Error', 'Failed to delete link rule');
    }
  };

  const handleToggleRule = async (ruleId: number, enabled: boolean) => {
    try {
      if (enabled) {
        await linkRuleService.toggleLinkRuleStatus(ruleId, true);
        showNotification('success', 'Success', 'Link rule enabled successfully');
      } else {
        await linkRuleService.toggleLinkRuleStatus(ruleId, false);
        showNotification('success', 'Success', 'Link rule disabled successfully');
      }
      updateRule(ruleId, (rule) => ({ ...rule, enabled }));
    } catch (error) {
      console.error('Error toggling link rule:', error);
      showNotification('error', 'Error', 'Failed to update link rule status');
    }
  };

  // Rule execution operations
  const handleExecuteRule = async (ruleId: number) => {
    // Check if rule is APPROVED before executing
    const rule = linkRules.find(r => r.id === ruleId);
    if (rule && rule.status !== 'APPROVED') {
      showNotification('error', 'Cannot Execute', `Only APPROVED rules can be executed. This rule is currently ${rule.status || 'DRAFT'}.`);
      return;
    }
    try {
      setExecutingRules(prev => new Set(prev).add(ruleId));
      const result = await linkRuleService.executeLinkRule({ ruleId });
      const linksCreated = typeof result === 'number' ? result : (result as any)?.linksCreated ?? 0;
      showNotification('success', 'Execution Complete', `Rule executed successfully — ${linksCreated} link${linksCreated !== 1 ? 's' : ''} created.`);
      fetchData(false);
      // Auto-refresh execution history in monitoring tab
      loadRecentExecutions(executionHistoryPage);
    } catch (error) {
      console.error('Error executing rule:', error);
      showNotification('error', 'Execution Failed', 'Failed to execute rule. Check the server logs for details.');
      // Also refresh to show the failed execution in logs
      loadRecentExecutions(executionHistoryPage);
    } finally {
      setExecutingRules(prev => {
        const newSet = new Set(prev);
        newSet.delete(ruleId);
        return newSet;
      });
    }
  };

  const handleReapplyAllRules = async () => {
    try {
      setBulkOperationLoading(true);
      const enabled = await linkRuleService.getEnabledLinkRules();
      if (enabled && enabled.length > 0) {
        await linkRuleService.bulkExecuteLinkRules({ ruleIds: enabled.map(r => r.id) });
      }
      showNotification('success', 'Success', 'All rules reapplication started successfully');
      fetchData(false);
      // Auto-refresh execution history
      loadRecentExecutions(executionHistoryPage);
    } catch (error) {
      console.error('Error reapplying all rules:', error);
      showNotification('error', 'Error', 'Failed to reapply all rules');
      loadRecentExecutions(executionHistoryPage);
    } finally {
      setBulkOperationLoading(false);
    }
  };

  // Bulk operations
  const handleBulkEnable = async () => {
    if (selectedRules.length === 0) return;

    try {
      setBulkOperationLoading(true);
      await linkRuleService.bulkToggleLinkRuleStatus(selectedRules, true);
      selectedRules.forEach(ruleId => {
        updateRule(ruleId, (rule) => ({ ...rule, enabled: true }));
      });
      showNotification('success', 'Success', `${selectedRules.length} rules enabled successfully`);
      setSelectedRules([]);
    } catch (error) {
      console.error('Error bulk enabling rules:', error);
      showNotification('error', 'Error', 'Failed to enable selected rules');
    } finally {
      setBulkOperationLoading(false);
    }
  };

  const handleBulkDisable = async () => {
    if (selectedRules.length === 0) return;

    try {
      setBulkOperationLoading(true);
      await linkRuleService.bulkToggleLinkRuleStatus(selectedRules, false);
      selectedRules.forEach(ruleId => {
        updateRule(ruleId, (rule) => ({ ...rule, enabled: false }));
      });
      showNotification('success', 'Success', `${selectedRules.length} rules disabled successfully`);
      setSelectedRules([]);
    } catch (error) {
      console.error('Error bulk disabling rules:', error);
      showNotification('error', 'Error', 'Failed to disable selected rules');
    } finally {
      setBulkOperationLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRules.length === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedRules.length} selected rules?`)) return;

    try {
      setBulkOperationLoading(true);
      await linkRuleService.bulkDeleteLinkRules(selectedRules);
      selectedRules.forEach(ruleId => removeRule(ruleId));
      showNotification('success', 'Success', `${selectedRules.length} rules deleted successfully`);
      setSelectedRules([]);
    } catch (error) {
      console.error('Error bulk deleting rules:', error);
      showNotification('error', 'Error', 'Failed to delete selected rules');
    } finally {
      setBulkOperationLoading(false);
    }
  };

  // Cache management
  const handleClearDocumentCache = async (documentId: number) => {
    try {
      await linkRuleService.clearCache();
      showNotification('success', 'Success', 'Document cache cleared successfully');
      await loadCacheStatistics(); // Refresh cache stats
    } catch (error) {
      console.error('Error clearing document cache:', error);
      showNotification('error', 'Error', 'Failed to clear document cache');
    }
  };

  const handleClearRuleCache = async (ruleId: number) => {
    try {
      await linkRuleService.clearCache();
      showNotification('success', 'Success', 'Rule cache cleared successfully');
      await loadCacheStatistics(); // Refresh cache stats
    } catch (error) {
      console.error('Error clearing rule cache:', error);
      showNotification('error', 'Error', 'Failed to clear rule cache');
    }
  };

  const handleClearAllCache = async () => {
    try {
      await linkRuleService.clearCache();
      showNotification('success', 'Success', 'All cache cleared successfully');
      await loadCacheStatistics(); // Refresh cache stats
    } catch (error) {
      console.error('Error clearing all cache:', error);
      showNotification('error', 'Error', 'Failed to clear all cache');
    }
  };

  // Utility functions
  const toggleSelectRule = (ruleId: number) => {
    setSelectedRules(prev =>
      prev.includes(ruleId)
        ? prev.filter(id => id !== ruleId)
        : [...prev, ruleId]
    );
  };

  const selectAllRules = () => {
    setSelectedRules(linkRules.map(rule => rule.id));
  };

  const clearSelection = () => {
    setSelectedRules([]);
  };

  // Handle filter changes
  const handleFilterChange = (filterType: string, value: string) => {
    switch (filterType) {
      case 'status':
        setFilterStatus(value as 'all' | 'active' | 'inactive');
        setCurrentPage(0); // Reset to first page
        break;
      case 'linkType':
        setFilterLinkType(value);
        setCurrentPage(0); // Reset to first page
        break;
    }
  };

  if (loading) {
    return <LinkRulesSkeleton />;
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

  if (error) {
    return (
      <Card className="flex flex-col items-center justify-center py-12">
        <CardContent className="text-center">
          <div className="text-destructive text-lg mb-4">{error}</div>
          <Button onClick={() => fetchData(false)}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Link Rules Management</h1>
          <p className="text-muted-foreground">Manage automatic document linking rules with advanced features</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowStatistics(!showStatistics)}
            className="gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Statistics
          </Button>
          <Button
            variant="outline"
            onClick={handleReapplyAllRules}
            disabled={bulkOperationLoading || !canUpdate}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${bulkOperationLoading ? 'animate-spin' : ''}`} />
            Reapply All
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => canCreate && setShowCreateModal(true)}
                disabled={!canCreate}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Rule
              </Button>
            </TooltipTrigger>
            {!canCreate && (
              <TooltipContent>
                <p>You don't have permission to create link rules</p>
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </div>

      {/* Statistics Panel */}
      {showStatistics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Rule Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{totalElements}</div>
                <div className="text-sm text-muted-foreground">Total Rules</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {linkRules.filter(rule => rule.enabled).length}
                </div>
                <div className="text-sm text-muted-foreground">Active Rules</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {linkRules.reduce((sum, rule) => sum + (rule.activeLinksCount || 0), 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Links</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'rules' | 'monitoring' | 'analytics')}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <ServerSearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search rules by name, description, or link type..."
              />

              <Select
                value={filterStatus}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Rules</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filterLinkType}
                onValueChange={(value) => handleFilterChange('linkType', value)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Relation Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="REFERENCE">Reference</SelectItem>
                  <SelectItem value="ATTACHMENT">Attachment</SelectItem>
                  <SelectItem value="PARENT_DOCUMENT">Parent Document</SelectItem>
                  <SelectItem value="CHILD_DOCUMENT">Child Document</SelectItem>
                  <SelectItem value="VERSION">Version</SelectItem>
                  <SelectItem value="ALTERNATIVE_VERSION">Alternative Version</SelectItem>
                  <SelectItem value="SIMILAR_DOCUMENT">Similar Document</SelectItem>
                </SelectContent>
              </Select>

              {uniqueCategories.length > 0 && (
                <div className="flex items-center gap-1">
                  <div className="w-52">
                    <SearchSelect
                      items={[{ id: 0, name: 'All Models' }, ...uniqueCategories]}
                      displayField="name"
                      placeholder="Search models..."
                      valueLabel={filterCategory === 'all' ? 'All Models' : uniqueCategories.find(c => String(c.id) === filterCategory)?.name || 'All Models'}
                      onSelect={(item) => {
                        setFilterCategory(item.id === 0 ? 'all' : String(item.id));
                      }}
                    />
                  </div>
                  {filterCategory !== 'all' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => setFilterCategory('all')}
                    >
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedRules.length} selected
              </span>
              {selectedRules.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkEnable}
                    disabled={bulkOperationLoading || !canUpdate}
                  >
                    Enable Selected
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkDisable}
                    disabled={bulkOperationLoading || !canUpdate}
                  >
                    Disable Selected
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    disabled={bulkOperationLoading || !canDelete}
                  >
                    Delete Selected
                  </Button>
                </>
              )}
              {linkRules.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectedRules.length === linkRules.length ? clearSelection : selectAllRules}
                >
                  {selectedRules.length === linkRules.length ? 'Clear All' : 'Select All'}
                </Button>
              )}
            </div>
          </div>

          {/* Rules Table */}
          {filteredLinkRules.length > 0 ? (
            <>
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="p-3 w-8">
                            <input
                              type="checkbox"
                              className="rounded border-ui"
                              checked={selectedRules.length === filteredLinkRules.length && filteredLinkRules.length > 0}
                              onChange={() => selectedRules.length === filteredLinkRules.length ? clearSelection() : selectAllRules()}
                            />
                          </th>
                          <th className="text-left p-3 font-medium">Name</th>
                          <th className="text-left p-3 font-medium">Type</th>
                          <th className="text-left p-3 font-medium">Source → Target</th>
                          <th className="text-center p-3 font-medium">Status</th>
                          <th className="text-center p-3 font-medium">Active</th>
                          <th className="text-left p-3 font-medium">Approver</th>
                          <th className="text-right p-3 font-medium">Links</th>
                          <th className="text-center p-3 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLinkRules.map((rule) => (
                          <tr
                            key={rule.id}
                            className="border-b hover:bg-muted/30 transition-colors cursor-pointer"
                            onClick={() => setViewingRule(rule)}
                          >
                            <td className="p-3" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                className="rounded border-ui"
                                checked={selectedRules.includes(rule.id)}
                                onChange={() => toggleSelectRule(rule.id)}
                              />
                            </td>
                            <td className="p-3">
                              <div className="font-medium">{rule.name}</div>
                              {rule.description && (
                                <div className="text-xs text-muted-foreground truncate max-w-[200px]">{rule.description}</div>
                              )}
                            </td>
                            <td className="p-3">
                              <Badge variant="outline" className="font-normal text-xs">
                                {rule.relationType?.replace(/_/g, ' ')}
                              </Badge>
                            </td>
                            <td className="p-3 text-xs">
                              <span className="font-medium">{rule.sourceCategory?.name || '—'}</span>
                              <span className="text-muted-foreground mx-1">→</span>
                              <span className="font-medium">{rule.targetCategory?.name || '—'}</span>
                            </td>
                            <td className="p-3 text-center">
                              <Badge variant={
                                rule.status === 'APPROVED' ? 'default' :
                                  rule.status === 'REJECTED' ? 'destructive' :
                                    rule.status === 'PENDING_APPROVAL' ? 'outline' : 'secondary'
                              } className="text-xs">
                                {rule.status?.replace('_', ' ') || 'DRAFT'}
                              </Badge>
                            </td>
                            <td className="p-3 text-center">
                              <Badge variant={rule.enabled ? 'default' : 'secondary'} className="text-xs">
                                {rule.enabled ? 'Active' : 'Inactive'}
                              </Badge>
                            </td>
                            <td className="p-3">
                              {rule.approvedBy ? (
                                <div className="flex items-center gap-2">
                                  <UserAvatar user={rule.approvedBy} size="xs" showTooltip />
                                  <span className="text-xs text-muted-foreground truncate max-w-[120px]">{rule.approvedBy.email || rule.approvedBy.displayName || ''}</span>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="p-3 text-right font-mono text-xs">{rule.activeLinksCount || 0}</td>
                            <td className="p-3" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-center gap-1">
                                {executingRules.has(rule.id) ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                ) : (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => canUpdate && rule.status === 'APPROVED' && handleExecuteRule(rule.id)}
                                        disabled={!canUpdate || rule.status !== 'APPROVED'}
                                      >
                                        <Zap className="h-3.5 w-3.5" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{rule.status !== 'APPROVED' ? 'Only APPROVED rules can be executed' : 'Execute rule'}</TooltipContent>
                                  </Tooltip>
                                )}
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => handleToggleRule(rule.id, !rule.enabled)}
                                      disabled={executingRules.has(rule.id)}
                                    >
                                      {rule.enabled ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>{rule.enabled ? 'Disable' : 'Enable'}</TooltipContent>
                                </Tooltip>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7">
                                      <MoreVertical className="h-3.5 w-3.5" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => canUpdate && openEditRule(rule.id)} disabled={!canUpdate}>
                                      <Edit className="mr-2 h-4 w-4" /> Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setViewingRule(rule)}>
                                      <Eye className="mr-2 h-4 w-4" /> View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleOpenAuditLogs(rule)}>
                                      <FileText className="mr-2 h-4 w-4" /> View Audit Logs
                                    </DropdownMenuItem>
                                    {(rule.status === 'PENDING_APPROVAL' || rule.status === 'DRAFT') && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => handleApproveRule(rule.id)}>
                                          <CheckCircle className="mr-2 h-4 w-4 text-green-600" /> Approve
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleRejectRule(rule.id, prompt('Reason for rejection:') || '')}>
                                          <XCircle className="mr-2 h-4 w-4 text-red-600" /> Reject
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      variant="destructive"
                                      onClick={() => canDelete && handleDeleteRule(rule.id)}
                                      disabled={!canDelete}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalElements={totalElements}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
              />
            </>
          ) : !loading && !tableLoading ? (
            <Card className="flex flex-col items-center justify-center py-12">
              <CardContent className="text-center">
                <Link2 className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No link rules found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || filterStatus !== 'all' || filterLinkType !== 'all'
                    ? 'No rules match your current filters.'
                    : 'Create your first link rule to get started.'
                  }
                </p>
                <Button
                  onClick={() => canCreate && setShowCreateModal(true)}
                  disabled={!canCreate}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Rule
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>

        {/* ───── Monitoring Tab ───── */}
        <TabsContent value="monitoring" className="space-y-6">
          {/* Execution History */}
          <ExecutionHistoryTab
            recentExecutions={recentExecutions}
            loading={executionHistoryLoading}
            currentPage={executionHistoryPage}
            totalPages={executionHistoryTotalPages}
            totalElements={executionHistoryTotalElements}
            pageSize={executionHistoryPageSize}
            onPageChange={(page) => loadRecentExecutions(page)}
            onPageSizeChange={(size) => { setExecutionHistoryPageSize(size); loadRecentExecutions(0, size); }}
            onRefresh={() => loadRecentExecutions(executionHistoryPage)}
            onViewRuleStats={async (ruleId: number) => {
              try {
                const stats = await linkRuleService.getRuleAggregatedStats(ruleId);
                setSelectedRuleStats(stats);
              } catch (error) {
                console.error('Error loading rule stats:', error);
              }
            }}
            selectedRuleStats={selectedRuleStats}
            onCloseRuleStats={() => setSelectedRuleStats(null)}
            onRetryRule={async (ruleId: number) => {
              await handleExecuteRule(ruleId);
              loadRecentExecutions(executionHistoryPage);
            }}
          />

          {/* Rule Performance (merged from old Statistics tab) */}
          <StatisticsTab
            ruleStatistics={ruleStatistics}
            linkRules={linkRules}
            onRefresh={loadRuleStatistics}
          />
        </TabsContent>

        {/* ───── Analytics Tab ───── */}
        <TabsContent value="analytics" className="space-y-4">
          <TrendChartsTab />
          <Separator className="my-6" />
          <CacheManagementTab
            cacheStatistics={cacheStatistics}
            onRefresh={loadCacheStatistics}
            onClearDocumentCache={handleClearDocumentCache}
            onClearRuleCache={handleClearRuleCache}
            onClearAllCache={handleClearAllCache}
          />
        </TabsContent>
      </Tabs>

      {/* Create/Edit Rule Modal */}
      {
        (showCreateModal || editingRule) && (
          <RuleModal
            isOpen={Boolean(showCreateModal || editingRule)}
            onClose={() => { setShowCreateModal(false); setEditingRule(null); }}
            initial={editingRule}
            onSubmit={async (payload) => {
              if (editingRule) {
                await handleUpdateRule(editingRule.id, payload);
              } else {
                await handleCreateRule(payload);
              }
            }}
          />
        )
      }

      {/* Rule Detail Sheet (Side Drawer) */}
      <RuleDetailSheet
        rule={viewingRule}
        onClose={() => setViewingRule(null)}
      />

      {/* Audit Logs Modal */}
      <AuditLogsModal
        isOpen={showAuditLogsModal}
        onClose={() => setShowAuditLogsModal(false)}
        rule={selectedAuditRule}
        logs={auditLogs}
        loading={auditLogsLoading}
        page={auditLogsPage}
        totalPages={auditLogsTotalPages}
        onPageChange={(page) => {
          if (selectedAuditRule) {
            loadAuditLogs(selectedAuditRule.id, page);
          }
        }}
      />
    </div >
  );
}

// Execution History Tab Component
function ExecutionHistoryTab({
  recentExecutions,
  loading,
  currentPage,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onRefresh,
  onViewRuleStats,
  selectedRuleStats,
  onCloseRuleStats,
  onRetryRule,
}: {
  recentExecutions: LinkRuleExecutionLogDto[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onRefresh: () => void;
  onViewRuleStats: (ruleId: number) => void;
  selectedRuleStats: LinkRuleAggregatedStats | null;
  onCloseRuleStats: () => void;
  onRetryRule: (ruleId: number) => void;
}) {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterTrigger, setFilterTrigger] = useState<string>('all');
  const [filterRuleName, setFilterRuleName] = useState<string>('all');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const formatDuration = (ms: number | null) => {
    if (ms == null) return '—';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleString();
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <Badge variant="outline" className="border-green-600 text-green-700 font-normal">Completed</Badge>;
      case 'RUNNING': return <Badge variant="outline" className="border-blue-600 text-blue-700 font-normal animate-pulse">Running</Badge>;
      case 'FAILED': return <Badge variant="outline" className="border-red-600 text-red-700 font-normal">Failed</Badge>;
      default: return <Badge variant="outline" className="font-normal">{status}</Badge>;
    }
  };

  const triggerLabel = (trigger: string | null): string => {
    if (!trigger) return 'Unknown';
    const labels: Record<string, string> = {
      ADMIN_FULL_SCAN: 'Full Scan',
      UPLOAD: 'Upload',
      BULK_UPLOAD: 'Bulk Upload',
      CLASSIFY: 'Classify',
      METADATA_UPDATE: 'Metadata Update',
      VERSION_UPLOAD: 'New Version',
      RENAME: 'Rename',
      MOVE: 'Move',
      MANUAL_LINK: 'Manual Link',
      MANUAL_UNLINK: 'Unlink',
      REAPPLY_ALL: 'Reapply All',
      SCHEDULED: 'Scheduled (Cron)',
    };
    return labels[trigger] || trigger.replace(/_/g, ' ');
  };

  // Client-side filtering
  // Unique rule names for filter dropdown
  const uniqueRuleNames = useMemo(() => {
    const names = new Map<number, string>();
    recentExecutions.forEach(exec => {
      if (exec.ruleName && exec.ruleId != null) names.set(exec.ruleId, exec.ruleName);
    });
    return Array.from(names.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [recentExecutions]);

  const filtered = recentExecutions.filter((exec) => {
    if (filterStatus !== 'all' && exec.status !== filterStatus) return false;
    if (filterTrigger !== 'all' && exec.triggerSource !== filterTrigger) return false;
    if (filterRuleName !== 'all' && String(exec.ruleId) !== filterRuleName) return false;
    return true;
  });

  // Failure rate stats
  const totalExecs = recentExecutions.length;
  const failedExecs = recentExecutions.filter(e => e.status === 'FAILED').length;
  const completedExecs = recentExecutions.filter(e => e.status === 'COMPLETED').length;
  const runningExecs = recentExecutions.filter(e => e.status === 'RUNNING').length;
  const failureRate = totalExecs > 0 ? ((failedExecs / totalExecs) * 100).toFixed(1) : '0';

  const toggleExpanded = (id: number) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const parseErrorDetails = (details: string | null): Array<{ docId?: number; message?: string }> => {
    if (!details) return [];
    try {
      return JSON.parse(details);
    } catch {
      return [{ message: details }];
    }
  };

  const triggerOptions = [
    { value: 'all', label: 'All Triggers' },
    { value: 'ADMIN_FULL_SCAN', label: 'Full Scan' },
    { value: 'UPLOAD', label: 'Upload' },
    { value: 'BULK_UPLOAD', label: 'Bulk Upload' },
    { value: 'CLASSIFY', label: 'Classify' },
    { value: 'METADATA_UPDATE', label: 'Metadata Update' },
    { value: 'VERSION_UPLOAD', label: 'New Version' },
    { value: 'RENAME', label: 'Rename' },
    { value: 'MOVE', label: 'Move' },
    { value: 'MANUAL_LINK', label: 'Manual Link' },
    { value: 'MANUAL_UNLINK', label: 'Unlink' },
  ];

  return (
    <div className="space-y-4">
      {/* Failure Rate Indicators */}
      {totalExecs > 0 && (
        <div className="grid grid-cols-4 gap-3">
          <div className="p-3 border rounded-lg text-center">
            <div className="text-lg font-bold">{totalExecs}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="p-3 border rounded-lg text-center">
            <div className="text-lg font-bold text-green-600">{completedExecs}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
          <div className="p-3 border rounded-lg text-center">
            <div className="text-lg font-bold text-blue-600">{runningExecs}</div>
            <div className="text-xs text-muted-foreground">Running</div>
          </div>
          <div className={`p-3 border rounded-lg text-center ${parseFloat(failureRate) > 10 ? 'border-red-300 bg-red-50/50' : ''}`}>
            <div className={`text-lg font-bold ${failedExecs > 0 ? 'text-red-600' : ''}`}>{failedExecs} <span className="text-xs font-normal text-muted-foreground">({failureRate}%)</span></div>
            <div className="text-xs text-muted-foreground">Failed</div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Execution History
          </h3>
          <p className="text-sm text-muted-foreground">Activity log across all rules and manual operations</p>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="RUNNING">Running</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterTrigger} onValueChange={setFilterTrigger}>
          <SelectTrigger className="w-40 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {triggerOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {uniqueRuleNames.length > 0 && (
          <Select value={filterRuleName} onValueChange={setFilterRuleName}>
            <SelectTrigger className="w-48 h-9">
              <SelectValue placeholder="Filter by rule" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rules</SelectItem>
              {uniqueRuleNames.map((r) => (
                <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {(filterStatus !== 'all' || filterTrigger !== 'all' || filterRuleName !== 'all') && (
          <Button variant="ghost" size="sm" onClick={() => { setFilterStatus('all'); setFilterTrigger('all'); setFilterRuleName('all'); }}>
            Clear filters
          </Button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <Card><CardContent className="flex items-center justify-center py-12"><RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" /></CardContent></Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No execution history</h3>
            <p className="text-muted-foreground">{recentExecutions.length === 0 ? 'Run a rule to see its execution details here.' : 'No results match your filters.'}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-medium">Trigger</th>
                      <th className="text-left p-3 font-medium">Rule</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-right p-3 font-medium">Links</th>
                      <th className="text-right p-3 font-medium">Skipped</th>
                      <th className="text-right p-3 font-medium">Errors</th>
                      <th className="text-right p-3 font-medium">Duration</th>
                      <th className="text-left p-3 font-medium">Document</th>
                      <th className="text-left p-3 font-medium">Date</th>
                      <th className="text-left p-3 font-medium">User</th>
                      <th className="p-3 font-medium w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((exec) => (
                      <React.Fragment key={exec.id}>
                        <tr className={`border-b hover:bg-muted/30 transition-colors ${exec.status === 'FAILED' ? 'bg-red-50/30' : ''}`}>
                          {/* Trigger */}
                          <td className="p-3">
                            <Badge variant="secondary" className="font-normal">
                              {triggerLabel(exec.triggerSource)}
                            </Badge>
                          </td>
                          {/* Rule */}
                          <td className="p-3">
                            {exec.ruleId ? (
                              <>
                                <button
                                  className="text-primary hover:underline font-medium text-left"
                                  onClick={() => onViewRuleStats(exec.ruleId!)}
                                >
                                  {exec.ruleName}
                                </button>
                                <div className="text-xs text-muted-foreground">{exec.relationType?.replace(/_/g, ' ')}</div>
                              </>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          {/* Status */}
                          <td className="p-3">{statusBadge(exec.status)}</td>
                          {/* Links Created */}
                          <td className="p-3 text-right">
                            {exec.linksCreated > 0 ? (
                              <span className="font-medium">{exec.linksCreated}</span>
                            ) : (
                              <span className="text-muted-foreground">0</span>
                            )}
                          </td>
                          {/* Skipped */}
                          <td className="p-3 text-right">
                            {(exec.linksSkippedParent + exec.linksSkippedExisting + exec.linksSkippedSelf) > 0 ? (
                              <Tooltip>
                                <TooltipTrigger>
                                  <span className="text-muted-foreground">{exec.linksSkippedParent + exec.linksSkippedExisting + exec.linksSkippedSelf}</span>
                                </TooltipTrigger>
                                <TooltipContent className="text-xs">
                                  {exec.linksSkippedParent > 0 && <div>{exec.linksSkippedParent} parent</div>}
                                  {exec.linksSkippedExisting > 0 && <div>{exec.linksSkippedExisting} existing</div>}
                                  {exec.linksSkippedSelf > 0 && <div>{exec.linksSkippedSelf} self</div>}
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          {/* Errors — clickable to expand */}
                          <td className="p-3 text-right">
                            {exec.errors > 0 ? (
                              <button
                                className="text-destructive font-medium hover:underline inline-flex items-center gap-1"
                                onClick={() => toggleExpanded(exec.id)}
                              >
                                {exec.errors}
                                <ChevronDown className={`h-3 w-3 transition-transform ${expandedRows.has(exec.id) ? 'rotate-180' : ''}`} />
                              </button>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          {/* Duration */}
                          <td className="p-3 text-right font-mono text-xs">{formatDuration(exec.durationMs)}</td>
                          {/* Document card */}
                          <td className="p-3">
                            {exec.sourceDocumentId ? (
                              <a
                                href={`/documents/${exec.sourceDocumentId}`}
                                className="inline-flex items-center gap-1.5 px-2 py-1 rounded border bg-muted/40 hover:bg-muted transition-colors text-xs max-w-[180px]"
                                title={exec.sourceDocumentName || `Document #${exec.sourceDocumentId}`}
                              >
                                <FileText className="h-3 w-3 shrink-0 text-muted-foreground" />
                                <span className="truncate">{exec.sourceDocumentName || `#${exec.sourceDocumentId}`}</span>
                                <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                              </a>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          {/* Date */}
                          <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">{formatDate(exec.startedAt)}</td>
                          {/* User */}
                          <td className="p-3">
                            {exec.executedByName ? (
                              <div className="flex items-center gap-2">
                                <UserAvatar
                                  user={{ displayName: exec.executedByName, id: exec.executedById || undefined }}
                                  size="xs"
                                  showTooltip
                                />
                                <div className="min-w-0">
                                  <div className="text-xs font-medium truncate">{exec.executedByName}</div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">System</span>
                            )}
                          </td>
                          {/* Actions — retry for failed */}
                          <td className="p-3">
                            {exec.status === 'FAILED' && exec.ruleId && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-orange-600 hover:text-orange-700"
                                    onClick={() => onRetryRule(exec.ruleId!)}
                                  >
                                    <RefreshCw className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Retry this rule</TooltipContent>
                              </Tooltip>
                            )}
                          </td>
                        </tr>
                        {/* Expandable error details row */}
                        {expandedRows.has(exec.id) && (exec.errorDetails || exec.errorStackTrace) && (
                          <tr className="bg-red-50/50 border-b">
                            <td colSpan={11} className="p-3">
                              <div className="text-xs space-y-2">
                                <div className="font-medium text-destructive mb-2">Error Details ({exec.errors} errors)</div>
                                {exec.errorDetails && (
                                  <div className="max-h-48 overflow-y-auto space-y-1">
                                    {parseErrorDetails(exec.errorDetails).map((err, idx) => (
                                      <div key={idx} className="flex items-start gap-2 p-2 rounded border border-red-200 bg-white">
                                        <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                                        <div className="min-w-0 flex-1">
                                          {err.docId && (
                                            <a href={`/documents/${err.docId}`} className="text-primary hover:underline font-medium">
                                              Doc #{err.docId}
                                            </a>
                                          )}
                                          <span className="text-muted-foreground ml-1">{err.message || 'Unknown error'}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {exec.errorStackTrace && (
                                  <details className="mt-2">
                                    <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
                                      Stack Trace
                                    </summary>
                                    <pre className="mt-1 p-2 bg-gray-900 text-gray-100 rounded text-[10px] leading-tight overflow-x-auto max-h-60">
                                      {exec.errorStackTrace}
                                    </pre>
                                  </details>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalElements={totalElements}
            pageSize={pageSize}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        </>
      )}

      {/* Per-Rule Stats Panel */}
      {selectedRuleStats && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Rule Aggregated Stats</CardTitle>
              <Button variant="ghost" size="sm" onClick={onCloseRuleStats}>×</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div><div className="text-xl font-bold">{selectedRuleStats.totalExecutions}</div><div className="text-xs text-muted-foreground">Total Executions</div></div>
              <div><div className="text-xl font-bold">{selectedRuleStats.totalLinksCreated}</div><div className="text-xs text-muted-foreground">Total Links Created</div></div>
              <div><div className="text-xl font-bold">{selectedRuleStats.activeLinks}</div><div className="text-xs text-muted-foreground">Active Links</div></div>
              <div><div className="text-xl font-bold">{formatDuration(selectedRuleStats.avgDurationMs)}</div><div className="text-xs text-muted-foreground">Avg Duration</div></div>
            </div>
            {selectedRuleStats.lastExecutedAt && (
              <div className="mt-4 pt-3 border-t">
                <div className="text-xs text-muted-foreground">
                  Last execution: {formatDate(selectedRuleStats.lastExecutedAt)}
                  {' — '}
                  {statusBadge(selectedRuleStats.lastStatus || 'COMPLETED')}
                  {' — '}
                  <span className="font-medium">{selectedRuleStats.lastLinksCreated}</span> created
                  {selectedRuleStats.lastSkippedParent ? <>, <span>{selectedRuleStats.lastSkippedParent}</span> skipped (parent)</> : null}
                  {selectedRuleStats.lastErrors ? <>, <span className="text-destructive">{selectedRuleStats.lastErrors}</span> errors</> : null}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Audit Logs Modal Component
function AuditLogsModal({
  isOpen,
  onClose,
  rule,
  logs,
  loading,
  page,
  totalPages,
  onPageChange
}: {
  isOpen: boolean;
  onClose: () => void;
  rule: LinkRuleResponseDto | null;
  logs: LinkRuleAuditLogDto[];
  loading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-semibold">Audit Logs: {rule?.name}</h3>
            <p className="text-sm text-muted-foreground">Governance history and lifecycle events</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <XCircle className="h-4 w-4" />
          </Button>
        </div>

        {/* Scrollable content */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 mb-4 opacity-20" />
              <p>No audit logs found for this rule.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map(log => (
                <Card key={log.id} className="shadow-sm">
                  <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b bg-muted/20">
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        log.action === 'APPROVE' ? 'default' :
                          log.action === 'REJECT' ? 'destructive' :
                            log.action === 'UPDATE' ? 'secondary' : 'outline'
                      }>
                        {log.action}
                      </Badge>
                      <span className="text-sm text-muted-foreground ml-2">
                        {new Date(log.changedAt).toLocaleString()}
                      </span>
                    </div>
                    {log.changedBy && (
                      <div className="flex items-center gap-2">
                        <UserAvatar user={log.changedBy} size="xs" showTooltip />
                        <span className="text-xs text-muted-foreground">{log.changedBy.email || log.changedBy.displayName || ''}</span>
                      </div>
                    )}
                  </CardHeader>
                  {log.reason && (
                    <CardContent className="py-3 px-4 bg-muted/10">
                      <p className="text-sm"><span className="font-medium mr-2">Reason:</span>{log.reason}</p>
                    </CardContent>
                  )}
                </Card>
              ))}

              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    pageSize={10}
                    onPageChange={onPageChange}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Statistics Tab Component
function StatisticsTab({
  ruleStatistics,
  linkRules,
  onRefresh
}: {
  ruleStatistics: RuleStatistics[];
  linkRules: LinkRuleResponseDto[];
  onRefresh: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Rule Statistics</h2>
        <Button onClick={onRefresh} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{linkRules.length}</div>
            <p className="text-xs text-muted-foreground">All link rules</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {linkRules.filter(rule => rule.enabled).length}
            </div>
            <p className="text-xs text-muted-foreground">Currently enabled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {linkRules.reduce((sum, rule) => sum + (rule.activeLinksCount || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">Created by rules</p>
          </CardContent>
        </Card>
      </div>

      {ruleStatistics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Rule Performance Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ruleStatistics.map((stat) => {
                const linksCreated = stat.linksCreated ?? stat.totalLinksCreated ?? 0;
                return (
                  <div key={stat.ruleId} className="p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="font-semibold text-lg">{stat.ruleName}</div>
                          {stat.enabled !== undefined && (
                            <Badge variant={stat.enabled ? 'default' : 'secondary'}>
                              {stat.enabled ? 'Enabled' : 'Disabled'}
                            </Badge>
                          )}
                          {stat.relationType && (
                            <Badge variant="outline">{stat.relationType}</Badge>
                          )}
                        </div>
                        {stat.ruleDescription && (
                          <p className="text-sm text-muted-foreground mb-2">{stat.ruleDescription}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Links Created</div>
                        <div className="text-xl font-bold text-blue-600">{linksCreated}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Executions</div>
                        <div className="text-xl font-bold">{stat.totalExecutions || 0}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Success Rate</div>
                        <div className="text-xl font-bold text-green-600">
                          {Math.round((stat.successRate || 0) * 100)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Avg Time</div>
                        <div className="text-xl font-bold">
                          {stat.averageExecutionTime ? `${stat.averageExecutionTime}ms` : 'N/A'}
                        </div>
                      </div>
                    </div>

                    {stat.lastExecutedAt && (
                      <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                        Last executed: {new Date(stat.lastExecutedAt).toLocaleString()}
                      </div>
                    )}

                    {stat.conditionsCount !== undefined && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {stat.conditionsCount} condition{stat.conditionsCount !== 1 ? 's' : ''} •
                        {stat.bidirectional ? ' Bidirectional' : ' Unidirectional'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {ruleStatistics.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-muted-foreground">No rule statistics available</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Trend Charts Tab Component
function TrendChartsTab() {
  const [trends, setTrends] = useState<LinkRuleTrendDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  const loadTrends = async (d: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await linkRuleService.getRuleTrends(d);
      setTrends(data);
    } catch (e: any) {
      console.error('Failed to load trends:', e);
      setError(e?.message || 'Failed to load analytics data. The backend may need to be restarted.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrends(days);
  }, [days]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Execution Trends</h2>
        <div className="flex items-center gap-2">
          <Select value={days.toString()} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => loadTrends(days)} variant="outline" className="gap-2 h-9" disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {loading && (
        <Card><CardContent className="flex items-center justify-center py-12"><RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" /></CardContent></Card>
      )}

      {error && !loading && (
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="text-center py-8">
            <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-red-800 mb-1">Failed to load analytics</h3>
            <p className="text-xs text-red-600 mb-3">{error}</p>
            <Button variant="outline" size="sm" onClick={() => loadTrends(days)}>
              <RefreshCw className="h-3.5 w-3.5 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Executions Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Executions over time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full">
                {trends.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No data available</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                      <RechartsTooltip contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid #e5e7eb' }} />
                      <Area type="monotone" dataKey="totalExecutions" name="Total Executions" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTotal)" />
                      <Area type="monotone" dataKey="failedExecutions" name="Failed Executions" stroke="#ef4444" fillOpacity={1} fill="url(#colorFailed)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Links Created Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Links Created over time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full">
                {trends.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No data available</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorLinks" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                      <RechartsTooltip contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid #e5e7eb' }} />
                      <Area type="monotone" dataKey="linksCreated" name="Links Created" stroke="#10b981" fillOpacity={1} fill="url(#colorLinks)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Cache Management Tab Component
function CacheManagementTab({
  cacheStatistics,
  onRefresh,
  onClearDocumentCache,
  onClearRuleCache,
  onClearAllCache
}: {
  cacheStatistics: LinkRuleCacheStatistics | null;
  onRefresh: () => void;
  onClearDocumentCache: (documentId: number) => void;
  onClearRuleCache: (ruleId: number) => void;
  onClearAllCache: () => void;
}) {
  const [importing, setImporting] = useState(false);
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Link Statistics</h2>
        <Button onClick={onRefresh} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {cacheStatistics ? (
        <>
          {/* Overview Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Links</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{cacheStatistics.totalLinks}</div>
                <p className="text-xs text-muted-foreground">All document links</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Automatic Links</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{cacheStatistics.automaticLinks}</div>
                <p className="text-xs text-muted-foreground">Created by rules</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Manual Links</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{cacheStatistics.manualLinks}</div>
                <p className="text-xs text-muted-foreground">Created manually</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Average Links/Rule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{cacheStatistics.averageLinksPerRule}</div>
                <p className="text-xs text-muted-foreground">Per rule average</p>
              </CardContent>
            </Card>
          </div>

          {/* Rules Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Rules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{cacheStatistics.totalRules}</div>
                <p className="text-xs text-muted-foreground">All link rules</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Enabled Rules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{cacheStatistics.enabledRules}</div>
                <p className="text-xs text-muted-foreground">Currently active</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Disabled Rules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-600">{cacheStatistics.disabledRules}</div>
                <p className="text-xs text-muted-foreground">Currently inactive</p>
              </CardContent>
            </Card>
          </div>

          {/* Links by Type */}
          <Card>
            <CardHeader>
              <CardTitle>Links by Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(cacheStatistics.linksByType || {}).map(([type, count]) => {
                  const colorMap: Record<string, string> = {
                    REFERENCE: 'text-blue-500',
                    ATTACHMENT: 'text-purple-500',
                    PARENT_DOCUMENT: 'text-indigo-500',
                    CHILD_DOCUMENT: 'text-cyan-500',
                    VERSION: 'text-orange-500',
                    ALTERNATIVE_VERSION: 'text-amber-500',
                    SIMILAR_DOCUMENT: 'text-green-500',
                  };
                  return (
                    <div key={type} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">{type.replace(/_/g, ' ')}</div>
                        <div className="text-2xl font-bold">{count as number}</div>
                      </div>
                      <Link2 className={`h-5 w-5 ${colorMap[type] || 'text-gray-500'}`} />
                    </div>
                  );
                })}
                {Object.keys(cacheStatistics.linksByType || {}).length === 0 && (
                  <div className="col-span-full text-center text-muted-foreground text-sm py-4">
                    No links found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-muted-foreground">Loading cache statistics...</div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={onClearAllCache} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh Statistics
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={async () => {
                const data = await linkRuleService.exportLinkRules();
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'link-rules-export.json';
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              <Download className="h-4 w-4" />
              Export Cache Data
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              disabled={importing}
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'application/json';
                input.onchange = async () => {
                  if (!input.files || input.files.length === 0) return;
                  try {
                    setImporting(true);
                    const file = input.files[0];
                    const text = await file.text();
                    const rules = JSON.parse(text);
                    await linkRuleService.importLinkRules(rules);
                    alert('Rules imported successfully! Refreshing statistics...');
                    onRefresh(); // Refresh statistics after import
                  } catch (err) {
                    console.error('Error importing rules:', err);
                    alert('Failed to import rules. Please check the file format.');
                  } finally {
                    setImporting(false);
                  }
                };
                input.click();
              }}
            >
              <Upload className="h-4 w-4" />
              Import Cache Data
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            Statistics show the current state of document links and link rules. Automatic links are created by rules, while manual links are created by users.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Loading Skeleton
function LinkRulesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="h-8 bg-muted rounded w-64 animate-pulse mb-2"></div>
          <div className="h-4 bg-muted rounded w-96 animate-pulse"></div>
        </div>
        <div className="flex gap-2">
          <div className="h-10 bg-muted rounded w-24 animate-pulse"></div>
          <div className="h-10 bg-muted rounded w-32 animate-pulse"></div>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="h-10 bg-muted rounded w-64 animate-pulse"></div>
        <div className="h-10 bg-muted rounded w-32 animate-pulse"></div>
        <div className="h-10 bg-muted rounded w-40 animate-pulse"></div>
      </div>

      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-muted rounded-full"></div>
                  <div>
                    <div className="h-6 bg-muted rounded w-48 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-64"></div>
                  </div>
                </div>
                <div className="h-8 w-8 bg-muted rounded"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="h-4 bg-muted rounded w-24"></div>
                  <div className="h-4 bg-muted rounded w-32"></div>
                  <div className="h-4 bg-muted rounded w-20"></div>
                  <div className="h-4 bg-muted rounded w-16"></div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-6 bg-muted rounded w-16"></div>
                  <div className="flex gap-2">
                    <div className="h-8 bg-muted rounded w-20"></div>
                    <div className="h-8 bg-muted rounded w-24"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Simple Rule Create/Edit Modal
function RuleModal({
  isOpen,
  onClose,
  initial,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  initial: LinkRuleResponseDto | null;
  onSubmit: (payload: LinkRuleRequestDto) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [relationType, setRelationType] = useState(initial?.relationType || 'REFERENCE');
  const [enabled, setEnabled] = useState(initial?.enabled ?? true);
  const [bidirectional, setBidirectional] = useState(initial?.bidirectional ?? false);
  const [priority, setPriority] = useState(initial?.priority ?? 0);
  const [executionOrder, setExecutionOrder] = useState(initial?.executionOrder ?? 0);
  const [scope, setScope] = useState(initial?.scope || 'GLOBAL');
  const [cronExpression, setCronExpression] = useState(initial?.cronExpression || '');
  const [conditionsLogic, setConditionsLogic] = useState<'AND' | 'OR'>((initial as any)?.conditionsLogic || 'AND');
  const [ownerId, setOwnerId] = useState(initial?.owner?.id || '');
  const [selectedOwnerLabel, setSelectedOwnerLabel] = useState(initial?.owner?.displayName || '');
  const [status, setStatus] = useState<string>(initial?.status || 'DRAFT');
  const [saving, setSaving] = useState(false);
  const { showNotification } = useNotifications();

  // Owner user search
  type OwnerUser = { id: string; displayName: string; email: string; username: string; imgUrl?: string };
  const [ownerOptions, setOwnerOptions] = useState<OwnerUser[]>([]);
  useEffect(() => {
    userManagementService.getUsers(0, 100, undefined, 'asc').then(res => {
      setOwnerOptions(res.content.map(u => ({
        id: u.id,
        displayName: u.displayName,
        email: u.email,
        username: u.username,
        imgUrl: u.imgUrl || u.imageUrl,
      })));
    }).catch(err => console.error('Failed to load users for owner select:', err));
  }, []);

  // Filing categories + metadata
  type CategoryOption = { id: number; name: string; description?: string };
  type MetadataOption = { id: number; name: string };
  type ConditionRow = {
    id: string;
    sourceMetadataId?: number;
    targetMetadataId?: number;
    operator: 'EQUAL' | 'NOT_EQUAL' | 'CONTAINS' | 'NOT_CONTAINS';
    caseSensitive: boolean;
    // options are derived from selected top-level categories
  };

  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [sourceCategoryId, setSourceCategoryId] = useState<number | undefined>(undefined);
  const [targetCategoryId, setTargetCategoryId] = useState<number | undefined>(undefined);
  const [sourceMetadataOptions, setSourceMetadataOptions] = useState<MetadataOption[]>([]);
  const [targetMetadataOptions, setTargetMetadataOptions] = useState<MetadataOption[]>([]);
  const [sourceSearch, setSourceSearch] = useState('');
  const [targetSearch, setTargetSearch] = useState('');
  const [rows, setRows] = useState<ConditionRow[]>(() => {
    if (initial?.conditions && initial.conditions.length > 0) {
      return initial.conditions.map((c, idx) => ({
        id: `row-${idx}`,
        sourceMetadataId: (c as any).sourceMetadata?.metadataId ?? (c as any).sourceMetadataId,
        targetMetadataId: (c as any).targetMetadata?.metadataId ?? (c as any).targetMetadataId,
        operator: (c as any).operator || 'EQUAL',
        caseSensitive: (c as any).caseSensitive ?? false,
      }));
    }
    return [
      {
        id: 'row-0',
        operator: 'EQUAL',
        caseSensitive: false,
      },
    ];
  });

  // Load categories
  useEffect(() => {
    (async () => {
      try {
        const page = await filingCategoryService.getFilingCategories(0, 200);
        setCategoryOptions((page.content || []).map((c) => ({ id: c.id, name: c.name })));
        // If editing, initialize models and metadata options from backend response categories
        if (initial?.sourceCategory) {
          setSourceCategoryId(Number(initial.sourceCategory.id));
          setSourceMetadataOptions((initial.sourceCategory.metadataDefinitions || []).map((d: any) => ({ id: d.id, name: d.key })));
        }
        if (initial?.targetCategory) {
          setTargetCategoryId(Number(initial.targetCategory.id));
          setTargetMetadataOptions((initial.targetCategory.metadataDefinitions || []).map((d: any) => ({ id: d.id, name: d.key })));
        }
      } catch { }
    })();
  }, []);

  const loadMetadataForCategory = async (categoryId: number): Promise<MetadataOption[]> => {
    // Only fetch when user changes to a different category than the one provided in initial
    // Otherwise, RuleModal uses initial.sourceCategory/targetCategory to set options
    const cat = await filingCategoryService.getFilingCategoryById(categoryId);
    const defs = cat.metadataDefinitions || [];
    return defs.map((d: any) => ({ id: d.id, name: d.name || d.key }));
  };

  const updateRow = (id: string, patch: Partial<ConditionRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const initialSourceId = initial?.sourceCategory ? Number(initial.sourceCategory.id) : undefined;
  const initialTargetId = initial?.targetCategory ? Number(initial.targetCategory.id) : undefined;

  useEffect(() => {
    (async () => {
      if (!sourceCategoryId) return;
      // Skip fetching if we already populated from initial for the same category
      if (initialSourceId && sourceCategoryId === initialSourceId && sourceMetadataOptions.length > 0) return;
      const opts = await loadMetadataForCategory(sourceCategoryId);
      setSourceMetadataOptions(opts);
      // clear existing source picks when category changes (only if user changed)
      if (!initialSourceId || sourceCategoryId !== initialSourceId) {
        setRows((prev) => prev.map((r) => ({ ...r, sourceMetadataId: undefined })));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceCategoryId]);

  useEffect(() => {
    (async () => {
      if (!targetCategoryId) return;
      if (initialTargetId && targetCategoryId === initialTargetId && targetMetadataOptions.length > 0) return;
      const opts = await loadMetadataForCategory(targetCategoryId);
      setTargetMetadataOptions(opts);
      if (!initialTargetId || targetCategoryId !== initialTargetId) {
        setRows((prev) => prev.map((r) => ({ ...r, targetMetadataId: undefined })));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetCategoryId]);

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      { id: `row-${prev.length}`, operator: 'EQUAL', caseSensitive: false },
    ]);
  };

  const removeRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">{initial ? 'Edit Rule' : 'Create Rule'}</h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Rule name" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Relation Type</label>
              <Select value={relationType} onValueChange={setRelationType}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="REFERENCE">Reference</SelectItem>
                  <SelectItem value="ATTACHMENT">Attachment</SelectItem>
                  <SelectItem value="PARENT_DOCUMENT">Parent Document</SelectItem>
                  <SelectItem value="CHILD_DOCUMENT">Child Document</SelectItem>
                  <SelectItem value="VERSION">Version</SelectItem>
                  <SelectItem value="ALTERNATIVE_VERSION">Alternative Version</SelectItem>
                  <SelectItem value="SIMILAR_DOCUMENT">Similar Document</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-6 mt-6">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
                Enabled
              </label>
            </div>
            {/* Advanced Settings */}
            <details className="group mt-4 col-span-2" open>
              <summary className="flex items-center gap-2 cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors select-none">
                <Settings className="h-4 w-4" />
                Advanced Settings
                <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180 ml-auto" />
              </summary>
              <div className="mt-3 p-4 rounded-lg border bg-muted/30 space-y-4">
                {/* Row 1: Priority & Execution Order */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Priority</label>
                    <Input
                      type="number"
                      min={0}
                      max={99}
                      value={priority}
                      onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
                      className="mt-1.5 h-9 bg-white"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">Higher value = executes first</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Execution Order</label>
                    <Input
                      type="number"
                      min={0}
                      max={99}
                      value={executionOrder}
                      onChange={(e) => setExecutionOrder(parseInt(e.target.value) || 0)}
                      className="mt-1.5 h-9 bg-white"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">Order within same priority level</p>
                  </div>
                </div>

                {/* Row 2: Scope & Cron Expression */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Scope</label>
                    <Select value={scope} onValueChange={setScope}>
                      <SelectTrigger className="mt-1.5 h-9 bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GLOBAL">Global — Search entire repository</SelectItem>
                        <SelectItem value="CATEGORY_ONLY">Category Only — Same category</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Schedule (Cron)</label>
                    <Input
                      placeholder="0 0 * * * *"
                      value={cronExpression}
                      onChange={(e) => setCronExpression(e.target.value)}
                      className="mt-1.5 h-9 bg-white font-mono text-sm"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">Optional. e.g. <code className="px-1 py-0.5 bg-muted rounded text-[9px]">0 0 * * * *</code> = hourly</p>
                  </div>
                </div>

                {/* Row 3: Owner */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Owner</label>
                  <div className="mt-1.5">
                    <SearchSelect
                      items={ownerOptions}
                      displayField="displayName"
                      descriptionField="email"
                      placeholder="Search by name, email, or username..."
                      valueLabel={selectedOwnerLabel}
                      renderItem={(user) => (
                        <div className="flex items-center gap-2">
                          <UserAvatar user={user as any} size="xs" />
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium text-sm truncate">{user.displayName}</span>
                            <span className="text-xs text-muted-foreground truncate">{user.email} · @{user.username}</span>
                          </div>
                        </div>
                      )}
                      onSelect={(user) => {
                        setOwnerId(user.id as string);
                        setSelectedOwnerLabel(user.displayName);
                      }}
                    />
                  </div>
                  {ownerId && (
                    <div className="flex items-center gap-1 mt-1">
                      <p className="text-[10px] text-muted-foreground flex-1">Selected: {selectedOwnerLabel}</p>
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => { setOwnerId(''); setSelectedOwnerLabel(''); }}>
                        <XCircle className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </div>
                  )}
                  {!ownerId && <p className="text-[10px] text-muted-foreground mt-1">Leave empty to assign to yourself</p>}
                </div>
              </div>
            </details>
          </div>
          {/* Governance Preview */}
          {(() => {
            const governanceDefaults: Record<string, { strength: string; permission: string; movement: string; workflow: string; removable: boolean; note?: string }> = {
              REFERENCE: { strength: 'WEAK', permission: 'INDEPENDENT', movement: 'STAY', workflow: 'INDEPENDENT', removable: true },
              ATTACHMENT: { strength: 'NORMAL', permission: 'INHERIT', movement: 'FOLLOW', workflow: 'SHARED', removable: true },
              PARENT_DOCUMENT: { strength: 'STRONG', permission: 'INHERIT', movement: 'FOLLOW', workflow: 'SHARED', removable: false, note: 'Single parent enforced' },
              CHILD_DOCUMENT: { strength: 'STRONG', permission: 'INHERIT', movement: 'FOLLOW', workflow: 'SHARED', removable: false, note: 'Created as inverse of parent' },
              VERSION: { strength: 'NORMAL', permission: 'INHERIT', movement: 'STAY', workflow: 'INDEPENDENT', removable: true },
              ALTERNATIVE_VERSION: { strength: 'WEAK', permission: 'INDEPENDENT', movement: 'STAY', workflow: 'INDEPENDENT', removable: true },
              SIMILAR_DOCUMENT: { strength: 'WEAK', permission: 'INDEPENDENT', movement: 'STAY', workflow: 'INDEPENDENT', removable: true },
            };
            const defaults = governanceDefaults[relationType];
            if (!defaults) return null;
            return (
              <div className="p-3 rounded-lg border bg-blue-50/50 border-blue-200 text-sm space-y-1.5">
                <div className="flex items-center gap-1.5 text-blue-700 font-medium text-xs">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Governance Defaults for {relationType.replace(/_/g, ' ')}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-xs">
                  <div><span className="text-muted-foreground">Strength:</span> <span className="font-medium">{defaults.strength}</span></div>
                  <div><span className="text-muted-foreground">Permission:</span> <span className="font-medium">{defaults.permission}</span></div>
                  <div><span className="text-muted-foreground">Movement:</span> <span className="font-medium">{defaults.movement}</span></div>
                  <div><span className="text-muted-foreground">Removable:</span> <span className={`font-medium ${defaults.removable ? 'text-green-600' : 'text-red-600'}`}>{defaults.removable ? 'Yes' : 'No'}</span></div>
                </div>
                {defaults.note && (
                  <div className="text-xs text-amber-700 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {defaults.note}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Source & Target Model pickers using main SearchSelect */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 border rounded">
              <label className="block text-sm font-medium mb-2">Source Model</label>
              <SearchSelect
                items={categoryOptions}
                onSelect={(item: CategoryOption) => setSourceCategoryId(Number(item.id))}
                placeholder="Search models..."
                displayField={'name'}
                descriptionField={'description'}
                valueLabel={
                  (sourceCategoryId && (categoryOptions.find(c => c.id === sourceCategoryId)?.name || '')) ||
                  (initial?.sourceCategory ? String(initial.sourceCategory.name) : undefined)
                }
              />
            </div>
            <div className="p-3 border rounded">
              <label className="block text-sm font-medium mb-2">Target Model</label>
              <SearchSelect
                items={categoryOptions}
                onSelect={(item: CategoryOption) => setTargetCategoryId(Number(item.id))}
                placeholder="Search models..."
                displayField={'name'}
                descriptionField={'description'}
                valueLabel={
                  (targetCategoryId && (categoryOptions.find(c => c.id === targetCategoryId)?.name || '')) ||
                  (initial?.targetCategory ? String(initial.targetCategory.name) : undefined)
                }
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">Conditions</label>
              <div className="flex items-center gap-3">
                <label className="text-xs text-muted-foreground">Logic</label>
                <Select value={conditionsLogic} onValueChange={(v) => setConditionsLogic(v as 'AND' | 'OR')}>
                  <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AND">AND</SelectItem>
                    <SelectItem value="OR">OR</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={addRow} className="h-8">Add Condition</Button>
              </div>
            </div>
            <div className="space-y-3">
              {rows.map((row) => (
                <div key={row.id} className="p-3 border rounded">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                    <Select value={row.sourceMetadataId?.toString()} onValueChange={(v) => updateRow(row.id, { sourceMetadataId: Number(v) })} disabled={!sourceCategoryId}>
                      <SelectTrigger><SelectValue placeholder="Source Metadata" /></SelectTrigger>
                      <SelectContent>
                        {sourceMetadataOptions.map((m) => (
                          <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={row.targetMetadataId?.toString()} onValueChange={(v) => updateRow(row.id, { targetMetadataId: Number(v) })} disabled={!targetCategoryId}>
                      <SelectTrigger><SelectValue placeholder="Target Metadata" /></SelectTrigger>
                      <SelectContent>
                        {targetMetadataOptions.map((m) => (
                          <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-3">
                    <Select value={row.operator} onValueChange={(v) => updateRow(row.id, { operator: v as any })}>
                      <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EQUAL">EQUAL</SelectItem>
                        <SelectItem value="NOT_EQUAL">NOT_EQUAL</SelectItem>
                        <SelectItem value="CONTAINS">CONTAINS</SelectItem>
                        <SelectItem value="NOT_CONTAINS">NOT_CONTAINS</SelectItem>
                      </SelectContent>
                    </Select>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={row.caseSensitive} onChange={(e) => updateRow(row.id, { caseSensitive: e.target.checked })} />
                      Case Sensitive
                    </label>
                    <Button variant="ghost" size="sm" onClick={() => removeRow(row.id)} className="ml-auto text-red-600">Remove</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="p-6 border-t flex justify-end gap-2 bg-gray-50">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          {!initial || initial.status === 'DRAFT' || initial.status === 'REJECTED' ? (
            <Button
              variant="secondary"
              onClick={async () => {
                // Validation
                if (!name.trim()) return;
                const validConditions = rows.filter((r) => r.sourceMetadataId && r.targetMetadataId);
                if (!sourceCategoryId || !targetCategoryId) {
                  showNotification('error', 'Validation', 'Please select both Source and Target models before saving.');
                  return;
                }
                if (validConditions.length === 0) {
                  showNotification('error', 'Validation', 'Please add at least one complete condition (source + target metadata).');
                  return;
                }
                try {
                  setSaving(true);
                  const payload: LinkRuleRequestDto = {
                    name,
                    description,
                    relationType,
                    conditionsLogic,
                    conditions: validConditions
                      .map((r) => ({
                        sourceMetadataId: r.sourceMetadataId!,
                        targetMetadataId: r.targetMetadataId!,
                        operator: r.operator,
                        caseSensitive: r.caseSensitive,
                      })),
                    enabled,
                    bidirectional,
                    priority,
                    executionOrder,
                    scope,
                    status: 'PENDING_APPROVAL',
                    ownerId: ownerId.trim() ? ownerId.trim() : undefined,
                    cronExpression: cronExpression.trim() ? cronExpression.trim() : undefined,
                  } as any;
                  await onSubmit(payload);
                  onClose();
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving || !name.trim()}
            >
              Submit for Approval
            </Button>
          ) : null}
          <Button
            onClick={async () => {
              // Validation
              if (!name.trim()) return;
              const validConditions = rows.filter((r) => r.sourceMetadataId && r.targetMetadataId);
              if (!sourceCategoryId || !targetCategoryId) {
                showNotification('error', 'Validation', 'Please select both Source and Target models before saving.');
                return;
              }
              if (validConditions.length === 0) {
                showNotification('error', 'Validation', 'Please add at least one complete condition (source + target metadata).');
                return;
              }
              try {
                setSaving(true);
                const payload: LinkRuleRequestDto = {
                  name,
                  description,
                  relationType,
                  conditionsLogic,
                  conditions: validConditions
                    .map((r) => ({
                      sourceMetadataId: r.sourceMetadataId!,
                      targetMetadataId: r.targetMetadataId!,
                      operator: r.operator,
                      caseSensitive: r.caseSensitive,
                    })),
                  enabled,
                  bidirectional,
                  priority,
                  executionOrder,
                  scope,
                  status: status, // keep current status
                  ownerId: ownerId.trim() ? ownerId.trim() : undefined,
                  cronExpression: cronExpression.trim() ? cronExpression.trim() : undefined,
                } as any;
                await onSubmit(payload);
                onClose();
              } finally {
                setSaving(false);
              }
            }}
            disabled={saving || !name.trim()}
          >
            {initial ? 'Save Changes' : 'Save as Draft'}
          </Button>
        </div>
      </div>
    </div >
  );
}

// Read-only Rule Details Modal with execution history
function RuleDetailSheet({
  rule,
  onClose,
}: {
  rule: LinkRuleResponseDto | null;
  onClose: () => void;
}) {
  const [executions, setExecutions] = useState<LinkRuleExecutionLogDto[]>([]);
  const [execLoading, setExecLoading] = useState(false);
  const [execPage, setExecPage] = useState(0);
  const [execTotalPages, setExecTotalPages] = useState(0);
  const [execTotalElements, setExecTotalElements] = useState(0);
  const [exporting, setExporting] = useState(false);

  const handleExportCsv = async () => {
    if (!rule) return;
    try {
      setExporting(true);
      await linkRuleService.exportExecutionHistoryAsCsv(rule.id);
    } catch (err) {
      console.error('Failed to export CSV:', err);
    } finally {
      setExporting(false);
    }
  };

  const loadExecutions = async (ruleId: number, page: number = 0) => {
    try {
      setExecLoading(true);
      const response = await linkRuleService.getRuleExecutionHistory(ruleId, page, 5);
      setExecutions(response.content);
      setExecTotalPages(response.totalPages);
      setExecTotalElements(response.totalElements);
      setExecPage(page);
    } catch (error) {
      console.error('Error loading rule executions:', error);
    } finally {
      setExecLoading(false);
    }
  };

  useEffect(() => {
    if (rule) {
      loadExecutions(rule.id);
    }
  }, [rule?.id]);

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '\u2014';
    return new Date(dateStr).toLocaleDateString('en-US', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const formatDuration = (ms: number | null | undefined) => {
    if (ms == null) return '\u2014';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  if (!rule) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
              <Link2 className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  {rule.name}
                  <Badge variant={rule.enabled ? 'default' : 'secondary'} className="text-xs">
                    {rule.enabled ? 'Active' : 'Inactive'}
                  </Badge>
                </h3>
                <p className="text-sm text-muted-foreground">{rule.description || 'No description'}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-2 h-8" onClick={handleExportCsv} disabled={exporting}>
                  {exporting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  Export CSV
                </Button>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="p-6 overflow-y-auto flex-1">

          <div className="space-y-5 pt-5">
            {/* Rule Configuration */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 border rounded-lg">
                <div className="text-xs text-muted-foreground">Relation Type</div>
                <div className="font-medium text-sm mt-1">{rule.relationType?.replace(/_/g, ' ')}</div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="text-xs text-muted-foreground">Active Links</div>
                <div className="font-bold text-lg text-blue-600 mt-1">{rule.activeLinksCount || 0}</div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="text-xs text-muted-foreground">Conditions</div>
                <div className="font-medium text-sm mt-1">{rule.conditions?.length || 0}</div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="text-xs text-muted-foreground">Priority</div>
                <div className="font-medium text-sm mt-1">
                  <Badge variant={rule.priority > 0 ? 'default' : 'secondary'} className="text-xs font-mono">P{rule.priority}</Badge>
                </div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="text-xs text-muted-foreground">Scope</div>
                <div className="font-medium text-sm mt-1">{rule.scope === 'CATEGORY_ONLY' ? 'Category Only' : 'Global'}</div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="text-xs text-muted-foreground">Exec Order</div>
                <div className="font-medium text-sm mt-1">{rule.executionOrder}</div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="text-xs text-muted-foreground">Bidirectional</div>
                <div className="font-medium text-sm mt-1">{rule.bidirectional ? 'Yes' : 'No'}</div>
              </div>
              {rule.lastExecutedAt && (
                <div className="p-3 border rounded-lg col-span-2">
                  <div className="text-xs text-muted-foreground">Last Execution</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-block h-2 w-2 rounded-full ${rule.lastExecutionStatus === 'COMPLETED' ? 'bg-green-500' :
                      rule.lastExecutionStatus === 'FAILED' ? 'bg-red-500' : 'bg-blue-500 animate-pulse'
                      }`} />
                    <span className="text-sm font-medium">{rule.lastExecutionStatus}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(rule.lastExecutedAt)}
                      {rule.lastExecutionDurationMs != null && ` (${formatDuration(rule.lastExecutionDurationMs)})`}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Created By */}
            <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
              <UserAvatar user={rule.createdBy} size="sm" showTooltip />
              <div className="flex-1">
                <div className="text-sm font-medium">
                  {rule.createdBy?.firstName || ''} {rule.createdBy?.lastName || ''}
                </div>
                {rule.createdBy?.email && (
                  <div className="text-xs text-muted-foreground">{rule.createdBy.email}</div>
                )}
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <div>Created {formatDate(rule.createdAt as any)}</div>
                {rule.updatedAt && rule.updatedAt !== rule.createdAt && (
                  <div>Updated {formatDate(rule.updatedAt as any)}</div>
                )}
              </div>
            </div>

            {/* Categories */}
            {(rule.sourceCategory || rule.targetCategory) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {rule.sourceCategory && (
                  <div className="p-3 border rounded-lg border-blue-200 bg-blue-50/50">
                    <div className="text-xs text-muted-foreground mb-1">Source Category</div>
                    <div className="font-medium text-sm">{rule.sourceCategory.name}</div>
                    {rule.sourceCategory.description && (
                      <div className="text-xs text-muted-foreground mt-1">{rule.sourceCategory.description}</div>
                    )}
                  </div>
                )}
                {rule.targetCategory && (
                  <div className="p-3 border rounded-lg border-green-200 bg-green-50/50">
                    <div className="text-xs text-muted-foreground mb-1">Target Category</div>
                    <div className="font-medium text-sm">{rule.targetCategory.name}</div>
                    {rule.targetCategory.description && (
                      <div className="text-xs text-muted-foreground mt-1">{rule.targetCategory.description}</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Conditions */}
            {(rule.conditions?.length ?? 0) > 0 && (
              <div>
                <div className="text-sm font-medium mb-2">Matching Conditions</div>
                <div className="space-y-2">
                  {(rule.conditions || []).map((c, idx) => (
                    <div key={c.id || idx} className="p-3 border rounded-lg text-sm">
                      <div className="flex flex-wrap gap-2 items-center">
                        <div className="px-2 py-1 rounded bg-blue-50">
                          <div className="text-xs text-muted-foreground">Source</div>
                          <div className="font-medium">
                            {c.sourceMetadata?.categoryName || 'N/A'} / {c.sourceMetadata?.metadataName || c.sourceMetadata?.metadataId || 'N/A'}
                          </div>
                        </div>
                        <Badge variant="outline" className="font-mono">{c.operator}</Badge>
                        <div className="px-2 py-1 rounded bg-green-50">
                          <div className="text-xs text-muted-foreground">Target</div>
                          <div className="font-medium">
                            {c.targetMetadata?.categoryName || 'N/A'} / {c.targetMetadata?.metadataName || c.targetMetadata?.metadataId || 'N/A'}
                          </div>
                        </div>
                      </div>
                      {c.caseSensitive && (
                        <div className="text-xs text-gray-500 mt-1">Case sensitive</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Execution History for this Rule */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Execution History
                  {execTotalElements > 0 && (
                    <span className="text-xs text-muted-foreground">({execTotalElements} total)</span>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={() => loadExecutions(rule.id, execPage)} disabled={execLoading}>
                  <RefreshCw className={`h-3 w-3 ${execLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>

              {execLoading ? (
                <div className="flex items-center justify-center py-6">
                  <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : executions.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm border rounded-lg">
                  No execution history for this rule yet.
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/50 border-b">
                        <th className="text-left p-2 font-medium">Status</th>
                        <th className="text-right p-2 font-medium">Created</th>
                        <th className="text-right p-2 font-medium">Skipped</th>
                        <th className="text-right p-2 font-medium">Errors</th>
                        <th className="text-right p-2 font-medium">Duration</th>
                        <th className="text-left p-2 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {executions.map((exec) => (
                        <tr key={exec.id} className="border-b last:border-0 hover:bg-muted/20">
                          <td className="p-2">
                            <Badge variant={exec.status === 'COMPLETED' ? 'default' : exec.status === 'FAILED' ? 'destructive' : 'secondary'}
                              className={exec.status === 'COMPLETED' ? 'bg-green-600 text-[10px]' : exec.status === 'RUNNING' ? 'bg-blue-600 animate-pulse text-[10px]' : 'text-[10px]'}>
                              {exec.status}
                            </Badge>
                          </td>
                          <td className="p-2 text-right font-mono text-green-600">{exec.linksCreated}</td>
                          <td className="p-2 text-right">
                            {(exec.linksSkippedParent + exec.linksSkippedExisting + exec.linksSkippedSelf) > 0 ? (
                              <Tooltip>
                                <TooltipTrigger>
                                  <span className="text-orange-600">{exec.linksSkippedParent + exec.linksSkippedExisting + exec.linksSkippedSelf}</span>
                                </TooltipTrigger>
                                <TooltipContent className="text-xs">
                                  {exec.linksSkippedParent > 0 && <div>{exec.linksSkippedParent} parent</div>}
                                  {exec.linksSkippedExisting > 0 && <div>{exec.linksSkippedExisting} existing</div>}
                                  {exec.linksSkippedSelf > 0 && <div>{exec.linksSkippedSelf} self</div>}
                                </TooltipContent>
                              </Tooltip>
                            ) : '\u2014'}
                          </td>
                          <td className="p-2 text-right">
                            {exec.errors > 0 ? <span className="text-red-600">{exec.errors}</span> : '\u2014'}
                          </td>
                          <td className="p-2 text-right font-mono">{formatDuration(exec.durationMs)}</td>
                          <td className="p-2 text-muted-foreground">{formatDate(exec.startedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {execTotalPages > 1 && (
                <div className="mt-2">
                  <Pagination
                    currentPage={execPage}
                    totalPages={execTotalPages}
                    totalElements={execTotalElements}
                    pageSize={5}
                    onPageChange={(page) => loadExecutions(rule.id, page)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
