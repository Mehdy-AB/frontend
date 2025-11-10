/**
 * Custom hooks for Email Management module
 */

'use client';

import { useState, useMemo } from 'react';
import type {
  EmailCampaign,
  EmailTemplate,
  EmailLog,
  EmailStats
} from './types';
import {
  mockEmailCampaigns,
  mockEmailTemplates,
  mockEmailLogs,
  mockEmailStats
} from './mockData';

export function useEmailManagement() {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [emailCampaigns, setEmailCampaigns] = useState<EmailCampaign[]>(mockEmailCampaigns);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>(mockEmailTemplates);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>(mockEmailLogs);
  const [emailStats, setEmailStats] = useState<EmailStats>(mockEmailStats);

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

  const filteredCampaigns = useMemo(() => {
    return emailCampaigns.filter(campaign => {
      const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           campaign.subject.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
      const matchesType = typeFilter === 'all' || campaign.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [emailCampaigns, searchQuery, statusFilter, typeFilter]);

  const filteredTemplates = useMemo(() => {
    return emailTemplates.filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           template.subject.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || template.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [emailTemplates, searchQuery, statusFilter]);

  const filteredLogs = useMemo(() => {
    return emailLogs.filter(log => {
      const matchesSearch = log.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           log.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           log.campaign.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [emailLogs, searchQuery, statusFilter]);

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

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      setEmailTemplates(prev => prev.filter(template => template.id !== templateId));
    }
  };

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
    handleDeleteTemplate
  };
}
