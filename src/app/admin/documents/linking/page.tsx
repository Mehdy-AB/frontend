'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DocumentService } from '@/api/services/documentService';
import { 
  LinkRuleResponseDto, 
  LinkRuleRequestDto, 
  RuleStatistics,
  LinkRuleCacheStatistics,
  PageResponse
} from '@/types/api';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { useNotifications } from '../../../../hooks/useNotifications';

export default function LinkRulesManagementPage() {
  const { t } = useLanguage();
  const { showNotification } = useNotifications();
  
  // Main data state
  const [linkRules, setLinkRules] = useState<LinkRuleResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination and filtering
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  
  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterLinkType, setFilterLinkType] = useState<string>('all');
  const [selectedRules, setSelectedRules] = useState<number[]>([]);

  // Smart search state
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  
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

  // Smart search with local filtering first, then API call
  const performSmartSearch = useCallback((query: string) => {
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // First, filter locally for immediate response
    if (query.trim()) {
      const localResults = linkRules.filter(rule => 
        rule.name.toLowerCase().includes(query.toLowerCase()) ||
        rule.description?.toLowerCase().includes(query.toLowerCase()) ||
        rule.linkType.toLowerCase().includes(query.toLowerCase())
      );
      // Update display with local results immediately
      setLinkRules(localResults);
    }

    // Set up delayed API call
    const timeout = setTimeout(async () => {
      if (query.trim()) {
        setIsSearching(true);
        try {
          await fetchLinkRulesWithFilters(query);
        } finally {
          setIsSearching(false);
        }
      }
    }, 500); // 500ms delay

    setSearchTimeout(timeout);
  }, [linkRules, searchTimeout]);

  // Fetch link rules with pagination and filters
  const fetchLinkRulesWithFilters = async (searchQuery?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: currentPage,
        size: pageSize,
        enabled: filterStatus === 'all' ? undefined : filterStatus === 'active',
        linkType: filterLinkType === 'all' ? undefined : filterLinkType,
        name: searchQuery || localSearchQuery || undefined
      };

      const response = await DocumentService.getAllLinkRulesPaginated(params);
      
      if (response && Array.isArray(response.content)) {
        setLinkRules(response.content);
        setTotalPages(response.totalPages || 0);
        setTotalElements(response.totalElements || 0);
      } else {
        setLinkRules([]);
        setTotalPages(0);
        setTotalElements(0);
      }
    } catch (err: any) {
      console.error('Error fetching link rules:', err);
      setError(err.message || 'Failed to load link rules');
      setLinkRules([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all link rules (fallback)
  const fetchAllLinkRules = async () => {
    try {
      setLoading(true);
      setError(null);
      const rulesData = await DocumentService.getAllLinkRules();
      setLinkRules(Array.isArray(rulesData) ? rulesData : []);
    } catch (err: any) {
      console.error('Error fetching link rules:', err);
      setError(err.message || 'Failed to load link rules');
      setLinkRules([]);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchLinkRulesWithFilters();
  }, [currentPage, pageSize, filterStatus, filterLinkType]);

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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // Load rule statistics
  const loadRuleStatistics = async () => {
    try {
      const stats = await DocumentService.getAllRuleStatistics();
      setRuleStatistics(stats);
    } catch (error) {
      console.error('Error loading rule statistics:', error);
      showNotification('error', 'Error', 'Failed to load rule statistics');
    }
  };

  // Load cache statistics
  const loadCacheStatistics = async () => {
    try {
      const stats = await DocumentService.getLinkRuleCacheStatistics();
      setCacheStatistics(stats);
    } catch (error) {
      console.error('Error loading cache statistics:', error);
      showNotification('error', 'Error', 'Failed to load cache statistics');
    }
  };

  // Enhanced CRUD operations
  const handleCreateRule = async (ruleData: LinkRuleRequestDto) => {
    try {
      const newRule = await DocumentService.createLinkRule(ruleData);
      showNotification('success', 'Success', 'Link rule created successfully');
      await fetchLinkRulesWithFilters(); // Refresh the list
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating link rule:', error);
      showNotification('error', 'Error', 'Failed to create link rule');
      throw error;
    }
  };

  const handleUpdateRule = async (ruleId: number, ruleData: LinkRuleRequestDto) => {
    try {
      const updatedRule = await DocumentService.updateLinkRule(ruleId, ruleData);
      showNotification('success', 'Success', 'Link rule updated successfully');
      await fetchLinkRulesWithFilters(); // Refresh the list
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
        await DocumentService.deleteLinkRule(ruleId);
      showNotification('success', 'Success', 'Link rule deleted successfully');
      await fetchLinkRulesWithFilters(); // Refresh the list
    } catch (error) {
      console.error('Error deleting link rule:', error);
      showNotification('error', 'Error', 'Failed to delete link rule');
    }
  };

  const handleToggleRule = async (ruleId: number, enabled: boolean) => {
    try {
        if (enabled) {
          await DocumentService.enableLinkRule(ruleId);
        showNotification('success', 'Success', 'Link rule enabled successfully');
      } else {
        await DocumentService.disableLinkRule(ruleId);
        showNotification('success', 'Success', 'Link rule disabled successfully');
      }
      await fetchLinkRulesWithFilters(); // Refresh the list
    } catch (error) {
      console.error('Error toggling link rule:', error);
      showNotification('error', 'Error', 'Failed to update link rule status');
    }
  };

  // Rule execution operations
  const handleExecuteRule = async (ruleId: number) => {
    try {
      setExecutingRules(prev => new Set(prev).add(ruleId));
      await DocumentService.applyLinkRule(ruleId);
      showNotification('success', 'Success', 'Rule execution started successfully');
      await fetchLinkRulesWithFilters(); // Refresh the list
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
      await DocumentService.reapplyAllLinkRules();
      showNotification('success', 'Success', 'All rules reapplication started successfully');
      await fetchLinkRulesWithFilters(); // Refresh the list
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
      await Promise.all(selectedRules.map(ruleId => DocumentService.enableLinkRule(ruleId)));
      showNotification('success', 'Success', `${selectedRules.length} rules enabled successfully`);
      setSelectedRules([]);
      await fetchLinkRulesWithFilters(); // Refresh the list
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
      await Promise.all(selectedRules.map(ruleId => DocumentService.disableLinkRule(ruleId)));
      showNotification('success', 'Success', `${selectedRules.length} rules disabled successfully`);
      setSelectedRules([]);
      await fetchLinkRulesWithFilters(); // Refresh the list
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
      await Promise.all(selectedRules.map(ruleId => DocumentService.deleteLinkRule(ruleId)));
      showNotification('success', 'Success', `${selectedRules.length} rules deleted successfully`);
      setSelectedRules([]);
      await fetchLinkRulesWithFilters(); // Refresh the list
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
      await DocumentService.clearDocumentCache(documentId);
      showNotification('success', 'Success', 'Document cache cleared successfully');
      await loadCacheStatistics(); // Refresh cache stats
    } catch (error) {
      console.error('Error clearing document cache:', error);
      showNotification('error', 'Error', 'Failed to clear document cache');
    }
  };

  const handleClearRuleCache = async (ruleId: number) => {
    try {
      await DocumentService.clearRuleCache(ruleId);
      showNotification('success', 'Success', 'Rule cache cleared successfully');
      await loadCacheStatistics(); // Refresh cache stats
    } catch (error) {
      console.error('Error clearing rule cache:', error);
      showNotification('error', 'Error', 'Failed to clear rule cache');
    }
  };

  const handleClearAllCache = async () => {
    try {
      await DocumentService.clearAllRuleCache();
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

  // Handle search input change with smart search
  const handleSearchInputChange = (value: string) => {
    setLocalSearchQuery(value);
    performSmartSearch(value);
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

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(0); // Reset to first page
  };

  // Memoized filtered rules for local search
  const filteredRules = useMemo(() => {
    if (!localSearchQuery.trim()) return linkRules;
    
    return linkRules.filter(rule => 
      rule.name.toLowerCase().includes(localSearchQuery.toLowerCase()) ||
      rule.description?.toLowerCase().includes(localSearchQuery.toLowerCase()) ||
      rule.linkType.toLowerCase().includes(localSearchQuery.toLowerCase())
    );
  }, [linkRules, localSearchQuery]);

  if (loading && !isSearching) {
    return <LinkRulesSkeleton />;
  }

  if (error) {
    return (
      <Card className="flex flex-col items-center justify-center py-12">
        <CardContent className="text-center">
          <div className="text-destructive text-lg mb-4">{error}</div>
          <Button onClick={() => fetchLinkRulesWithFilters()}>
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
            disabled={bulkOperationLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${bulkOperationLoading ? 'animate-spin' : ''}`} />
            Reapply All
          </Button>
          <Button onClick={() => setShowCreateModal(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Rule
        </Button>
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
          <TabsTrigger value="cache">Cache Management</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search rules..."
                  value={localSearchQuery}
                  onChange={(e) => handleSearchInputChange(e.target.value)}
              className="pl-10"
            />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  </div>
                )}
          </div>
          
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
                    disabled={bulkOperationLoading}
                  >
                Enable Selected
              </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleBulkDisable}
                    disabled={bulkOperationLoading}
                  >
                Disable Selected
              </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={handleBulkDelete}
                    disabled={bulkOperationLoading}
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
        {filteredRules.map((rule) => (
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
                          <DropdownMenuItem onClick={() => setEditingRule(rule)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExecuteRule(rule.id)}>
                            <Zap className="mr-2 h-4 w-4" />
                            Execute Rule
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        variant="destructive"
                        onClick={() => handleDeleteRule(rule.id)}
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
                    <p className="text-sm">{rule.conditions.length} condition(s)</p>
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
                              onClick={() => handleExecuteRule(rule.id)}
                              className="h-6 px-2 text-xs"
                            >
                              <Zap className="h-3 w-3 mr-1" />
                              Execute
                            </Button>
                          )}
                        </div>
                      </div>
                </div>

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
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Configure
                    </Button>
                  </div>
                </div>

                {/* Created Info */}
                <div className="text-xs text-muted-foreground">
                  Created by {rule.createdBy.firstName} {rule.createdBy.lastName} on{' '}
                  {new Date(rule.createdAt).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, totalElements)} of {totalElements} rules
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i;
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className="w-8 h-8 p-0"
                      >
                        {page + 1}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages - 1}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {filteredRules.length === 0 && !loading && (
        <Card className="flex flex-col items-center justify-center py-12">
          <CardContent className="text-center">
            <Link2 className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No link rules found</h3>
            <p className="text-muted-foreground mb-4">
                  {localSearchQuery || filterStatus !== 'all' || filterLinkType !== 'all'
                ? 'No rules match your current filters.' 
                : 'Create your first link rule to get started.'
              }
            </p>
                <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Rule
            </Button>
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
            <CardTitle>Rule Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ruleStatistics.map((stat) => (
                <div key={stat.ruleId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{stat.ruleName}</div>
                    <div className="text-sm text-muted-foreground">
                      {stat.totalExecutions} executions • {stat.linksCreated} links created
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {Math.round(stat.successRate * 100)}% success rate
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {stat.averageExecutionTime}ms avg
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Cache Management</h2>
        <Button onClick={onRefresh} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {cacheStatistics ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Cached Links</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cacheStatistics.totalCachedLinks}</div>
              <p className="text-xs text-muted-foreground">Total cached</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cacheStatistics.activeRules}</div>
              <p className="text-xs text-muted-foreground">In cache</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(cacheStatistics.cacheHitRate * 100)}%</div>
              <p className="text-xs text-muted-foreground">Efficiency</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Last Revalidation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">
                {new Date(cacheStatistics.lastRevalidation).toLocaleDateString()}
              </div>
              <p className="text-xs text-muted-foreground">Last update</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-muted-foreground">Loading cache statistics...</div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Cache Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={onClearAllCache} variant="destructive" className="gap-2">
              <Trash2 className="h-4 w-4" />
              Clear All Cache
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export Cache Data
            </Button>
            <Button variant="outline" className="gap-2">
              <Upload className="h-4 w-4" />
              Import Cache Data
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            Cache management helps optimize rule execution performance. Clear cache when rules are updated or when experiencing performance issues.
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


