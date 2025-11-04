'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Database, 
  HardDrive, 
  Cpu, 
  MemoryStick, 
  Shield, 
  Lock, 
  Key, 
  Globe, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Upload, 
  Download, 
  Trash2, 
  Edit, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  Server,
  Cloud,
  Wifi,
  WifiOff,
  Activity,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Zap,
  Archive,
  FileText,
  Users,
  Calendar,
  Bell,
  Mail,
  Monitor,
  Smartphone,
  Tablet
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
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '../../../../contexts/LanguageContext';

// Mock data for demonstration
const mockSystemInfo = {
  version: '2.1.4',
  buildDate: '2024-01-15T10:30:00Z',
  uptime: '15 days, 8 hours, 32 minutes',
  lastBackup: '2024-01-20T02:00:00Z',
  nextBackup: '2024-01-21T02:00:00Z',
  status: 'healthy',
  performance: {
    cpu: 45,
    memory: 67,
    disk: 23,
    network: 12
  }
};

const mockStorageInfo = {
  total: 1000, // GB
  used: 234, // GB
  available: 766, // GB
  breakdown: [
    { type: 'Documents', size: 120, percentage: 51.3, color: '#3b82f6' },
    { type: 'Images', size: 45, percentage: 19.2, color: '#10b981' },
    { type: 'Videos', size: 35, percentage: 15.0, color: '#f59e0b' },
    { type: 'Archives', size: 20, percentage: 8.5, color: '#ef4444' },
    { type: 'System', size: 14, percentage: 6.0, color: '#6b7280' }
  ],
  locations: [
    {
      id: '1',
      name: 'Primary Storage',
      path: '/var/dms/storage',
      type: 'Local',
      size: 500,
      used: 120,
      status: 'active'
    },
    {
      id: '2',
      name: 'Backup Storage',
      path: '/var/dms/backup',
      type: 'Local',
      size: 500,
      used: 114,
      status: 'active'
    }
  ]
};

const mockSecuritySettings = {
  authentication: {
    method: 'jwt',
    sessionTimeout: 30, // minutes
    maxLoginAttempts: 5,
    lockoutDuration: 15, // minutes
    requireMFA: false,
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSymbols: true,
      maxAge: 90 // days
    }
  },
  encryption: {
    enabled: true,
    algorithm: 'AES-256',
    keyRotation: 90, // days
    lastRotation: '2024-01-01T00:00:00Z'
  },
  access: {
    ipWhitelist: ['192.168.1.0/24', '10.0.0.0/8'],
    allowedDomains: ['company.com', 'subsidiary.com'],
    blockTor: true,
    requireVPN: false
  },
  audit: {
    enabled: true,
    retentionDays: 365,
    logLevel: 'info',
    events: ['login', 'logout', 'file_access', 'file_modify', 'admin_action']
  }
};

const mockPerformanceSettings = {
  caching: {
    enabled: true,
    type: 'redis',
    ttl: 3600, // seconds
    maxMemory: '512MB'
  },
  indexing: {
    enabled: true,
    engine: 'elasticsearch',
    batchSize: 1000,
    interval: 300 // seconds
  },
  compression: {
    enabled: true,
    algorithm: 'gzip',
    level: 6,
    threshold: 1024 // bytes
  },
  optimization: {
    lazyLoading: true,
    imageOptimization: true,
    cdnEnabled: false,
    preloadCritical: true
  }
};

const mockBackupSettings = {
  enabled: true,
  schedule: 'daily',
  time: '02:00',
  retention: 30, // days
  compression: true,
  encryption: true,
  locations: [
    { id: '1', name: 'Local Backup', path: '/backups/local', enabled: true },
    { id: '2', name: 'Cloud Backup', path: 's3://dms-backups', enabled: true },
    { id: '3', name: 'Remote Server', path: 'ftp://backup.company.com', enabled: false }
  ]
};

const mockLogs = [
  {
    id: '1',
    timestamp: '2024-01-20T14:30:00Z',
    level: 'info',
    category: 'system',
    message: 'System backup completed successfully',
    details: 'Backed up 1,234 files (2.3 GB) to local storage'
  },
  {
    id: '2',
    timestamp: '2024-01-20T14:25:00Z',
    level: 'warning',
    category: 'performance',
    message: 'High memory usage detected',
    details: 'Memory usage reached 85% (6.8 GB / 8 GB)'
  },
  {
    id: '3',
    timestamp: '2024-01-20T14:20:00Z',
    level: 'error',
    category: 'database',
    message: 'Database connection timeout',
    details: 'Failed to connect to primary database after 30 seconds'
  },
  {
    id: '4',
    timestamp: '2024-01-20T14:15:00Z',
    level: 'info',
    category: 'security',
    message: 'User login successful',
    details: 'User admin@company.com logged in from 192.168.1.100'
  },
  {
    id: '5',
    timestamp: '2024-01-20T14:10:00Z',
    level: 'info',
    category: 'file',
    message: 'Document uploaded',
    details: 'Document "contract_2024.pdf" uploaded by user john.doe'
  }
];

export default function DMSSettingsPage() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [systemInfo, setSystemInfo] = useState(mockSystemInfo);
  const [storageInfo, setStorageInfo] = useState(mockStorageInfo);
  const [securitySettings, setSecuritySettings] = useState(mockSecuritySettings);
  const [performanceSettings, setPerformanceSettings] = useState(mockPerformanceSettings);
  const [backupSettings, setBackupSettings] = useState(mockBackupSettings);
  const [logs, setLogs] = useState(mockLogs);
  const [logFilter, setLogFilter] = useState('all');

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Settings saved:', { securitySettings, performanceSettings, backupSettings });
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async (type: string) => {
    setLoading(true);
    try {
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log(`Testing ${type} connection...`);
    } catch (error) {
      console.error(`Error testing ${type} connection:`, error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-500 bg-red-50';
      case 'warning': return 'text-yellow-500 bg-yellow-50';
      case 'info': return 'text-blue-500 bg-blue-50';
      case 'debug': return 'text-gray-500 bg-gray-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  const filteredLogs = logs.filter(log => 
    logFilter === 'all' || log.level === logFilter
  );

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
          <h1 className="text-2xl font-semibold">DMS Settings</h1>
          <p className="text-muted-foreground">Configure system settings, storage, and performance</p>
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

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="gap-2">
            <Activity className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="storage" className="gap-2">
            <HardDrive className="h-4 w-4" />
            Storage
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-2">
            <Zap className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="backup" className="gap-2">
            <Archive className="h-4 w-4" />
            Backup
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <FileText className="h-4 w-4" />
            Logs
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* System Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">System Status</p>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusIcon(systemInfo.status)}
                      <span className={`font-medium capitalize ${getStatusColor(systemInfo.status)}`}>
                        {systemInfo.status}
                      </span>
                    </div>
                  </div>
                  <Server className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Version</p>
                    <p className="text-2xl font-semibold">{systemInfo.version}</p>
                  </div>
                  <Database className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Uptime</p>
                    <p className="text-sm font-medium">{systemInfo.uptime}</p>
                  </div>
                  <Clock className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Last Backup</p>
                    <p className="text-sm font-medium">{formatDate(systemInfo.lastBackup)}</p>
                  </div>
                  <Archive className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance Metrics
              </CardTitle>
              <CardDescription>Current system performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">CPU Usage</Label>
                    <span className="text-sm font-medium">{systemInfo.performance.cpu}%</span>
                  </div>
                  <Progress value={systemInfo.performance.cpu} className="h-2" />
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Cpu className="h-3 w-3" />
                    <span>Intel Xeon E5-2680 v4</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Memory Usage</Label>
                    <span className="text-sm font-medium">{systemInfo.performance.memory}%</span>
                  </div>
                  <Progress value={systemInfo.performance.memory} className="h-2" />
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MemoryStick className="h-3 w-3" />
                    <span>8 GB RAM</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Disk Usage</Label>
                    <span className="text-sm font-medium">{systemInfo.performance.disk}%</span>
                  </div>
                  <Progress value={systemInfo.performance.disk} className="h-2" />
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <HardDrive className="h-3 w-3" />
                    <span>1 TB SSD</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Network I/O</Label>
                    <span className="text-sm font-medium">{systemInfo.performance.network}%</span>
                  </div>
                  <Progress value={systemInfo.performance.network} className="h-2" />
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Wifi className="h-3 w-3" />
                    <span>1 Gbps</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common system management tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <Archive className="h-6 w-6" />
                  <span>Run Backup</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <RefreshCw className="h-6 w-6" />
                  <span>Clear Cache</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <Database className="h-6 w-6" />
                  <span>Optimize DB</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <FileText className="h-6 w-6" />
                  <span>View Logs</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Storage Tab */}
        <TabsContent value="storage" className="space-y-6">
          {/* Storage Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Storage Overview
              </CardTitle>
              <CardDescription>Current storage usage and capacity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Storage Usage */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Total Storage</h3>
                      <p className="text-sm text-muted-foreground">
                        {storageInfo.used} GB used of {storageInfo.total} GB
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {Math.round((storageInfo.used / storageInfo.total) * 100)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Used</div>
                    </div>
                  </div>
                  <Progress value={(storageInfo.used / storageInfo.total) * 100} className="h-3" />
                </div>

                {/* Storage Breakdown */}
                <div className="space-y-3">
                  <h4 className="font-medium">Storage Breakdown</h4>
                  {storageInfo.breakdown.map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-sm font-medium">{item.type}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {item.size} GB ({item.percentage}%)
                        </div>
                      </div>
                      <Progress value={item.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Storage Locations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Storage Locations
              </CardTitle>
              <CardDescription>Configured storage locations and their status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {storageInfo.locations.map((location) => (
                  <div key={location.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <HardDrive className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">{location.name}</h4>
                        <p className="text-sm text-muted-foreground">{location.path}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary">{location.type}</Badge>
                          <Badge variant={location.status === 'active' ? 'default' : 'secondary'}>
                            {location.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {location.used} GB / {location.size} GB
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {Math.round((location.used / location.size) * 100)}% used
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Authentication Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Authentication
                </CardTitle>
                <CardDescription>Configure user authentication settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Authentication Method</Label>
                  <Select 
                    value={securitySettings.authentication.method}
                    onValueChange={(value) => setSecuritySettings(prev => ({
                      ...prev,
                      authentication: { ...prev.authentication, method: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="jwt">JWT Token</SelectItem>
                      <SelectItem value="session">Session-based</SelectItem>
                      <SelectItem value="oauth">OAuth 2.0</SelectItem>
                      <SelectItem value="saml">SAML</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Session Timeout (minutes)</Label>
                  <Input
                    type="number"
                    value={securitySettings.authentication.sessionTimeout}
                    onChange={(e) => setSecuritySettings(prev => ({
                      ...prev,
                      authentication: { ...prev.authentication, sessionTimeout: parseInt(e.target.value) }
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Max Login Attempts</Label>
                  <Input
                    type="number"
                    value={securitySettings.authentication.maxLoginAttempts}
                    onChange={(e) => setSecuritySettings(prev => ({
                      ...prev,
                      authentication: { ...prev.authentication, maxLoginAttempts: parseInt(e.target.value) }
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Lockout Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={securitySettings.authentication.lockoutDuration}
                    onChange={(e) => setSecuritySettings(prev => ({
                      ...prev,
                      authentication: { ...prev.authentication, lockoutDuration: parseInt(e.target.value) }
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Require Multi-Factor Authentication</Label>
                  <Switch
                    checked={securitySettings.authentication.requireMFA}
                    onCheckedChange={(checked) => setSecuritySettings(prev => ({
                      ...prev,
                      authentication: { ...prev.authentication, requireMFA: checked }
                    }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Encryption Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Encryption
                </CardTitle>
                <CardDescription>Configure data encryption settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Encryption</Label>
                  <Switch
                    checked={securitySettings.encryption.enabled}
                    onCheckedChange={(checked) => setSecuritySettings(prev => ({
                      ...prev,
                      encryption: { ...prev.encryption, enabled: checked }
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Encryption Algorithm</Label>
                  <Select 
                    value={securitySettings.encryption.algorithm}
                    onValueChange={(value) => setSecuritySettings(prev => ({
                      ...prev,
                      encryption: { ...prev.encryption, algorithm: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AES-256">AES-256</SelectItem>
                      <SelectItem value="AES-128">AES-128</SelectItem>
                      <SelectItem value="ChaCha20">ChaCha20</SelectItem>
                      <SelectItem value="Twofish">Twofish</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Key Rotation (days)</Label>
                  <Input
                    type="number"
                    value={securitySettings.encryption.keyRotation}
                    onChange={(e) => setSecuritySettings(prev => ({
                      ...prev,
                      encryption: { ...prev.encryption, keyRotation: parseInt(e.target.value) }
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Last Key Rotation</Label>
                  <Input
                    value={formatDate(securitySettings.encryption.lastRotation)}
                    disabled
                  />
                </div>
              </CardContent>
            </Card>

            {/* Access Control */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Access Control
                </CardTitle>
                <CardDescription>Configure IP and domain restrictions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>IP Whitelist</Label>
                  <div className="space-y-2">
                    {securitySettings.access.ipWhitelist.map((ip, index) => (
                      <div key={index} className="flex gap-2">
                        <Input value={ip} readOnly />
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add IP Range
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Allowed Domains</Label>
                  <div className="space-y-2">
                    {securitySettings.access.allowedDomains.map((domain, index) => (
                      <div key={index} className="flex gap-2">
                        <Input value={domain} readOnly />
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Domain
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label>Block Tor Traffic</Label>
                  <Switch
                    checked={securitySettings.access.blockTor}
                    onCheckedChange={(checked) => setSecuritySettings(prev => ({
                      ...prev,
                      access: { ...prev.access, blockTor: checked }
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Require VPN</Label>
                  <Switch
                    checked={securitySettings.access.requireVPN}
                    onCheckedChange={(checked) => setSecuritySettings(prev => ({
                      ...prev,
                      access: { ...prev.access, requireVPN: checked }
                    }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Audit Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Audit Logging
                </CardTitle>
                <CardDescription>Configure audit logging and monitoring</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Audit Logging</Label>
                  <Switch
                    checked={securitySettings.audit.enabled}
                    onCheckedChange={(checked) => setSecuritySettings(prev => ({
                      ...prev,
                      audit: { ...prev.audit, enabled: checked }
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Retention Period (days)</Label>
                  <Input
                    type="number"
                    value={securitySettings.audit.retentionDays}
                    onChange={(e) => setSecuritySettings(prev => ({
                      ...prev,
                      audit: { ...prev.audit, retentionDays: parseInt(e.target.value) }
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Log Level</Label>
                  <Select 
                    value={securitySettings.audit.logLevel}
                    onValueChange={(value) => setSecuritySettings(prev => ({
                      ...prev,
                      audit: { ...prev.audit, logLevel: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="debug">Debug</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tracked Events</Label>
                  <div className="space-y-2">
                    {securitySettings.audit.events.map((event, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`event-${index}`}
                          checked={true}
                          className="rounded border-input"
                        />
                        <Label htmlFor={`event-${index}`} className="text-sm">
                          {event.replace('_', ' ').toUpperCase()}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Caching Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Caching
                </CardTitle>
                <CardDescription>Configure caching for improved performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Caching</Label>
                  <Switch
                    checked={performanceSettings.caching.enabled}
                    onCheckedChange={(checked) => setPerformanceSettings(prev => ({
                      ...prev,
                      caching: { ...prev.caching, enabled: checked }
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Cache Type</Label>
                  <Select 
                    value={performanceSettings.caching.type}
                    onValueChange={(value) => setPerformanceSettings(prev => ({
                      ...prev,
                      caching: { ...prev.caching, type: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="redis">Redis</SelectItem>
                      <SelectItem value="memcached">Memcached</SelectItem>
                      <SelectItem value="memory">In-Memory</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>TTL (seconds)</Label>
                  <Input
                    type="number"
                    value={performanceSettings.caching.ttl}
                    onChange={(e) => setPerformanceSettings(prev => ({
                      ...prev,
                      caching: { ...prev.caching, ttl: parseInt(e.target.value) }
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Max Memory</Label>
                  <Input
                    value={performanceSettings.caching.maxMemory}
                    onChange={(e) => setPerformanceSettings(prev => ({
                      ...prev,
                      caching: { ...prev.caching, maxMemory: e.target.value }
                    }))}
                  />
                </div>

                <Button 
                  variant="outline" 
                  onClick={() => handleTestConnection('cache')}
                  disabled={loading}
                >
                  {loading ? 'Testing...' : 'Test Connection'}
                </Button>
              </CardContent>
            </Card>

            {/* Indexing Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Indexing
                </CardTitle>
                <CardDescription>Configure search indexing settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Indexing</Label>
                  <Switch
                    checked={performanceSettings.indexing.enabled}
                    onCheckedChange={(checked) => setPerformanceSettings(prev => ({
                      ...prev,
                      indexing: { ...prev.indexing, enabled: checked }
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Search Engine</Label>
                  <Select 
                    value={performanceSettings.indexing.engine}
                    onValueChange={(value) => setPerformanceSettings(prev => ({
                      ...prev,
                      indexing: { ...prev.indexing, engine: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="elasticsearch">Elasticsearch</SelectItem>
                      <SelectItem value="solr">Apache Solr</SelectItem>
                      <SelectItem value="lucene">Apache Lucene</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Batch Size</Label>
                  <Input
                    type="number"
                    value={performanceSettings.indexing.batchSize}
                    onChange={(e) => setPerformanceSettings(prev => ({
                      ...prev,
                      indexing: { ...prev.indexing, batchSize: parseInt(e.target.value) }
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Index Interval (seconds)</Label>
                  <Input
                    type="number"
                    value={performanceSettings.indexing.interval}
                    onChange={(e) => setPerformanceSettings(prev => ({
                      ...prev,
                      indexing: { ...prev.indexing, interval: parseInt(e.target.value) }
                    }))}
                  />
                </div>

                <Button 
                  variant="outline" 
                  onClick={() => handleTestConnection('indexing')}
                  disabled={loading}
                >
                  {loading ? 'Testing...' : 'Test Connection'}
                </Button>
              </CardContent>
            </Card>

            {/* Compression Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Archive className="h-5 w-5" />
                  Compression
                </CardTitle>
                <CardDescription>Configure data compression settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Compression</Label>
                  <Switch
                    checked={performanceSettings.compression.enabled}
                    onCheckedChange={(checked) => setPerformanceSettings(prev => ({
                      ...prev,
                      compression: { ...prev.compression, enabled: checked }
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Algorithm</Label>
                  <Select 
                    value={performanceSettings.compression.algorithm}
                    onValueChange={(value) => setPerformanceSettings(prev => ({
                      ...prev,
                      compression: { ...prev.compression, algorithm: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gzip">Gzip</SelectItem>
                      <SelectItem value="brotli">Brotli</SelectItem>
                      <SelectItem value="lz4">LZ4</SelectItem>
                      <SelectItem value="zstd">Zstandard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Compression Level (1-9)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="9"
                    value={performanceSettings.compression.level}
                    onChange={(e) => setPerformanceSettings(prev => ({
                      ...prev,
                      compression: { ...prev.compression, level: parseInt(e.target.value) }
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Minimum Size (bytes)</Label>
                  <Input
                    type="number"
                    value={performanceSettings.compression.threshold}
                    onChange={(e) => setPerformanceSettings(prev => ({
                      ...prev,
                      compression: { ...prev.compression, threshold: parseInt(e.target.value) }
                    }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Optimization Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Optimization
                </CardTitle>
                <CardDescription>Configure performance optimization features</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Lazy Loading</Label>
                  <Switch
                    checked={performanceSettings.optimization.lazyLoading}
                    onCheckedChange={(checked) => setPerformanceSettings(prev => ({
                      ...prev,
                      optimization: { ...prev.optimization, lazyLoading: checked }
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Image Optimization</Label>
                  <Switch
                    checked={performanceSettings.optimization.imageOptimization}
                    onCheckedChange={(checked) => setPerformanceSettings(prev => ({
                      ...prev,
                      optimization: { ...prev.optimization, imageOptimization: checked }
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>CDN Enabled</Label>
                  <Switch
                    checked={performanceSettings.optimization.cdnEnabled}
                    onCheckedChange={(checked) => setPerformanceSettings(prev => ({
                      ...prev,
                      optimization: { ...prev.optimization, cdnEnabled: checked }
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Preload Critical Resources</Label>
                  <Switch
                    checked={performanceSettings.optimization.preloadCritical}
                    onCheckedChange={(checked) => setPerformanceSettings(prev => ({
                      ...prev,
                      optimization: { ...prev.optimization, preloadCritical: checked }
                    }))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Backup Tab */}
        <TabsContent value="backup" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Backup Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Archive className="h-5 w-5" />
                  Backup Configuration
                </CardTitle>
                <CardDescription>Configure automatic backup settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Backups</Label>
                  <Switch
                    checked={backupSettings.enabled}
                    onCheckedChange={(checked) => setBackupSettings(prev => ({ ...prev, enabled: checked }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Schedule</Label>
                  <Select 
                    value={backupSettings.schedule}
                    onValueChange={(value) => setBackupSettings(prev => ({ ...prev, schedule: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Backup Time</Label>
                  <Input
                    type="time"
                    value={backupSettings.time}
                    onChange={(e) => setBackupSettings(prev => ({ ...prev, time: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Retention (days)</Label>
                  <Input
                    type="number"
                    value={backupSettings.retention}
                    onChange={(e) => setBackupSettings(prev => ({ ...prev, retention: parseInt(e.target.value) }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Compress Backups</Label>
                  <Switch
                    checked={backupSettings.compression}
                    onCheckedChange={(checked) => setBackupSettings(prev => ({ ...prev, compression: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Encrypt Backups</Label>
                  <Switch
                    checked={backupSettings.encryption}
                    onCheckedChange={(checked) => setBackupSettings(prev => ({ ...prev, encryption: checked }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Backup Locations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Backup Locations
                </CardTitle>
                <CardDescription>Configure backup storage locations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {backupSettings.locations.map((location) => (
                  <div key={location.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Server className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">{location.name}</h4>
                        <p className="text-sm text-muted-foreground">{location.path}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={location.enabled}
                        onCheckedChange={(checked) => setBackupSettings(prev => ({
                          ...prev,
                          locations: prev.locations.map(loc => 
                            loc.id === location.id ? { ...loc, enabled: checked } : loc
                          )
                        }))}
                      />
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Location
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Backup History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Backup History
              </CardTitle>
              <CardDescription>Recent backup operations and their status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { date: '2024-01-20T02:00:00Z', status: 'success', size: '2.3 GB', duration: '15 min' },
                  { date: '2024-01-19T02:00:00Z', status: 'success', size: '2.1 GB', duration: '12 min' },
                  { date: '2024-01-18T02:00:00Z', status: 'warning', size: '1.8 GB', duration: '18 min' },
                  { date: '2024-01-17T02:00:00Z', status: 'success', size: '2.0 GB', duration: '14 min' },
                  { date: '2024-01-16T02:00:00Z', status: 'error', size: '0 GB', duration: '0 min' }
                ].map((backup, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${
                        backup.status === 'success' ? 'bg-green-500' :
                        backup.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                      <div>
                        <p className="font-medium">{formatDate(backup.date)}</p>
                        <p className="text-sm text-muted-foreground">
                          {backup.size} • {backup.duration}
                        </p>
                      </div>
                    </div>
                    <Badge variant={
                      backup.status === 'success' ? 'default' :
                      backup.status === 'warning' ? 'secondary' : 'destructive'
                    }>
                      {backup.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-6">
          {/* Log Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                System Logs
              </CardTitle>
              <CardDescription>View and monitor system logs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <Input placeholder="Search logs..." />
                </div>
                <Select value={logFilter} onValueChange={setLogFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="error">Errors</SelectItem>
                    <SelectItem value="warning">Warnings</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="debug">Debug</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>

              <div className="space-y-2">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className={`px-2 py-1 rounded text-xs font-medium ${getLogLevelColor(log.level)}`}>
                      {log.level.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{log.message}</span>
                        <Badge variant="outline" className="text-xs">
                          {log.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{log.details}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(log.timestamp)}
                      </p>
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

