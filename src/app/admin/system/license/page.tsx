'use client';

import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Save, 
  RefreshCw, 
  Upload, 
  Download, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Info, 
  Shield, 
  Calendar, 
  Users, 
  Server, 
  Database, 
  HardDrive, 
  Cpu, 
  MemoryStick, 
  Globe, 
  Clock, 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Eye, 
  EyeOff,
  ExternalLink,
  FileText,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Zap,
  Archive,
  Bell,
  Mail,
  Phone,
  MapPin,
  Building,
  CreditCard,
  Gift,
  Star,
  Award,
  Target,
  Lock,
  Unlock,
  RotateCcw,
  Play,
  Pause,
  Stop
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
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '../../../../contexts/LanguageContext';

// Mock data for demonstration
const mockLicenseInfo = {
  licenseKey: 'AEB-DMS-2024-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX',
  productName: 'AebDMS Professional',
  version: '2.1.4',
  edition: 'Professional',
  status: 'active',
  activationDate: '2024-01-01T00:00:00Z',
  expirationDate: '2025-01-01T00:00:00Z',
  daysRemaining: 345,
  autoRenewal: true,
  lastChecked: '2024-01-20T14:30:00Z',
  nextCheck: '2024-01-21T14:30:00Z',
  features: [
    'Unlimited Documents',
    'Advanced Search',
    'Workflow Management',
    'API Access',
    'Custom Branding',
    'Priority Support',
    'Advanced Security',
    'Audit Logging',
    'Backup & Recovery',
    'Multi-language Support'
  ],
  limitations: {
    maxUsers: 1000,
    maxStorage: '10TB',
    maxApiCalls: 1000000,
    maxConcurrentUsers: 500,
    maxFileSize: '2GB',
    maxRetentionDays: 2555
  },
  usage: {
    currentUsers: 156,
    currentStorage: '2.3TB',
    currentApiCalls: 45000,
    currentConcurrentUsers: 89,
    averageFileSize: '15MB',
    currentRetentionDays: 365
  }
};

const mockLicenseHistory = [
  {
    id: '1',
    action: 'License Activated',
    timestamp: '2024-01-01T00:00:00Z',
    user: 'System Admin',
    details: 'License activated successfully',
    status: 'success'
  },
  {
    id: '2',
    action: 'License Renewed',
    timestamp: '2023-12-15T10:30:00Z',
    user: 'Admin User',
    details: 'License renewed for 1 year',
    status: 'success'
  },
  {
    id: '3',
    action: 'Feature Added',
    timestamp: '2023-11-20T14:22:00Z',
    user: 'System',
    details: 'Advanced Security feature enabled',
    status: 'success'
  },
  {
    id: '4',
    action: 'License Check Failed',
    timestamp: '2023-10-15T09:15:00Z',
    user: 'System',
    details: 'License validation failed - network timeout',
    status: 'warning'
  },
  {
    id: '5',
    action: 'Upgrade Applied',
    timestamp: '2023-09-01T11:20:00Z',
    user: 'Admin User',
    details: 'Upgraded from Standard to Professional edition',
    status: 'success'
  }
];

const mockSupportInfo = {
  supportLevel: 'Priority',
  supportEmail: 'support@aebdms.com',
  supportPhone: '+1-800-555-0123',
  supportHours: '24/7',
  responseTime: '2 hours',
  lastContact: '2024-01-15T10:30:00Z',
  tickets: {
    open: 2,
    closed: 45,
    total: 47
  },
  resources: [
    {
      name: 'Documentation',
      url: 'https://docs.aebdms.com',
      type: 'documentation'
    },
    {
      name: 'API Reference',
      url: 'https://api.aebdms.com/docs',
      type: 'api'
    },
    {
      name: 'Video Tutorials',
      url: 'https://learn.aebdms.com',
      type: 'tutorials'
    },
    {
      name: 'Community Forum',
      url: 'https://community.aebdms.com',
      type: 'community'
    }
  ]
};

const mockBillingInfo = {
  billingCycle: 'Annual',
  nextBillingDate: '2025-01-01T00:00:00Z',
  amount: 9999.99,
  currency: 'USD',
  paymentMethod: 'Credit Card ending in 1234',
  autoRenewal: true,
  invoices: [
    {
      id: 'INV-2024-001',
      date: '2024-01-01T00:00:00Z',
      amount: 9999.99,
      status: 'paid',
      downloadUrl: '/invoices/INV-2024-001.pdf'
    },
    {
      id: 'INV-2023-012',
      date: '2023-12-01T00:00:00Z',
      amount: 9999.99,
      status: 'paid',
      downloadUrl: '/invoices/INV-2023-012.pdf'
    },
    {
      id: 'INV-2023-011',
      date: '2023-11-01T00:00:00Z',
      amount: 9999.99,
      status: 'paid',
      downloadUrl: '/invoices/INV-2023-011.pdf'
    }
  ]
};

export default function LicenseManagementPage() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [licenseInfo, setLicenseInfo] = useState(mockLicenseInfo);
  const [licenseHistory, setLicenseHistory] = useState(mockLicenseHistory);
  const [supportInfo, setSupportInfo] = useState(mockSupportInfo);
  const [billingInfo, setBillingInfo] = useState(mockBillingInfo);
  const [newLicenseKey, setNewLicenseKey] = useState('');
  const [showLicenseKey, setShowLicenseKey] = useState(false);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('License settings saved:', { licenseInfo, supportInfo, billingInfo });
    } catch (error) {
      console.error('Error saving license settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleActivateLicense = async () => {
    if (!newLicenseKey.trim()) return;
    
    setLoading(true);
    try {
      // Simulate license activation
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Activating license:', newLicenseKey);
      setNewLicenseKey('');
    } catch (error) {
      console.error('Error activating license:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckLicense = async () => {
    setLoading(true);
    try {
      // Simulate license check
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Checking license status...');
    } catch (error) {
      console.error('Error checking license:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-500';
      case 'expired': return 'text-red-500';
      case 'warning': return 'text-yellow-500';
      case 'pending': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'expired': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-blue-500" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getHistoryStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
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

  const formatCurrency = (amount: number, currency: string): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getUsagePercentage = (current: string | number, max: string | number): number => {
    const currentNum = typeof current === 'string' ? parseFloat(current) : current;
    const maxNum = typeof max === 'string' ? parseFloat(max) : max;
    return Math.min((currentNum / maxNum) * 100, 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">License Management</h1>
          <p className="text-muted-foreground">Manage your AebDMS license, support, and billing</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCheckLicense} disabled={loading} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            {loading ? 'Checking...' : 'Check License'}
          </Button>
          <Button onClick={handleSaveSettings} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* License Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">License Status</p>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusIcon(licenseInfo.status)}
                  <span className={`font-medium capitalize ${getStatusColor(licenseInfo.status)}`}>
                    {licenseInfo.status}
                  </span>
                </div>
              </div>
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Days Remaining</p>
                <p className="text-2xl font-semibold">{licenseInfo.daysRemaining}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Edition</p>
                <p className="text-lg font-semibold">{licenseInfo.edition}</p>
              </div>
              <Award className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Version</p>
                <p className="text-lg font-semibold">{licenseInfo.version}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="gap-2">
            <Info className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="usage" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Usage
          </TabsTrigger>
          <TabsTrigger value="support" className="gap-2">
            <Bell className="h-4 w-4" />
            Support
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Billing
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* License Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  License Information
                </CardTitle>
                <CardDescription>Your current license details and status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>License Key</Label>
                  <div className="flex gap-2">
                    <Input
                      value={showLicenseKey ? licenseInfo.licenseKey : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowLicenseKey(!showLicenseKey)}
                    >
                      {showLicenseKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button variant="outline" size="sm">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Product Name</Label>
                  <Input value={licenseInfo.productName} readOnly />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Activation Date</Label>
                    <Input value={formatDate(licenseInfo.activationDate)} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Expiration Date</Label>
                    <Input value={formatDate(licenseInfo.expirationDate)} readOnly />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Auto Renewal</Label>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={licenseInfo.autoRenewal}
                      onCheckedChange={(checked) => setLicenseInfo(prev => ({ ...prev, autoRenewal: checked }))}
                    />
                    <span className="text-sm text-muted-foreground">
                      {licenseInfo.autoRenewal ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Last Checked</Label>
                  <Input value={formatDate(licenseInfo.lastChecked)} readOnly />
                </div>
              </CardContent>
            </Card>

            {/* License Features */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Included Features
                </CardTitle>
                <CardDescription>Features available with your current license</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-2">
                  {licenseInfo.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* License Activation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Activate New License
                </CardTitle>
                <CardDescription>Enter a new license key to upgrade or change your license</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>License Key</Label>
                  <Textarea
                    placeholder="Enter your new license key here..."
                    value={newLicenseKey}
                    onChange={(e) => setNewLicenseKey(e.target.value)}
                    rows={3}
                  />
                </div>
                <Button 
                  onClick={handleActivateLicense}
                  disabled={loading || !newLicenseKey.trim()}
                  className="w-full"
                >
                  {loading ? 'Activating...' : 'Activate License'}
                </Button>
              </CardContent>
            </Card>

            {/* License History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  License History
                </CardTitle>
                <CardDescription>Recent license-related activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {licenseHistory.slice(0, 5).map((event) => (
                    <div key={event.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="mt-0.5">
                        {getHistoryStatusIcon(event.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{event.action}</span>
                          <Badge variant="outline" className="text-xs">
                            {event.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{event.details}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(event.timestamp)} • {event.user}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Usage Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Usage Statistics
                </CardTitle>
                <CardDescription>Current usage against your license limits</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Users */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Users</Label>
                    <span className="text-sm font-medium">
                      {licenseInfo.usage.currentUsers} / {licenseInfo.limitations.maxUsers}
                    </span>
                  </div>
                  <Progress 
                    value={getUsagePercentage(licenseInfo.usage.currentUsers, licenseInfo.limitations.maxUsers)} 
                    className="h-2" 
                  />
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span>{Math.round(getUsagePercentage(licenseInfo.usage.currentUsers, licenseInfo.limitations.maxUsers))}% used</span>
                  </div>
                </div>

                {/* Storage */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Storage</Label>
                    <span className="text-sm font-medium">
                      {licenseInfo.usage.currentStorage} / {licenseInfo.limitations.maxStorage}
                    </span>
                  </div>
                  <Progress 
                    value={getUsagePercentage(licenseInfo.usage.currentStorage, licenseInfo.limitations.maxStorage)} 
                    className="h-2" 
                  />
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <HardDrive className="h-3 w-3" />
                    <span>{Math.round(getUsagePercentage(licenseInfo.usage.currentStorage, licenseInfo.limitations.maxStorage))}% used</span>
                  </div>
                </div>

                {/* API Calls */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">API Calls (Monthly)</Label>
                    <span className="text-sm font-medium">
                      {licenseInfo.usage.currentApiCalls.toLocaleString()} / {licenseInfo.limitations.maxApiCalls.toLocaleString()}
                    </span>
                  </div>
                  <Progress 
                    value={getUsagePercentage(licenseInfo.usage.currentApiCalls, licenseInfo.limitations.maxApiCalls)} 
                    className="h-2" 
                  />
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Zap className="h-3 w-3" />
                    <span>{Math.round(getUsagePercentage(licenseInfo.usage.currentApiCalls, licenseInfo.limitations.maxApiCalls))}% used</span>
                  </div>
                </div>

                {/* Concurrent Users */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Concurrent Users</Label>
                    <span className="text-sm font-medium">
                      {licenseInfo.usage.currentConcurrentUsers} / {licenseInfo.limitations.maxConcurrentUsers}
                    </span>
                  </div>
                  <Progress 
                    value={getUsagePercentage(licenseInfo.usage.currentConcurrentUsers, licenseInfo.limitations.maxConcurrentUsers)} 
                    className="h-2" 
                  />
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span>{Math.round(getUsagePercentage(licenseInfo.usage.currentConcurrentUsers, licenseInfo.limitations.maxConcurrentUsers))}% used</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* License Limits */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  License Limits
                </CardTitle>
                <CardDescription>Detailed breakdown of your license limitations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">Maximum Users</span>
                    </div>
                    <span className="text-sm font-mono">{licenseInfo.limitations.maxUsers.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">Maximum Storage</span>
                    </div>
                    <span className="text-sm font-mono">{licenseInfo.limitations.maxStorage}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-purple-500" />
                      <span className="text-sm font-medium">API Calls (Monthly)</span>
                    </div>
                    <span className="text-sm font-mono">{licenseInfo.limitations.maxApiCalls.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-orange-500" />
                      <span className="text-sm font-medium">Concurrent Users</span>
                    </div>
                    <span className="text-sm font-mono">{licenseInfo.limitations.maxConcurrentUsers}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-red-500" />
                      <span className="text-sm font-medium">Maximum File Size</span>
                    </div>
                    <span className="text-sm font-mono">{licenseInfo.limitations.maxFileSize}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-cyan-500" />
                      <span className="text-sm font-medium">Retention Days</span>
                    </div>
                    <span className="text-sm font-mono">{licenseInfo.limitations.maxRetentionDays}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Support Tab */}
        <TabsContent value="support" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Support Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Support Information
                </CardTitle>
                <CardDescription>Your support level and contact information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Support Level</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">{supportInfo.supportLevel}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {supportInfo.responseTime} response time
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Support Hours</Label>
                  <Input value={supportInfo.supportHours} readOnly />
                </div>

                <div className="space-y-2">
                  <Label>Support Email</Label>
                  <div className="flex gap-2">
                    <Input value={supportInfo.supportEmail} readOnly />
                    <Button variant="outline" size="sm">
                      <Mail className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Support Phone</Label>
                  <div className="flex gap-2">
                    <Input value={supportInfo.supportPhone} readOnly />
                    <Button variant="outline" size="sm">
                      <Phone className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Last Contact</Label>
                  <Input value={formatDate(supportInfo.lastContact)} readOnly />
                </div>
              </CardContent>
            </Card>

            {/* Support Tickets */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Support Tickets
                </CardTitle>
                <CardDescription>Your support ticket statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-500">{supportInfo.tickets.open}</div>
                    <div className="text-sm text-muted-foreground">Open</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">{supportInfo.tickets.closed}</div>
                    <div className="text-sm text-muted-foreground">Closed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-500">{supportInfo.tickets.total}</div>
                    <div className="text-sm text-muted-foreground">Total</div>
                  </div>
                </div>
                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Support Ticket
                </Button>
              </CardContent>
            </Card>

            {/* Support Resources */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Support Resources
                </CardTitle>
                <CardDescription>Helpful resources and documentation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {supportInfo.resources.map((resource, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          <ExternalLink className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{resource.name}</h4>
                          <p className="text-sm text-muted-foreground capitalize">{resource.type}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Billing Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Billing Information
                </CardTitle>
                <CardDescription>Your billing details and payment information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Billing Cycle</Label>
                  <Input value={billingInfo.billingCycle} readOnly />
                </div>

                <div className="space-y-2">
                  <Label>Next Billing Date</Label>
                  <Input value={formatDate(billingInfo.nextBillingDate)} readOnly />
                </div>

                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input value={formatCurrency(billingInfo.amount, billingInfo.currency)} readOnly />
                </div>

                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Input value={billingInfo.paymentMethod} readOnly />
                </div>

                <div className="space-y-2">
                  <Label>Auto Renewal</Label>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={billingInfo.autoRenewal}
                      onCheckedChange={(checked) => setBillingInfo(prev => ({ ...prev, autoRenewal: checked }))}
                    />
                    <span className="text-sm text-muted-foreground">
                      {billingInfo.autoRenewal ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Invoice History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Invoice History
                </CardTitle>
                <CardDescription>Your recent invoices and payment history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {billingInfo.invoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{invoice.id}</h4>
                          <p className="text-sm text-muted-foreground">{formatDate(invoice.date)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(invoice.amount, billingInfo.currency)}</div>
                        <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                          {invoice.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4">
                  <Download className="h-4 w-4 mr-2" />
                  Download All Invoices
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

