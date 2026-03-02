/**
 * Custom hooks for Email Management module
 * Connected to real backend API + Campaign hooks with mock data
 */

'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import {
  emailManagementService,
  EmailTemplate as ApiEmailTemplate,
  EmailLog as ApiEmailLog,
  EmailStatus,
  EmailLogStats
} from '@/api/services/emailManagementService';
import type {
  EmailCampaign,
  EmailCampaignStatus,
  EmailCampaignType,
  TargetType,
  CampaignActivity,
  CampaignStats,
  CampaignFilters,
  DateRangeFilter,
  CampaignFormData,
} from './types';
import {
  mockEmailCampaigns,
  mockCampaignActivities,
  mockUsers,
  mockRoles,
  mockCampaignTemplates,
} from './mockData';

// ============================================================================
// Email Campaigns Hook (Mock Data)
// ============================================================================

interface UseEmailCampaignsReturn {
  // State
  campaigns: EmailCampaign[];
  loading: boolean;
  error: string | null;

  // Pagination
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;

  // Filters
  filters: CampaignFilters;
  setSearch: (search: string) => void;
  setStatusFilter: (status: EmailCampaignStatus | 'all') => void;
  setTypeFilter: (type: EmailCampaignType | 'all') => void;
  setDateRangeFilter: (range: DateRangeFilter) => void;
  setPage: (page: number) => void;

  // Stats
  stats: CampaignStats;

  // Actions
  loadCampaigns: () => Promise<void>;
  createCampaign: (data: CampaignFormData) => Promise<EmailCampaign>;
  updateCampaign: (id: string, data: Partial<CampaignFormData>) => Promise<EmailCampaign>;
  deleteCampaign: (id: string) => Promise<void>;
  duplicateCampaign: (id: string) => Promise<EmailCampaign>;
  startCampaign: (id: string) => Promise<void>;
  pauseCampaign: (id: string) => Promise<void>;
  resumeCampaign: (id: string) => Promise<void>;
  cancelCampaign: (id: string) => Promise<void>;
  getCampaign: (id: string) => EmailCampaign | undefined;
  getCampaignActivities: (id: string) => CampaignActivity[];

  // Mock data helpers
  mockUsers: typeof mockUsers;
  mockRoles: typeof mockRoles;
  mockTemplates: typeof mockCampaignTemplates;
}

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const randomDelay = () => delay(300 + Math.random() * 500);

export function useEmailCampaigns(): UseEmailCampaignsReturn {
  // Core state
  const [allCampaigns, setAllCampaigns] = useState<EmailCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Server-side pagination state
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filters
  const [filters, setFilters] = useState<CampaignFilters>({
    search: '',
    status: 'all',
    type: 'all',
    dateRange: 'all',
  });

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Debounce search input
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 500);
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [filters.search]);

  // Server returns already filtered and paginated data, so allCampaigns is the result
  // No need for client-side filtering

  // Stats from backend - accurate counts from database
  const [stats, setStats] = useState<CampaignStats>({
    total: 0,
    draft: 0,
    scheduled: 0,
    running: 0,  // Includes RUNNING and SENDING (same thing in backend)
    completed: 0,
    failed: 0,
  });

  // Load stats from backend
  const loadStats = useCallback(async () => {
    try {
      const { campaignService } = await import('./campaignService');
      const backendStats = await campaignService.getStats();
      setStats(backendStats);
    } catch (err) {
      console.error('Failed to load campaign stats:', err);
    }
  }, []);

  // Load campaigns from API with server-side filtering
  const loadCampaigns = useCallback(async (
    pageNum = page,
    searchTerm = debouncedSearch,
    statusVal = filters.status,
    typeVal = filters.type
  ) => {
    setLoading(true);
    setError(null);
    try {
      const { campaignService } = await import('./campaignService');
      const response = await campaignService.getCampaigns(
        pageNum - 1, // API is 0-indexed
        pageSize,
        searchTerm || undefined,
        statusVal !== 'all' ? statusVal : undefined,
        typeVal !== 'all' ? typeVal : undefined
      );
      setAllCampaigns(response.content.map(c => ({
        ...c,
        id: String(c.id),
      })));
      setTotalItems(response.totalElements);
      setTotalPages(response.totalPages);
    } catch (err) {
      console.error('Failed to load campaigns:', err);
      setError('Failed to load campaigns');
      toast.error('Failed to load campaigns');
      setAllCampaigns([...mockEmailCampaigns]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, filters.status, filters.type]);

  // Initial load
  useEffect(() => {
    loadCampaigns();
    loadStats();  // Fetch stats from backend
  }, [loadCampaigns, loadStats]);

  // Auto-refresh when campaigns are SCHEDULED, SENDING or RUNNING (poll every 5 seconds)
  useEffect(() => {
    const hasActiveCampaigns = allCampaigns.some(
      c => c.status === 'SCHEDULED' || c.status === 'SENDING' || c.status === 'RUNNING'
    );

    if (!hasActiveCampaigns) return;

    const interval = setInterval(async () => {
      try {
        const { campaignService } = await import('./campaignService');
        const response = await campaignService.getCampaigns(
          page - 1,
          pageSize,
          debouncedSearch || undefined,
          filters.status !== 'all' ? filters.status : undefined,
          filters.type !== 'all' ? filters.type : undefined
        );
        setAllCampaigns(response.content.map(c => ({
          ...c,
          id: String(c.id),
        })));
        setTotalItems(response.totalElements);
        setTotalPages(response.totalPages);
        // Also refresh stats to update counts
        const backendStats = await campaignService.getStats();
        setStats(backendStats);
      } catch (err) {
        console.error('Auto-refresh failed:', err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [allCampaigns, page, pageSize, debouncedSearch, filters.status, filters.type]);

  // Reset page when filters change (but not when page changes)
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters.status, filters.type]);

  // Filter setters
  const setSearch = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search }));
  }, []);

  const setStatusFilter = useCallback((status: EmailCampaignStatus | 'all') => {
    setFilters(prev => ({ ...prev, status }));
  }, []);

  const setTypeFilter = useCallback((type: EmailCampaignType | 'all') => {
    setFilters(prev => ({ ...prev, type }));
  }, []);

  const setDateRangeFilter = useCallback((dateRange: DateRangeFilter) => {
    setFilters(prev => ({ ...prev, dateRange }));
  }, []);

  // CRUD operations with real API
  const createCampaign = useCallback(async (data: CampaignFormData): Promise<EmailCampaign> => {
    try {
      const { campaignService } = await import('./campaignService');
      const created = await campaignService.createCampaign(data);
      const campaign = { ...created, id: String(created.id) };
      setAllCampaigns(prev => [campaign, ...prev]);
      toast.success('Campaign created successfully');
      return campaign;
    } catch (err) {
      console.error('Failed to create campaign:', err);
      toast.error('Failed to create campaign');
      throw err;
    }
  }, []);

  const updateCampaign = useCallback(async (id: string, data: Partial<CampaignFormData>): Promise<EmailCampaign> => {
    try {
      const { campaignService } = await import('./campaignService');
      const updated = await campaignService.updateCampaign(id, data as CampaignFormData);
      const campaign = { ...updated, id: String(updated.id) };
      setAllCampaigns(prev => prev.map(c => c.id === id ? campaign : c));
      toast.success('Campaign updated successfully');
      return campaign;
    } catch (err) {
      console.error('Failed to update campaign:', err);
      toast.error('Failed to update campaign');
      throw err;
    }
  }, []);

  const deleteCampaign = useCallback(async (id: string): Promise<void> => {
    try {
      const { campaignService } = await import('./campaignService');
      await campaignService.deleteCampaign(id);
      setAllCampaigns(prev => prev.filter(c => c.id !== id));
      toast.success('Campaign deleted successfully');
    } catch (err) {
      console.error('Failed to delete campaign:', err);
      toast.error('Failed to delete campaign');
      throw err;
    }
  }, []);

  const duplicateCampaign = useCallback(async (id: string): Promise<EmailCampaign> => {
    try {
      const { campaignService } = await import('./campaignService');
      const duplicated = await campaignService.duplicateCampaign(id);
      const campaign = { ...duplicated, id: String(duplicated.id) };
      setAllCampaigns(prev => [campaign, ...prev]);
      toast.success('Campaign duplicated successfully');
      return campaign;
    } catch (err) {
      console.error('Failed to duplicate campaign:', err);
      toast.error('Failed to duplicate campaign');
      throw err;
    }
  }, []);

  const startCampaign = useCallback(async (id: string): Promise<void> => {
    try {
      const { campaignService } = await import('./campaignService');
      const updated = await campaignService.sendCampaign(id);
      const campaign = { ...updated, id: String(updated.id) };
      setAllCampaigns(prev => prev.map(c => c.id === id ? campaign : c));
      toast.success('Campaign started');
    } catch (err) {
      console.error('Failed to start campaign:', err);
      toast.error('Failed to start campaign');
      throw err;
    }
  }, []);

  const pauseCampaign = useCallback(async (id: string): Promise<void> => {
    try {
      const { campaignService } = await import('./campaignService');
      const updated = await campaignService.pauseCampaign(id);
      const campaign = { ...updated, id: String(updated.id) };
      setAllCampaigns(prev => prev.map(c => c.id === id ? campaign : c));
      toast.success('Campaign paused');
    } catch (err) {
      console.error('Failed to pause campaign:', err);
      toast.error('Failed to pause campaign');
      throw err;
    }
  }, []);

  const resumeCampaign = useCallback(async (id: string): Promise<void> => {
    try {
      const { campaignService } = await import('./campaignService');
      const updated = await campaignService.resumeCampaign(id);
      const campaign = { ...updated, id: String(updated.id) };
      setAllCampaigns(prev => prev.map(c => c.id === id ? campaign : c));
      toast.success('Campaign resumed');
    } catch (err) {
      console.error('Failed to resume campaign:', err);
      toast.error('Failed to resume campaign');
      throw err;
    }
  }, []);

  const cancelCampaign = useCallback(async (id: string): Promise<void> => {
    try {
      const { campaignService } = await import('./campaignService');
      const updated = await campaignService.cancelCampaign(id);
      const campaign = { ...updated, id: String(updated.id) };
      setAllCampaigns(prev => prev.map(c => c.id === id ? campaign : c));
      toast.success('Campaign cancelled');
    } catch (err) {
      console.error('Failed to cancel campaign:', err);
      toast.error('Failed to cancel campaign');
      throw err;
    }
  }, []);

  const getCampaign = useCallback((id: string): EmailCampaign | undefined => {
    return allCampaigns.find(c => c.id === id);
  }, [allCampaigns]);

  const getCampaignActivities = useCallback((id: string): CampaignActivity[] => {
    const campaign = allCampaigns.find(c => c.id === id);
    return mockCampaignActivities[id] || [
      {
        id: 'default-1',
        campaignId: id,
        type: 'CREATED',
        description: 'Campaign created',
        timestamp: campaign?.createdAt || new Date().toISOString(),
        userName: campaign?.createdByName || 'Unknown',
      },
    ];
  }, [allCampaigns]);

  return {
    campaigns: allCampaigns, // Server returns pre-filtered, pre-paginated data
    loading,
    error,
    page,
    pageSize,
    totalPages,
    totalItems,
    filters,
    setSearch,
    setStatusFilter,
    setTypeFilter,
    setDateRangeFilter,
    setPage,
    stats,
    loadCampaigns,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    duplicateCampaign,
    startCampaign,
    pauseCampaign,
    resumeCampaign,
    cancelCampaign,
    getCampaign,
    getCampaignActivities,
    mockUsers,
    mockRoles,
    mockTemplates: mockCampaignTemplates,
  };
}

// ============================================================================
// Legacy Types (for backward compatibility with existing components)
// ============================================================================

export interface LegacyEmailCampaign {
  id: string;
  name: string;
  subject: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  type: 'newsletter' | 'promotional' | 'transactional' | 'automated';
  recipients: number;
  sent: number;
  opened: number;
  clicked: number;
  createdAt: string;
  scheduledAt?: string;
  sentAt?: string;
}

export interface LegacyEmailTemplate {
  id: string;
  name: string;
  subject: string;
  status: 'active' | 'inactive' | 'draft';
  category: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface LegacyEmailLog {
  id: string;
  recipient: string;
  subject: string;
  campaign: string;
  status: 'sent' | 'queued' | 'failed';
  sentAt: string;
  openedAt?: string;
  bodyHtml?: string;
}

export interface EmailStats {
  totalSent: number;
  sentRate: number;
  clickRate: number;
}

const defaultEmailStats: EmailStats = {
  totalSent: 0,
  sentRate: 0,
  clickRate: 0
};

// ============================================================================
// Original useEmailManagement Hook (preserved for backward compatibility)
// ============================================================================

export function useEmailManagement() {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Real data from API
  const [emailTemplates, setEmailTemplates] = useState<ApiEmailTemplate[]>([]);
  const [emailLogs, setEmailLogs] = useState<ApiEmailLog[]>([]);
  const [apiStats, setApiStats] = useState<EmailLogStats | null>(null);

  // Infinite scroll state for logs
  const [logsPage, setLogsPage] = useState(0);
  const [logsPageSize] = useState(20);
  const [hasMoreLogs, setHasMoreLogs] = useState(true);
  const [loadingMoreLogs, setLoadingMoreLogs] = useState(false);

  // Infinite scroll state for templates
  const [templatesPage, setTemplatesPage] = useState(0);
  const [templatesPageSize] = useState(20);
  const [hasMoreTemplates, setHasMoreTemplates] = useState(true);
  const [loadingMoreTemplates, setLoadingMoreTemplates] = useState(false);

  // Legacy data (campaigns are mocked for now)
  const [emailCampaigns, setEmailCampaigns] = useState<LegacyEmailCampaign[]>([]);
  const [emailStats, setEmailStats] = useState<EmailStats>(defaultEmailStats);

  // Debouncing effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load templates from API (initial load - replaces list)
  const loadTemplates = useCallback(async () => {
    try {
      setTemplatesPage(0);
      const response = await emailManagementService.getTemplates(0, templatesPageSize, debouncedSearchQuery || undefined);
      setEmailTemplates(response.content);
      setHasMoreTemplates(response.content.length === templatesPageSize && response.totalElements > templatesPageSize);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  }, [templatesPageSize, debouncedSearchQuery]);

  // Load more templates (infinite scroll - appends to list)
  const loadMoreTemplates = useCallback(async () => {
    if (loadingMoreTemplates || !hasMoreTemplates) return;

    setLoadingMoreTemplates(true);
    try {
      const nextPage = templatesPage + 1;
      const response = await emailManagementService.getTemplates(nextPage, templatesPageSize, debouncedSearchQuery || undefined);
      setEmailTemplates(prev => [...prev, ...response.content]);
      setTemplatesPage(nextPage);
      setHasMoreTemplates(response.content.length === templatesPageSize);
    } catch (error) {
      console.error('Failed to load more templates:', error);
    } finally {
      setLoadingMoreTemplates(false);
    }
  }, [loadingMoreTemplates, hasMoreTemplates, templatesPage, templatesPageSize, debouncedSearchQuery]);

  // Load logs from API (initial load - replaces list)
  const loadLogs = useCallback(async () => {
    try {
      // Map frontend status values to backend API values
      let apiStatus: EmailStatus | undefined = undefined;
      if (statusFilter !== 'all') {
        if (statusFilter === 'sent') apiStatus = 'SENT';
        else if (statusFilter === 'failed') apiStatus = 'FAILED';
        else if (statusFilter === 'queued') apiStatus = 'QUEUED';
      }
      setLogsPage(0);
      const response = await emailManagementService.getLogs(0, logsPageSize, apiStatus, debouncedSearchQuery || undefined);
      setEmailLogs(response.content);
      setHasMoreLogs(response.content.length === logsPageSize && response.totalElements > logsPageSize);
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  }, [statusFilter, debouncedSearchQuery, logsPageSize]);

  // Load more logs (infinite scroll - appends to list)
  const loadMoreLogs = useCallback(async () => {
    if (loadingMoreLogs || !hasMoreLogs) return;

    setLoadingMoreLogs(true);
    try {
      const nextPage = logsPage + 1;
      let apiStatus: EmailStatus | undefined = undefined;
      if (statusFilter !== 'all') {
        if (statusFilter === 'sent') apiStatus = 'SENT';
        else if (statusFilter === 'failed') apiStatus = 'FAILED';
        else if (statusFilter === 'queued') apiStatus = 'QUEUED';
      }
      const response = await emailManagementService.getLogs(nextPage, logsPageSize, apiStatus, debouncedSearchQuery || undefined);
      setEmailLogs(prev => [...prev, ...response.content]);
      setLogsPage(nextPage);
      setHasMoreLogs(response.content.length === logsPageSize);
    } catch (error) {
      console.error('Failed to load more logs:', error);
    } finally {
      setLoadingMoreLogs(false);
    }
  }, [loadingMoreLogs, hasMoreLogs, logsPage, logsPageSize, statusFilter, debouncedSearchQuery]);

  // Load stats from API
  const loadStats = useCallback(async () => {
    try {
      const stats = await emailManagementService.getStats();
      setApiStats(stats);
      // Update emailStats with real tracking data from API
      setEmailStats({
        totalSent: stats.totalSent,
        sentRate: stats.sentRate,
        clickRate: stats.clickRate
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    setLoading(true);
    Promise.all([loadTemplates(), loadLogs(), loadStats()]).finally(() => {
      setLoading(false);
    });
  }, [loadTemplates, loadLogs, loadStats]);

  // Reload logs when filter changes
  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Auto-refresh logs every 5 seconds to catch new emails and status changes
  // This ensures real-time visibility of email sending progress
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        // Map frontend status values to backend API values
        let apiStatus: EmailStatus | undefined = undefined;
        if (statusFilter !== 'all') {
          if (statusFilter === 'sent') apiStatus = 'SENT';
          else if (statusFilter === 'failed') apiStatus = 'FAILED';
          else if (statusFilter === 'queued') apiStatus = 'QUEUED';
        }
        const response = await emailManagementService.getLogs(0, logsPageSize, apiStatus, debouncedSearchQuery || undefined);
        setEmailLogs(response.content);
        // Also refresh stats
        const stats = await emailManagementService.getStats();
        setApiStats(stats);
        setEmailStats({
          totalSent: stats.totalSent,
          sentRate: stats.sentRate,
          clickRate: stats.clickRate
        });
      } catch (err) {
        console.error('Auto-refresh logs failed:', err);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [statusFilter, debouncedSearchQuery, logsPageSize]);

  // Reload templates when search changes
  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
  };

  const handleTypeFilter = (type: string) => {
    setTypeFilter(type);
  };

  const handleSelectItem = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  // Convert API templates to legacy format for existing components
  const filteredTemplates = useMemo(() => {
    return emailTemplates
      .filter(template => {
        const matchesSearch = template.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          template.subject.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' ||
          (statusFilter === 'active' && template.isActive) ||
          (statusFilter === 'inactive' && !template.isActive);
        return matchesSearch && matchesStatus;
      })
      .map(t => ({
        id: String(t.id),
        name: t.name,
        subject: t.subject,
        status: t.isActive ? 'active' : 'inactive' as 'active' | 'inactive' | 'draft',
        category: 'General',
        usageCount: 0,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt
      }));
  }, [emailTemplates, debouncedSearchQuery, statusFilter]);

  // Convert API logs to legacy format for existing components
  const filteredLogs = useMemo(() => {
    return emailLogs.map(log => ({
      id: String(log.id),
      recipient: log.recipients.to.join(', '),
      subject: log.subject,
      campaign: log.templateName || 'Direct',
      status: log.status === 'SENT' ? 'sent' :
        log.status === 'FAILED' ? 'failed' :
          log.status === 'QUEUED' ? 'queued' :
            'sent' as 'sent' | 'queued' | 'failed',
      sentAt: log.queuedAt,
      // Add missing fields expected by LogsTab
      timestamp: log.sentAt || log.queuedAt,
      clicked: (log.clickCount || 0) > 0,
      bounceReason: log.errorMessage || null,
      deliveryTime: log.sentAt && log.queuedAt
        ? Math.round((new Date(log.sentAt).getTime() - new Date(log.queuedAt).getTime()) / 1000)
        : 0,
      bodyHtml: log.bodyHtml
    }));
  }, [emailLogs]);

  // Campaigns filtering (mock data)
  const filteredCampaigns = useMemo(() => {
    return emailCampaigns.filter(campaign => {
      const matchesSearch = campaign.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        campaign.subject.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
      const matchesType = typeFilter === 'all' || campaign.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [emailCampaigns, debouncedSearchQuery, statusFilter, typeFilter]);

  const handleSelectAll = () => {
    if (selectedItems.length === filteredCampaigns.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredCampaigns.map(campaign => campaign.id));
    }
  };

  const handleDeleteCampaign = (campaignId: string) => {
    if (confirm('Are you sure you want to delete this campaign?')) {
      setEmailCampaigns(prev => prev.filter(campaign => campaign.id !== campaignId));
      setSelectedItems(prev => prev.filter(id => id !== campaignId));
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      try {
        await emailManagementService.deleteTemplate(Number(templateId));
        loadTemplates(); // Reload after delete
      } catch (error) {
        console.error('Failed to delete template:', error);
      }
    }
  };

  const handleRefresh = useCallback(() => {
    setLoading(true);
    Promise.all([loadTemplates(), loadLogs(), loadStats()]).finally(() => {
      setLoading(false);
    });
  }, [loadTemplates, loadLogs, loadStats]);

  return {
    loading,
    searchQuery,
    statusFilter,
    typeFilter,
    selectedItems,
    emailCampaigns,
    emailTemplates,
    emailLogs,
    emailStats,
    apiStats,
    filteredCampaigns,
    filteredTemplates,
    filteredLogs,
    setLoading,
    setEmailCampaigns,
    setEmailTemplates,
    setEmailLogs,
    setEmailStats,
    handleSearch,
    handleStatusFilter,
    handleTypeFilter,
    handleSelectItem,
    handleSelectAll,
    handleDeleteCampaign,
    handleDeleteTemplate,
    handleRefresh,
    loadTemplates,
    loadLogs,
    // Infinite scroll for logs
    loadMoreLogs,
    hasMoreLogs,
    loadingMoreLogs,
    // Infinite scroll for templates
    loadMoreTemplates,
    hasMoreTemplates,
    loadingMoreTemplates
  };
}
