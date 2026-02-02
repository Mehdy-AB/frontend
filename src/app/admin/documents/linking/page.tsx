'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  Upload
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
import { linkRuleService } from '@/api/services/linkRuleService';
import { filingCategoryService } from '@/api/services/filingCategoryService';
import ServerSearchInput from '@/components/main/ServerSearchInput';
import Pagination from '@/components/main/Pagination';
import { useServerSideSearch } from '@/components/main/useServerSideSearch';
import { SearchSelect } from '@/components/main/SearchSelect';
import { 
  LinkRuleResponseDto, 
  LinkRuleRequestDto, 
  RuleStatistics,
  LinkRuleCacheStatistics,
  PageResponse
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
    const filters: { enabled?: boolean; linkType?: string; name?: string } = {};
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
    searchFields: (rule) => [rule.name, rule.description || '', rule.linkType],
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
  const [activeTab, setActiveTab] = useState<'rules' | 'statistics' | 'cache'>('rules');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRule, setEditingRule] = useState<LinkRuleResponseDto | null>(null);
  const [viewingRule, setViewingRule] = useState<LinkRuleResponseDto | null>(null);
  const openEditRule = async (ruleId: number) => {
    try {
      const full = await linkRuleService.getLinkRuleById(ruleId);
      setEditingRule(full);
    } catch (e) {
      console.error('Failed to load rule details', e);
    }
  };
  const [importing, setImporting] = useState(false);

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

  // Load statistics when switching to statistics tab
  useEffect(() => {
    if (activeTab === 'statistics') {
      loadRuleStatistics();
    }
  }, [activeTab]);

  // Load cache statistics when switching to cache tab
  useEffect(() => {
    if (activeTab === 'cache') {
      loadCacheStatistics();
    }
  }, [activeTab]);

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
    try {
      setExecutingRules(prev => new Set(prev).add(ruleId));
      await linkRuleService.executeLinkRule({ ruleId });
      showNotification('success', 'Success', 'Rule execution started successfully');
      fetchData(false); // Refresh to get updated link counts
    } catch (error) {
      console.error('Error executing rule:', error);
      showNotification('error', 'Error', 'Failed to execute rule');
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
      // Fallback: bulk execute all enabled rules
      const enabled = await linkRuleService.getEnabledLinkRules();
      if (enabled && enabled.length > 0) {
        await linkRuleService.bulkExecuteLinkRules({ ruleIds: enabled.map(r => r.id) });
      }
      showNotification('success', 'Success', 'All rules reapplication started successfully');
      fetchData(false); // Refresh to get updated link counts
    } catch (error) {
      console.error('Error reapplying all rules:', error);
      showNotification('error', 'Error', 'Failed to reapply all rules');
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
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'rules' | 'statistics' | 'cache')}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rules">Rules Management</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
          <TabsTrigger value="cache">Link Statistics</TabsTrigger>
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
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Link Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="RELATED">Related</SelectItem>
                  <SelectItem value="SUPERSEDES">Supersedes</SelectItem>
                  <SelectItem value="REFERENCES">References</SelectItem>
                  <SelectItem value="CONTAINS">Contains</SelectItem>
                </SelectContent>
              </Select>
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

      {/* Rules List */}
      <div className="space-y-4">
        {linkRules.map((rule) => (
          <Card key={rule.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Link2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{rule.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{rule.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    className="rounded border-ui"
                    checked={selectedRules.includes(rule.id)}
                    onChange={() => toggleSelectRule(rule.id)}
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => canUpdate && openEditRule(rule.id)}
                            disabled={!canUpdate}
                            className={!canUpdate ? 'opacity-50 cursor-not-allowed' : ''}
                            title={!canUpdate ? "You don't have permission to edit rules" : undefined}
                          >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                       <DropdownMenuItem onClick={() => setViewingRule(rule)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => canUpdate && handleExecuteRule(rule.id)}
                            disabled={!canUpdate}
                            className={!canUpdate ? 'opacity-50 cursor-not-allowed' : ''}
                            title={!canUpdate ? "You don't have permission to execute rules" : undefined}
                          >
                            <Zap className="mr-2 h-4 w-4" />
                            Execute Rule
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        variant="destructive"
                        onClick={() => canDelete && handleDeleteRule(rule.id)}
                        disabled={!canDelete}
                        className={!canDelete ? 'opacity-50 cursor-not-allowed' : ''}
                        title={!canDelete ? "You don't have permission to delete rules" : undefined}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Rule Details */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Link Type</label>
                    <p className="text-sm">{rule.linkType}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Conditions</label>
                    <p className="text-sm">{rule.conditions?.length || 0} condition(s)</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Active Links</label>
                    <p className="text-sm">{rule.activeLinksCount || 0}</p>
                  </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Execution</label>
                        <div className="flex items-center gap-1">
                          {executingRules.has(rule.id) ? (
                            <div className="flex items-center gap-1 text-blue-600">
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                              <span className="text-xs">Running</span>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => canUpdate && handleExecuteRule(rule.id)}
                              disabled={!canUpdate}
                              className="h-6 px-2 text-xs"
                              title={!canUpdate ? "You don't have permission to execute rules" : undefined}
                            >
                              <Zap className="h-3 w-3 mr-1" />
                              Execute
                            </Button>
                          )}
                        </div>
                      </div>
                </div>

                {/* Categories Info */}
                {(rule.sourceCategory || rule.targetCategory) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
                    {rule.sourceCategory && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Source Category</label>
                        <p className="text-sm font-medium">{rule.sourceCategory.name}</p>
                        {rule.sourceCategory.description && (
                          <p className="text-xs text-muted-foreground">{rule.sourceCategory.description}</p>
                        )}
                      </div>
                    )}
                    {rule.targetCategory && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Target Category</label>
                        <p className="text-sm font-medium">{rule.targetCategory.name}</p>
                        {rule.targetCategory.description && (
                          <p className="text-xs text-muted-foreground">{rule.targetCategory.description}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Status and Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                      {rule.enabled ? 'Active' : 'Inactive'}
                    </Badge>
                    {rule.bidirectional && (
                      <Badge variant="outline">Bidirectional</Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleRule(rule.id, !rule.enabled)}
                          disabled={executingRules.has(rule.id)}
                    >
                      {rule.enabled ? (
                        <>
                          <Pause className="h-4 w-4 mr-2" />
                          Disable
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Enable
                        </>
                      )}
                    </Button>
                     <Button 
                       variant="outline" 
                       size="sm" 
                       onClick={() => canUpdate && openEditRule(rule.id)}
                       disabled={!canUpdate}
                       title={!canUpdate ? "You don't have permission to edit rules" : undefined}
                     >
                      <Settings className="h-4 w-4 mr-2" />
                      Configure
                    </Button>
                  </div>
                </div>

                {/* Created/Updated Info */}
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>
                    Created by {rule.createdBy?.firstName || ''} {rule.createdBy?.lastName || ''} on{' '}
                    {rule.createdAt ? new Date(rule.createdAt).toLocaleDateString() : 'N/A'}
                  </div>
                  {rule.updatedAt && rule.updatedAt !== rule.createdAt && (
                    <div>
                      Last updated on {new Date(rule.updatedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalElements={totalElements}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />

          {linkRules.length === 0 && !loading && !tableLoading && (
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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      onClick={() => canCreate && setShowCreateModal(true)}
                      disabled={!canCreate}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Rule
                    </Button>
                  </TooltipTrigger>
                  {!canCreate && (
                    <TooltipContent>
                      <p>You don't have permission to create link rules</p>
                    </TooltipContent>
                  )}
                </Tooltip>
          </CardContent>
        </Card>
      )}
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          <StatisticsTab 
            ruleStatistics={ruleStatistics}
            linkRules={linkRules}
            onRefresh={loadRuleStatistics}
          />
        </TabsContent>

        <TabsContent value="cache" className="space-y-4">
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
      {(showCreateModal || editingRule) && (
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
      )}

       {/* View Rule Details Modal */}
       {viewingRule && (
         <RuleDetailsModal
           rule={viewingRule}
           onClose={() => setViewingRule(null)}
         />
       )}
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
                          {stat.linkType && (
                            <Badge variant="outline">{stat.linkType}</Badge>
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
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">RELATED</div>
                    <div className="text-2xl font-bold">{cacheStatistics.linksByType.RELATED}</div>
                  </div>
                  <Link2 className="h-5 w-5 text-blue-500" />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">SUPERSEDES</div>
                    <div className="text-2xl font-bold">{cacheStatistics.linksByType.SUPERSEDES}</div>
                  </div>
                  <Link2 className="h-5 w-5 text-orange-500" />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">REFERENCES</div>
                    <div className="text-2xl font-bold">{cacheStatistics.linksByType.REFERENCES}</div>
                  </div>
                  <Link2 className="h-5 w-5 text-purple-500" />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">CONTAINS</div>
                    <div className="text-2xl font-bold">{cacheStatistics.linksByType.CONTAINS}</div>
                  </div>
                  <Link2 className="h-5 w-5 text-green-500" />
                </div>
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
                onClick={async () => {
                  try {
                    setImporting(true);
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'application/json';
                    input.onchange = async () => {
                      if (!input.files || input.files.length === 0) return;
                      const file = input.files[0];
                      const text = await file.text();
                      const rules = JSON.parse(text);
                      await linkRuleService.importLinkRules(rules);
                      console.log('Rules imported successfully');
                      // refresh rules after import
                    };
                    input.click();
                  } finally {
                    setImporting(false);
                  }
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
  const [linkType, setLinkType] = useState(initial?.linkType || 'RELATED');
  const [enabled, setEnabled] = useState(initial?.enabled ?? true);
  const [bidirectional, setBidirectional] = useState(initial?.bidirectional ?? false);
  // Note: LinkRuleResponseDto doesn't include conditionsLogic, defaulting to 'AND'
  const [conditionsLogic, setConditionsLogic] = useState<'AND' | 'OR'>('AND');
  const [saving, setSaving] = useState(false);

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
      } catch {}
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
      <div className="bg-white rounded-lg w-full max-w-2xl shadow-xl">
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
              <label className="block text-sm font-medium mb-1">Link Type</label>
              <Select value={linkType} onValueChange={setLinkType}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RELATED">Related</SelectItem>
                  <SelectItem value="SUPERSEDES">Supersedes</SelectItem>
                  <SelectItem value="REFERENCES">References</SelectItem>
                  <SelectItem value="CONTAINS">Contains</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-6 mt-6">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
                Enabled
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={bidirectional} onChange={(e) => setBidirectional(e.target.checked)} />
                Bidirectional
              </label>
            </div>
          </div>

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
          <Button
            onClick={async () => {
              try {
                setSaving(true);
                const payload: LinkRuleRequestDto = {
                  name,
                  description,
                  linkType,
                  conditionsLogic,
                  conditions: rows
                    .filter((r) => r.sourceMetadataId && r.targetMetadataId)
                    .map((r) => ({
                      sourceMetadataId: r.sourceMetadataId!,
                      targetMetadataId: r.targetMetadataId!,
                      operator: r.operator,
                      caseSensitive: r.caseSensitive,
                    })),
                  enabled,
                  bidirectional,
                } as any;
                await onSubmit(payload);
                onClose();
              } finally {
                setSaving(false);
              }
            }}
            disabled={saving || !name.trim()}
          >
            {initial ? 'Save Changes' : 'Create Rule'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Read-only Rule Details Modal
function RuleDetailsModal({
  rule,
  onClose,
}: {
  rule: LinkRuleResponseDto;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl shadow-xl">
        <div className="p-6 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">Rule Details</h3>
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Name</div>
              <div className="font-medium">{rule.name}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Link Type</div>
              <div className="font-medium">{rule.linkType}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Status</div>
              <div className="font-medium">{rule.enabled ? 'Active' : 'Inactive'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Bidirectional</div>
              <div className="font-medium">{rule.bidirectional ? 'Yes' : 'No'}</div>
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Description</div>
            <div className="text-sm">{rule.description || '—'}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-2">Conditions ({rule.conditions?.length || 0})</div>
            <div className="space-y-2">
              {(rule.conditions || []).map((c, idx) => (
                <div key={c.id || idx} className="p-3 border rounded text-sm">
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2 items-center">
                      <div className="px-2 py-1 rounded bg-blue-50">
                        <div className="text-xs text-muted-foreground">Source</div>
                        <div className="font-medium">
                          {c.sourceMetadata?.categoryName || 'N/A'} / {c.sourceMetadata?.metadataName || c.sourceMetadata?.metadataId || 'N/A'}
                        </div>
                        {c.sourceMetadata?.metadataType && (
                          <div className="text-xs text-muted-foreground">Type: {c.sourceMetadata.metadataType}</div>
                        )}
                      </div>
                      <span className="text-gray-500 font-medium">{c.operator}</span>
                      <div className="px-2 py-1 rounded bg-green-50">
                        <div className="text-xs text-muted-foreground">Target</div>
                        <div className="font-medium">
                          {c.targetMetadata?.categoryName || 'N/A'} / {c.targetMetadata?.metadataName || c.targetMetadata?.metadataId || 'N/A'}
                        </div>
                        {c.targetMetadata?.metadataType && (
                          <div className="text-xs text-muted-foreground">Type: {c.targetMetadata.metadataType}</div>
                        )}
                      </div>
                    </div>
                    {c.caseSensitive && (
                      <div className="text-xs text-gray-600">Case sensitive</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {(rule.sourceCategory || rule.targetCategory) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
              {rule.sourceCategory && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Source Category</div>
                  <div className="font-medium">{rule.sourceCategory.name}</div>
                  {rule.sourceCategory.description && (
                    <div className="text-xs text-muted-foreground mt-1">{rule.sourceCategory.description}</div>
                  )}
                </div>
              )}
              {rule.targetCategory && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Target Category</div>
                  <div className="font-medium">{rule.targetCategory.name}</div>
                  {rule.targetCategory.description && (
                    <div className="text-xs text-muted-foreground mt-1">{rule.targetCategory.description}</div>
                  )}
                </div>
              )}
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            Created by {rule.createdBy?.firstName} {rule.createdBy?.lastName} on {new Date(rule.createdAt).toLocaleString()}
          </div>
        </div>
        <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}

