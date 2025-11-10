'use client';

import React, { useState } from 'react';
import { RefreshCw, Plus, Send, FileText, Database, CheckCircle, MailOpen, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { useEmailManagement } from './lib/hooks';
import CampaignsTab from './components/CampaignsTab';
import TemplatesTab from './components/TemplatesTab';
import LogsTab from './components/LogsTab';
import { formatNumber } from './lib/utils';

export default function EmailManagementPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('campaigns');
  const {
    loading,
    searchQuery,
    statusFilter,
    typeFilter,
    selectedItems,
    emailStats,
    filteredCampaigns,
    filteredTemplates,
    filteredLogs,
    handleSearch,
    handleStatusFilter,
    handleTypeFilter,
    handleSelectItem,
    handleDeleteCampaign,
    handleDeleteTemplate
  } = useEmailManagement();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Email Management</h1>
          <p className="text-muted-foreground">Manage email campaigns, templates, and delivery logs</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Campaign
          </Button>
        </div>
      </div>

      {/* Email Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sent</p>
                <p className="text-2xl font-semibold">{formatNumber(emailStats.totalSent)}</p>
              </div>
              <Send className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Delivery Rate</p>
                <p className="text-2xl font-semibold">{emailStats.deliveryRate}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open Rate</p>
                <p className="text-2xl font-semibold">{emailStats.openRate}%</p>
              </div>
              <MailOpen className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Click Rate</p>
                <p className="text-2xl font-semibold">{emailStats.clickRate}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="campaigns" className="gap-2">
            <Send className="h-4 w-4" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <Database className="h-4 w-4" />
            Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns">
          <CampaignsTab
            campaigns={filteredCampaigns}
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            typeFilter={typeFilter}
            selectedItems={selectedItems}
            onSearch={handleSearch}
            onStatusFilter={handleStatusFilter}
            onTypeFilter={handleTypeFilter}
            onSelectItem={handleSelectItem}
            onDeleteCampaign={handleDeleteCampaign}
          />
        </TabsContent>

        <TabsContent value="templates">
          <TemplatesTab
            templates={filteredTemplates}
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            onSearch={handleSearch}
            onStatusFilter={handleStatusFilter}
            onDeleteTemplate={handleDeleteTemplate}
          />
        </TabsContent>

        <TabsContent value="logs">
          <LogsTab
            logs={filteredLogs}
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            onSearch={handleSearch}
            onStatusFilter={handleStatusFilter}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

