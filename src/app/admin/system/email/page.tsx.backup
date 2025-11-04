'use client';

import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Save, 
  RefreshCw, 
  TestTube, 
  Send, 
  Settings, 
  Server, 
  Shield, 
  Key, 
  Globe, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Eye, 
  EyeOff,
  Upload,
  Download,
  FileText,
  Users,
  Bell,
  Zap,
  Database,
  Cloud,
  Wifi,
  WifiOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '../../../../contexts/LanguageContext';

// Mock data for demonstration
const mockSMTPSettings = {
  enabled: true,
  host: 'smtp.company.com',
  port: 587,
  secure: false,
  username: 'noreply@company.com',
  password: '••••••••',
  fromName: 'AebDMS System',
  fromEmail: 'noreply@company.com',
  replyTo: 'support@company.com',
  timeout: 30,
  retries: 3,
  connectionPool: true,
  maxConnections: 5,
  rateLimit: 100
};

const mockEmailTemplates = [
  {
    id: '1',
    name: 'Welcome Email',
    subject: 'Welcome to AebDMS',
    type: 'welcome',
    status: 'active',
    lastModified: '2024-01-15T10:30:00Z',
    usage: 156,
    variables: ['user_name', 'company_name', 'login_url']
  },
  {
    id: '2',
    name: 'Password Reset',
    subject: 'Reset Your Password',
    type: 'password_reset',
    status: 'active',
    lastModified: '2024-01-10T09:15:00Z',
    usage: 89,
    variables: ['user_name', 'reset_url', 'expiry_time']
  },
  {
    id: '3',
    name: 'Document Shared',
    subject: 'Document Shared with You',
    type: 'document_shared',
    status: 'active',
    lastModified: '2024-01-12T14:22:00Z',
    usage: 234,
    variables: ['sender_name', 'document_name', 'access_url', 'expiry_date']
  },
  {
    id: '4',
    name: 'System Notification',
    subject: 'System Maintenance Notice',
    type: 'system_notification',
    status: 'draft',
    lastModified: '2024-01-18T16:45:00Z',
    usage: 0,
    variables: ['maintenance_date', 'downtime_duration', 'affected_services']
  },
  {
    id: '5',
    name: 'Weekly Report',
    subject: 'Weekly Activity Report',
    type: 'weekly_report',
    status: 'active',
    lastModified: '2024-01-05T11:20:00Z',
    usage: 45,
    variables: ['week_period', 'total_documents', 'new_users', 'system_stats']
  }
];

const mockDeliverySettings = {
  queueEnabled: true,
  maxRetries: 3,
  retryDelay: 300, // seconds
  batchSize: 50,
  processingInterval: 60, // seconds
  maxQueueSize: 10000,
  priorityLevels: ['high', 'normal', 'low'],
  rateLimiting: {
    enabled: true,
    maxPerMinute: 100,
    maxPerHour: 1000,
    maxPerDay: 10000
  },
  bounceHandling: {
    enabled: true,
    maxBounces: 5,
    bounceAction: 'disable',
    bounceCategories: ['hard', 'soft', 'complaint']
  }
};

const mockEmailLogs = [
  {
    id: '1',
    timestamp: '2024-01-20T14:30:00Z',
    recipient: 'john.doe@company.com',
    subject: 'Welcome to AebDMS',
    status: 'delivered',
    template: 'Welcome Email',
    deliveryTime: 1.2,
    error: null
  },
  {
    id: '2',
    timestamp: '2024-01-20T14:25:00Z',
    recipient: 'jane.smith@company.com',
    subject: 'Document Shared with You',
    status: 'delivered',
    template: 'Document Shared',
    deliveryTime: 0.8,
    error: null
  },
  {
    id: '3',
    timestamp: '2024-01-20T14:20:00Z',
    recipient: 'invalid@email.com',
    subject: 'Password Reset',
    status: 'bounced',
    template: 'Password Reset',
    deliveryTime: 0,
    error: 'Invalid email address'
  },
  {
    id: '4',
    timestamp: '2024-01-20T14:15:00Z',
    recipient: 'admin@company.com',
    subject: 'Weekly Activity Report',
    status: 'delivered',
    template: 'Weekly Report',
    deliveryTime: 2.1,
    error: null
  },
  {
    id: '5',
    timestamp: '2024-01-20T14:10:00Z',
    recipient: 'user@example.com',
    subject: 'System Maintenance Notice',
    status: 'failed',
    template: 'System Notification',
    deliveryTime: 0,
    error: 'SMTP connection timeout'
  }
];

const mockEmailStats = {
  totalSent: 15420,
  delivered: 14890,
  bounced: 234,
  failed: 296,
  deliveryRate: 96.6,
  averageDeliveryTime: 1.4,
  todaySent: 156,
  thisWeekSent: 1234,
  thisMonthSent: 5678
};

export default function EmailConfigurationPage() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [activeTab, setActiveTab] = useState('smtp');
  const [smtpSettings, setSmtpSettings] = useState(mockSMTPSettings);
  const [emailTemplates, setEmailTemplates] = useState(mockEmailTemplates);
  const [deliverySettings, setDeliverySettings] = useState(mockDeliverySettings);
  const [emailLogs, setEmailLogs] = useState(mockEmailLogs);
  const [emailStats, setEmailStats] = useState(mockEmailStats);
  const [showPassword, setShowPassword] = useState(false);
  const [testEmail, setTestEmail] = useState('');

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Email settings saved:', { smtpSettings, deliverySettings });
    } catch (error) {
      console.error('Error saving email settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Testing SMTP connection...');
    } catch (error) {
      console.error('Error testing SMTP connection:', error);
    } finally {
      setTesting(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail.trim()) return;
    
    setTesting(true);
    try {
      // Simulate sending test email
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Sending test email to:', testEmail);
    } catch (error) {
      console.error('Error sending test email:', error);
    } finally {
      setTesting(false);
    }
  };

  const handleCreateTemplate = () => {
    const newTemplate = {
      id: Date.now().toString(),
      name: 'New Template',
      subject: 'New Email Template',
      type: 'custom',
      status: 'draft',
      lastModified: new Date().toISOString(),
      usage: 0,
      variables: []
    };
    setEmailTemplates(prev => [...prev, newTemplate]);
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      setEmailTemplates(prev => prev.filter(template => template.id !== templateId));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'text-green-500';
      case 'bounced': return 'text-yellow-500';
      case 'failed': return 'text-red-500';
      case 'pending': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'bounced': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'failed': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-blue-500" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Email Configuration</h1>
          <p className="text-muted-foreground">Configure email settings, templates, and delivery options</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={handleSaveSettings} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
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
                <p className="text-2xl font-semibold">{emailStats.totalSent.toLocaleString()}</p>
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
                <p className="text-sm text-muted-foreground">Avg Delivery Time</p>
                <p className="text-2xl font-semibold">{emailStats.averageDeliveryTime}s</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today Sent</p>
                <p className="text-2xl font-semibold">{emailStats.todaySent}</p>
              </div>
              <Mail className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="smtp" className="gap-2">
            <Server className="h-4 w-4" />
            SMTP Settings
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="delivery" className="gap-2">
            <Zap className="h-4 w-4" />
            Delivery
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <Database className="h-4 w-4" />
            Logs
          </TabsTrigger>
        </TabsList>

        {/* SMTP Settings Tab */}
        <TabsContent value="smtp" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic SMTP Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  SMTP Configuration
                </CardTitle>
                <CardDescription>Configure SMTP server settings for sending emails</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Email Sending</Label>
                  <Switch
                    checked={smtpSettings.enabled}
                    onCheckedChange={(checked) => setSmtpSettings(prev => ({ ...prev, enabled: checked }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>SMTP Host</Label>
                  <Input
                    value={smtpSettings.host}
                    onChange={(e) => setSmtpSettings(prev => ({ ...prev, host: e.target.value }))}
                    placeholder="smtp.company.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Port</Label>
                    <Input
                      type="number"
                      value={smtpSettings.port}
                      onChange={(e) => setSmtpSettings(prev => ({ ...prev, port: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Security</Label>
                    <Select 
                      value={smtpSettings.secure ? 'ssl' : 'tls'}
                      onValueChange={(value) => setSmtpSettings(prev => ({ 
                        ...prev, 
                        secure: value === 'ssl' 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="tls">TLS</SelectItem>
                        <SelectItem value="ssl">SSL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input
                    value={smtpSettings.username}
                    onChange={(e) => setSmtpSettings(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="noreply@company.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Password</Label>
                  <div className="flex gap-2">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={smtpSettings.password}
                      onChange={(e) => setSmtpSettings(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="••••••••"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>From Name</Label>
                  <Input
                    value={smtpSettings.fromName}
                    onChange={(e) => setSmtpSettings(prev => ({ ...prev, fromName: e.target.value }))}
                    placeholder="AebDMS System"
                  />
                </div>

                <div className="space-y-2">
                  <Label>From Email</Label>
                  <Input
                    value={smtpSettings.fromEmail}
                    onChange={(e) => setSmtpSettings(prev => ({ ...prev, fromEmail: e.target.value }))}
                    placeholder="noreply@company.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Reply-To Email</Label>
                  <Input
                    value={smtpSettings.replyTo}
                    onChange={(e) => setSmtpSettings(prev => ({ ...prev, replyTo: e.target.value }))}
                    placeholder="support@company.com"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Advanced SMTP Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Advanced Settings
                </CardTitle>
                <CardDescription>Configure advanced SMTP options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Connection Timeout (seconds)</Label>
                  <Input
                    type="number"
                    value={smtpSettings.timeout}
                    onChange={(e) => setSmtpSettings(prev => ({ ...prev, timeout: parseInt(e.target.value) }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Max Retries</Label>
                  <Input
                    type="number"
                    value={smtpSettings.retries}
                    onChange={(e) => setSmtpSettings(prev => ({ ...prev, retries: parseInt(e.target.value) }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Connection Pooling</Label>
                  <Switch
                    checked={smtpSettings.connectionPool}
                    onCheckedChange={(checked) => setSmtpSettings(prev => ({ ...prev, connectionPool: checked }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Max Connections</Label>
                  <Input
                    type="number"
                    value={smtpSettings.maxConnections}
                    onChange={(e) => setSmtpSettings(prev => ({ ...prev, maxConnections: parseInt(e.target.value) }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Rate Limit (emails/hour)</Label>
                  <Input
                    type="number"
                    value={smtpSettings.rateLimit}
                    onChange={(e) => setSmtpSettings(prev => ({ ...prev, rateLimit: parseInt(e.target.value) }))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Test Connection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Test Connection
              </CardTitle>
              <CardDescription>Test your SMTP configuration and send a test email</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button 
                  variant="outline" 
                  onClick={handleTestConnection}
                  disabled={testing}
                >
                  {testing ? 'Testing...' : 'Test Connection'}
                </Button>
                <div className="flex-1">
                  <Input
                    placeholder="Enter test email address"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleSendTestEmail}
                  disabled={testing || !testEmail.trim()}
                >
                  {testing ? 'Sending...' : 'Send Test Email'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Email Templates</h3>
              <p className="text-sm text-muted-foreground">Manage email templates and their content</p>
            </div>
            <Button onClick={handleCreateTemplate} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Template
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {emailTemplates.map((template) => (
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
                    <Label className="text-sm">Variables:</Label>
                    <div className="flex flex-wrap gap-1">
                      {template.variables.map((variable, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {variable}
                        </Badge>
                      ))}
                    </div>
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

        {/* Delivery Tab */}
        <TabsContent value="delivery" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Queue Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Queue Settings
                </CardTitle>
                <CardDescription>Configure email queue and processing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Queue</Label>
                  <Switch
                    checked={deliverySettings.queueEnabled}
                    onCheckedChange={(checked) => setDeliverySettings(prev => ({ ...prev, queueEnabled: checked }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Max Retries</Label>
                  <Input
                    type="number"
                    value={deliverySettings.maxRetries}
                    onChange={(e) => setDeliverySettings(prev => ({ ...prev, maxRetries: parseInt(e.target.value) }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Retry Delay (seconds)</Label>
                  <Input
                    type="number"
                    value={deliverySettings.retryDelay}
                    onChange={(e) => setDeliverySettings(prev => ({ ...prev, retryDelay: parseInt(e.target.value) }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Batch Size</Label>
                  <Input
                    type="number"
                    value={deliverySettings.batchSize}
                    onChange={(e) => setDeliverySettings(prev => ({ ...prev, batchSize: parseInt(e.target.value) }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Processing Interval (seconds)</Label>
                  <Input
                    type="number"
                    value={deliverySettings.processingInterval}
                    onChange={(e) => setDeliverySettings(prev => ({ ...prev, processingInterval: parseInt(e.target.value) }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Max Queue Size</Label>
                  <Input
                    type="number"
                    value={deliverySettings.maxQueueSize}
                    onChange={(e) => setDeliverySettings(prev => ({ ...prev, maxQueueSize: parseInt(e.target.value) }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Rate Limiting */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Rate Limiting
                </CardTitle>
                <CardDescription>Configure email sending rate limits</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Rate Limiting</Label>
                  <Switch
                    checked={deliverySettings.rateLimiting.enabled}
                    onCheckedChange={(checked) => setDeliverySettings(prev => ({
                      ...prev,
                      rateLimiting: { ...prev.rateLimiting, enabled: checked }
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Max Per Minute</Label>
                  <Input
                    type="number"
                    value={deliverySettings.rateLimiting.maxPerMinute}
                    onChange={(e) => setDeliverySettings(prev => ({
                      ...prev,
                      rateLimiting: { ...prev.rateLimiting, maxPerMinute: parseInt(e.target.value) }
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Max Per Hour</Label>
                  <Input
                    type="number"
                    value={deliverySettings.rateLimiting.maxPerHour}
                    onChange={(e) => setDeliverySettings(prev => ({
                      ...prev,
                      rateLimiting: { ...prev.rateLimiting, maxPerHour: parseInt(e.target.value) }
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Max Per Day</Label>
                  <Input
                    type="number"
                    value={deliverySettings.rateLimiting.maxPerDay}
                    onChange={(e) => setDeliverySettings(prev => ({
                      ...prev,
                      rateLimiting: { ...prev.rateLimiting, maxPerDay: parseInt(e.target.value) }
                    }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Bounce Handling */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Bounce Handling
                </CardTitle>
                <CardDescription>Configure bounce handling and email validation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Bounce Handling</Label>
                  <Switch
                    checked={deliverySettings.bounceHandling.enabled}
                    onCheckedChange={(checked) => setDeliverySettings(prev => ({
                      ...prev,
                      bounceHandling: { ...prev.bounceHandling, enabled: checked }
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Max Bounces</Label>
                  <Input
                    type="number"
                    value={deliverySettings.bounceHandling.maxBounces}
                    onChange={(e) => setDeliverySettings(prev => ({
                      ...prev,
                      bounceHandling: { ...prev.bounceHandling, maxBounces: parseInt(e.target.value) }
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Bounce Action</Label>
                  <Select 
                    value={deliverySettings.bounceHandling.bounceAction}
                    onValueChange={(value) => setDeliverySettings(prev => ({
                      ...prev,
                      bounceHandling: { ...prev.bounceHandling, bounceAction: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="disable">Disable Email</SelectItem>
                      <SelectItem value="remove">Remove from List</SelectItem>
                      <SelectItem value="flag">Flag for Review</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Bounce Categories</Label>
                  <div className="space-y-2">
                    {deliverySettings.bounceHandling.bounceCategories.map((category, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`bounce-${index}`}
                          checked={true}
                          className="rounded border-input"
                        />
                        <Label htmlFor={`bounce-${index}`} className="text-sm">
                          {category.charAt(0).toUpperCase() + category.slice(1)} Bounces
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Email Logs
              </CardTitle>
              <CardDescription>View email delivery logs and status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {emailLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      {getStatusIcon(log.status)}
                      <div>
                        <h4 className="font-medium">{log.subject}</h4>
                        <p className="text-sm text-muted-foreground">{log.recipient}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(log.timestamp)} • {log.deliveryTime}s
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={
                        log.status === 'delivered' ? 'default' :
                        log.status === 'bounced' ? 'secondary' : 'destructive'
                      }>
                        {log.status}
                      </Badge>
                      {log.error && (
                        <p className="text-xs text-red-500 mt-1">{log.error}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

