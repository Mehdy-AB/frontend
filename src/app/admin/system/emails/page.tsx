'use client';

import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Send, 
  Eye, 
  Edit, 
  Trash2, 
  MoreVertical, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Info, 
  FileText, 
  Users, 
  Calendar, 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Archive, 
  Play, 
  Pause, 
  RotateCcw,
  Plus,
  Copy,
  ExternalLink,
  MailOpen,
  MailCheck,
  MailX
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '../../../../contexts/LanguageContext';

// Mock data for demonstration
const mockEmailCampaigns = [
  {
    id: '1',
    name: 'Welcome Campaign',
    subject: 'Welcome to AebDMS',
    status: 'active',
    type: 'automated',
    recipients: 1250,
    sent: 1180,
    delivered: 1156,
    opened: 892,
    clicked: 234,
    bounced: 24,
    unsubscribed: 12,
    createdBy: 'Admin User',
    createdAt: '2024-01-15T10:30:00Z',
    lastSent: '2024-01-20T14:22:00Z',
    nextScheduled: null,
    template: 'Welcome Email'
  },
  {
    id: '2',
    name: 'Monthly Newsletter',
    subject: 'January 2024 Newsletter',
    status: 'scheduled',
    type: 'newsletter',
    recipients: 2500,
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    bounced: 0,
    unsubscribed: 0,
    createdBy: 'Marketing Team',
    createdAt: '2024-01-18T09:15:00Z',
    lastSent: null,
    nextScheduled: '2024-01-25T10:00:00Z',
    template: 'Newsletter Template'
  },
  {
    id: '3',
    name: 'Password Reset Campaign',
    subject: 'Reset Your Password',
    status: 'active',
    type: 'transactional',
    recipients: 89,
    sent: 89,
    delivered: 85,
    opened: 67,
    clicked: 45,
    bounced: 4,
    unsubscribed: 0,
    createdBy: 'System',
    createdAt: '2024-01-10T11:20:00Z',
    lastSent: '2024-01-20T16:45:00Z',
    nextScheduled: null,
    template: 'Password Reset'
  },
  {
    id: '4',
    name: 'Product Update',
    subject: 'New Features Available',
    status: 'draft',
    type: 'announcement',
    recipients: 0,
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    bounced: 0,
    unsubscribed: 0,
    createdBy: 'Product Team',
    createdAt: '2024-01-19T14:30:00Z',
    lastSent: null,
    nextScheduled: null,
    template: 'Product Update'
  },
  {
    id: '5',
    name: 'System Maintenance',
    subject: 'Scheduled Maintenance Notice',
    status: 'completed',
    type: 'system',
    recipients: 500,
    sent: 500,
    delivered: 495,
    opened: 423,
    clicked: 89,
    bounced: 5,
    unsubscribed: 2,
    createdBy: 'System Admin',
    createdAt: '2024-01-17T08:00:00Z',
    lastSent: '2024-01-17T10:00:00Z',
    nextScheduled: null,
    template: 'System Notification'
  }
];

const mockEmailTemplates = [
  {
    id: '1',
    name: 'Welcome Email',
    subject: 'Welcome to AebDMS',
    type: 'welcome',
    status: 'active',
    usage: 156,
    lastModified: '2024-01-15T10:30:00Z',
    createdBy: 'Admin User',
    preview: 'Welcome to our document management system...'
  },
  {
    id: '2',
    name: 'Password Reset',
    subject: 'Reset Your Password',
    type: 'password_reset',
    status: 'active',
    usage: 89,
    lastModified: '2024-01-10T09:15:00Z',
    createdBy: 'Admin User',
    preview: 'Click the link below to reset your password...'
  },
  {
    id: '3',
    name: 'Document Shared',
    subject: 'Document Shared with You',
    type: 'document_shared',
    status: 'active',
    usage: 234,
    lastModified: '2024-01-12T14:22:00Z',
    createdBy: 'Admin User',
    preview: 'A document has been shared with you...'
  },
  {
    id: '4',
    name: 'Newsletter Template',
    subject: 'Monthly Newsletter',
    type: 'newsletter',
    status: 'draft',
    usage: 0,
    lastModified: '2024-01-18T16:45:00Z',
    createdBy: 'Marketing Team',
    preview: 'Here are the latest updates and features...'
  },
  {
    id: '5',
    name: 'System Notification',
    subject: 'System Maintenance Notice',
    type: 'system_notification',
    status: 'active',
    usage: 45,
    lastModified: '2024-01-05T11:20:00Z',
    createdBy: 'System Admin',
    preview: 'We will be performing scheduled maintenance...'
  }
];

const mockEmailLogs = [
  {
    id: '1',
    timestamp: '2024-01-20T14:30:00Z',
    recipient: 'john.doe@company.com',
    subject: 'Welcome to AebDMS',
    campaign: 'Welcome Campaign',
    status: 'delivered',
    opened: true,
    clicked: true,
    bounceReason: null,
    deliveryTime: 1.2,
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  },
  {
    id: '2',
    timestamp: '2024-01-20T14:25:00Z',
    recipient: 'jane.smith@company.com',
    subject: 'Document Shared with You',
    campaign: 'Document Sharing',
    status: 'delivered',
    opened: true,
    clicked: false,
    bounceReason: null,
    deliveryTime: 0.8,
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  },
  {
    id: '3',
    timestamp: '2024-01-20T14:20:00Z',
    recipient: 'invalid@email.com',
    subject: 'Password Reset',
    campaign: 'Password Reset Campaign',
    status: 'bounced',
    opened: false,
    clicked: false,
    bounceReason: 'Invalid email address',
    deliveryTime: 0,
    ipAddress: '192.168.1.102',
    userAgent: null
  },
  {
    id: '4',
    timestamp: '2024-01-20T14:15:00Z',
    recipient: 'admin@company.com',
    subject: 'Weekly Activity Report',
    campaign: 'Weekly Reports',
    status: 'delivered',
    opened: false,
    clicked: false,
    bounceReason: null,
    deliveryTime: 2.1,
    ipAddress: '192.168.1.103',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
  },
  {
    id: '5',
    timestamp: '2024-01-20T14:10:00Z',
    recipient: 'user@example.com',
    subject: 'System Maintenance Notice',
    campaign: 'System Maintenance',
    status: 'failed',
    opened: false,
    clicked: false,
    bounceReason: 'SMTP connection timeout',
    deliveryTime: 0,
    ipAddress: '192.168.1.104',
    userAgent: null
  }
];

const mockEmailStats = {
  totalSent: 15420,
  delivered: 14890,
  opened: 12345,
  clicked: 3456,
  bounced: 234,
  failed: 296,
  unsubscribed: 89,
  deliveryRate: 96.6,
  openRate: 82.9,
  clickRate: 27.9,
  bounceRate: 1.5,
  unsubscribeRate: 0.6,
  todaySent: 156,
  thisWeekSent: 1234,
  thisMonthSent: 5678,
  activeCampaigns: 3,
  scheduledCampaigns: 1,
  totalTemplates: 5
};

export default function EmailManagementPage() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('campaigns');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [emailCampaigns, setEmailCampaigns] = useState(mockEmailCampaigns);
  const [emailTemplates, setEmailTemplates] = useState(mockEmailTemplates);
  const [emailLogs, setEmailLogs] = useState(mockEmailLogs);
  const [emailStats, setEmailStats] = useState(mockEmailStats);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-500';
      case 'scheduled': return 'text-blue-500';
      case 'draft': return 'text-yellow-500';
      case 'completed': return 'text-gray-500';
      case 'paused': return 'text-orange-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'scheduled': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'draft': return <Edit className="h-4 w-4 text-yellow-500" />;
      case 'completed': return <Archive className="h-4 w-4 text-gray-500" />;
      case 'paused': return <Pause className="h-4 w-4 text-orange-500" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getDeliveryStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <MailCheck className="h-4 w-4 text-green-500" />;
      case 'bounced': return <MailX className="h-4 w-4 text-yellow-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-blue-500" />;
      default: return <Mail className="h-4 w-4 text-gray-500" />;
    }
  };

  const filteredCampaigns = emailCampaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         campaign.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    const matchesType = typeFilter === 'all' || campaign.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const filteredTemplates = emailTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || template.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredLogs = emailLogs.filter(log => {
    const matchesSearch = log.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.campaign.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

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
          <CardContent className="p4">
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

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search campaigns..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={handleStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={handleTypeFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="automated">Automated</SelectItem>
                    <SelectItem value="newsletter">Newsletter</SelectItem>
                    <SelectItem value="transactional">Transactional</SelectItem>
                    <SelectItem value="announcement">Announcement</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Campaigns List */}
          <div className="space-y-4">
            {filteredCampaigns.map((campaign) => (
              <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        className="rounded border-input mt-1"
                        checked={selectedItems.includes(campaign.id)}
                        onChange={() => handleSelectItem(campaign.id)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{campaign.name}</h3>
                          <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                            {campaign.status}
                          </Badge>
                          <Badge variant="outline">{campaign.type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{campaign.subject}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Recipients:</span>
                            <span className="ml-2 font-medium">{formatNumber(campaign.recipients)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Sent:</span>
                            <span className="ml-2 font-medium">{formatNumber(campaign.sent)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Delivered:</span>
                            <span className="ml-2 font-medium">{formatNumber(campaign.delivered)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Opened:</span>
                            <span className="ml-2 font-medium">{formatNumber(campaign.opened)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <span>Created by {campaign.createdBy}</span>
                          <span>•</span>
                          <span>{formatDate(campaign.createdAt)}</span>
                          {campaign.lastSent && (
                            <>
                              <span>•</span>
                              <span>Last sent: {formatDate(campaign.lastSent)}</span>
                            </>
                          )}
                          {campaign.nextScheduled && (
                            <>
                              <span>•</span>
                              <span>Next: {formatDate(campaign.nextScheduled)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Play className="mr-2 h-4 w-4" />
                            Start Campaign
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Pause className="mr-2 h-4 w-4" />
                            Pause Campaign
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDeleteCampaign(campaign.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Bulk Actions */}
          {selectedItems.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {selectedItems.length} campaigns selected
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Play className="h-4 w-4 mr-2" />
                      Start Selected
                    </Button>
                    <Button variant="outline" size="sm">
                      <Pause className="h-4 w-4 mr-2" />
                      Pause Selected
                    </Button>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Selected
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={handleStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Template
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription>{template.subject}</CardDescription>
                    </div>
                    <Badge variant={template.status === 'active' ? 'default' : 'secondary'}>
                      {template.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Type:</span>
                      <Badge variant="outline">{template.type}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Usage:</span>
                      <span>{template.usage} emails</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Modified:</span>
                      <span>{formatDate(template.lastModified)}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Preview:</Label>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {template.preview}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteTemplate(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search logs..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={handleStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="bounced">Bounced</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Logs Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 text-sm font-medium">Status</th>
                      <th className="text-left p-4 text-sm font-medium">Recipient</th>
                      <th className="text-left p-4 text-sm font-medium">Subject</th>
                      <th className="text-left p-4 text-sm font-medium">Campaign</th>
                      <th className="text-left p-4 text-sm font-medium">Opened</th>
                      <th className="text-left p-4 text-sm font-medium">Clicked</th>
                      <th className="text-left p-4 text-sm font-medium">Delivery Time</th>
                      <th className="text-left p-4 text-sm font-medium">Timestamp</th>
                      <th className="text-left p-4 text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="border-b hover:bg-muted/30">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {getDeliveryStatusIcon(log.status)}
                            <Badge variant={
                              log.status === 'delivered' ? 'default' :
                              log.status === 'bounced' ? 'secondary' : 'destructive'
                            }>
                              {log.status}
                            </Badge>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm font-medium">{log.recipient}</div>
                          {log.bounceReason && (
                            <div className="text-xs text-red-500">{log.bounceReason}</div>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="text-sm">{log.subject}</div>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline">{log.campaign}</Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            {log.opened ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-gray-400" />
                            )}
                            <span className="text-sm">{log.opened ? 'Yes' : 'No'}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            {log.clicked ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-gray-400" />
                            )}
                            <span className="text-sm">{log.clicked ? 'Yes' : 'No'}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-sm">{log.deliveryTime}s</span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-muted-foreground">
                            {formatDate(log.timestamp)}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

