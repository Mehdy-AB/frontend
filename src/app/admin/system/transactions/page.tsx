'use client';

import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
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
  MailX,
  Shield,
  Key,
  Globe,
  Server,
  HardDrive,
  Cpu,
  MemoryStick,
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
  Activity,
  Wifi,
  WifiOff,
  Monitor,
  Smartphone,
  Tablet,
  Settings,
  User,
  UserCheck,
  UserX,
  LogIn,
  LogOut,
  FileUp,
  FileDown,
  FolderOpen,
  FolderPlus,
  FolderMinus,
  Trash,
  Edit3,
  Save,
  X,
  Plus as PlusIcon,
  Minus,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Home,
  Search as SearchIcon,
  Filter as FilterIcon,
  SortAsc,
  SortDesc,
  List,
  Grid,
  Table,
  Columns,
  Rows,
  Layout,
  Sidebar,
  Menu,
  MoreHorizontal,
  Settings2,
  HelpCircle,
  QuestionMarkCircle,
  AlertCircle,
  CheckCircle2,
  XCircle2,
  Info2,
  Warning,
  Error,
  Success,
  Loading,
  Spinner,
  Loader,
  Loader2,
  LoaderCircle,
  LoaderSquare,
  LoaderTriangle,
  LoaderDots,
  LoaderPulse,
  LoaderSpin,
  LoaderWave,
  LoaderBounce,
  LoaderFade,
  LoaderScale,
  LoaderRotate,
  LoaderSlide,
  LoaderZoom,
  LoaderFlip,
  LoaderShake,
  LoaderWiggle,
  LoaderJiggle,
  LoaderBounce2,
  LoaderBounce3,
  LoaderBounce4,
  LoaderBounce5,
  LoaderBounce6,
  LoaderBounce7,
  LoaderBounce8,
  LoaderBounce9,
  LoaderBounce10,
  LoaderBounce11,
  LoaderBounce12,
  LoaderBounce13,
  LoaderBounce14,
  LoaderBounce15,
  LoaderBounce16,
  LoaderBounce17,
  LoaderBounce18,
  LoaderBounce19,
  LoaderBounce20,
  LoaderBounce21,
  LoaderBounce22,
  LoaderBounce23,
  LoaderBounce24,
  LoaderBounce25,
  LoaderBounce26,
  LoaderBounce27,
  LoaderBounce28,
  LoaderBounce29,
  LoaderBounce30,
  LoaderBounce31,
  LoaderBounce32,
  LoaderBounce33,
  LoaderBounce34,
  LoaderBounce35,
  LoaderBounce36,
  LoaderBounce37,
  LoaderBounce38,
  LoaderBounce39,
  LoaderBounce40,
  LoaderBounce41,
  LoaderBounce42,
  LoaderBounce43,
  LoaderBounce44,
  LoaderBounce45,
  LoaderBounce46,
  LoaderBounce47,
  LoaderBounce48,
  LoaderBounce49,
  LoaderBounce50,
  LoaderBounce51,
  LoaderBounce52,
  LoaderBounce53,
  LoaderBounce54,
  LoaderBounce55,
  LoaderBounce56,
  LoaderBounce57,
  LoaderBounce58,
  LoaderBounce59,
  LoaderBounce60,
  LoaderBounce61,
  LoaderBounce62,
  LoaderBounce63,
  LoaderBounce64,
  LoaderBounce65,
  LoaderBounce66,
  LoaderBounce67,
  LoaderBounce68,
  LoaderBounce69,
  LoaderBounce70,
  LoaderBounce71,
  LoaderBounce72,
  LoaderBounce73,
  LoaderBounce74,
  LoaderBounce75,
  LoaderBounce76,
  LoaderBounce77,
  LoaderBounce78,
  LoaderBounce79,
  LoaderBounce80,
  LoaderBounce81,
  LoaderBounce82,
  LoaderBounce83,
  LoaderBounce84,
  LoaderBounce85,
  LoaderBounce86,
  LoaderBounce87,
  LoaderBounce88,
  LoaderBounce89,
  LoaderBounce90,
  LoaderBounce91,
  LoaderBounce92,
  LoaderBounce93,
  LoaderBounce94,
  LoaderBounce95,
  LoaderBounce96,
  LoaderBounce97,
  LoaderBounce98,
  LoaderBounce99,
  LoaderBounce100
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
const mockTransactions = [
  {
    id: '1',
    timestamp: '2024-01-20T14:30:00Z',
    type: 'user_login',
    category: 'authentication',
    user: 'john.doe@company.com',
    action: 'User Login',
    description: 'User successfully logged in',
    status: 'success',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    details: {
      loginMethod: 'password',
      sessionId: 'sess_123456789',
      duration: '2h 30m'
    }
  },
  {
    id: '2',
    timestamp: '2024-01-20T14:25:00Z',
    type: 'document_upload',
    category: 'document',
    user: 'jane.smith@company.com',
    action: 'Document Upload',
    description: 'Uploaded document "contract_2024.pdf"',
    status: 'success',
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    details: {
      fileName: 'contract_2024.pdf',
      fileSize: '2.3 MB',
      fileType: 'application/pdf',
      folderId: 'folder_123'
    }
  },
  {
    id: '3',
    timestamp: '2024-01-20T14:20:00Z',
    type: 'permission_change',
    category: 'security',
    user: 'admin@company.com',
    action: 'Permission Change',
    description: 'Changed permissions for document "report.pdf"',
    status: 'success',
    ipAddress: '192.168.1.102',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
    details: {
      documentId: 'doc_456',
      oldPermissions: 'read-only',
      newPermissions: 'read-write',
      affectedUsers: ['user1@company.com', 'user2@company.com']
    }
  },
  {
    id: '4',
    timestamp: '2024-01-20T14:15:00Z',
    type: 'system_backup',
    category: 'system',
    user: 'system',
    action: 'System Backup',
    description: 'Automated backup completed successfully',
    status: 'success',
    ipAddress: '127.0.0.1',
    userAgent: 'AebDMS/2.1.4',
    details: {
      backupSize: '15.2 GB',
      filesCount: 12543,
      duration: '45 minutes',
      location: '/backups/backup_20240120_141500.tar.gz'
    }
  },
  {
    id: '5',
    timestamp: '2024-01-20T14:10:00Z',
    type: 'failed_login',
    category: 'security',
    user: 'unknown@example.com',
    action: 'Failed Login Attempt',
    description: 'Failed login attempt with invalid credentials',
    status: 'failed',
    ipAddress: '192.168.1.103',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    details: {
      reason: 'Invalid password',
      attempts: 3,
      locked: true
    }
  }
];

const mockAuditLogs = [
  {
    id: '1',
    timestamp: '2024-01-20T14:30:00Z',
    level: 'info',
    category: 'system',
    message: 'System backup completed successfully',
    details: 'Backed up 1,234 files (2.3 GB) to local storage',
    source: 'backup_service',
    userId: 'system',
    ipAddress: '127.0.0.1'
  },
  {
    id: '2',
    timestamp: '2024-01-20T14:25:00Z',
    level: 'warning',
    category: 'performance',
    message: 'High memory usage detected',
    details: 'Memory usage reached 85% (6.8 GB / 8 GB)',
    source: 'monitoring_service',
    userId: 'system',
    ipAddress: '127.0.0.1'
  },
  {
    id: '3',
    timestamp: '2024-01-20T14:20:00Z',
    level: 'error',
    category: 'database',
    message: 'Database connection timeout',
    details: 'Failed to connect to primary database after 30 seconds',
    source: 'database_service',
    userId: 'system',
    ipAddress: '127.0.0.1'
  },
  {
    id: '4',
    timestamp: '2024-01-20T14:15:00Z',
    level: 'info',
    category: 'security',
    message: 'User login successful',
    details: 'User admin@company.com logged in from 192.168.1.100',
    source: 'auth_service',
    userId: 'admin@company.com',
    ipAddress: '192.168.1.100'
  },
  {
    id: '5',
    timestamp: '2024-01-20T14:10:00Z',
    level: 'info',
    category: 'file',
    message: 'Document uploaded',
    details: 'Document "contract_2024.pdf" uploaded by user john.doe',
    source: 'file_service',
    userId: 'john.doe@company.com',
    ipAddress: '192.168.1.101'
  }
];

const mockSystemEvents = [
  {
    id: '1',
    timestamp: '2024-01-20T14:30:00Z',
    event: 'system_startup',
    description: 'System started successfully',
    status: 'success',
    duration: '2.5s',
    details: {
      version: '2.1.4',
      uptime: '15 days, 8 hours, 32 minutes',
      services: ['database', 'file_service', 'auth_service', 'api_service']
    }
  },
  {
    id: '2',
    timestamp: '2024-01-20T14:25:00Z',
    event: 'service_restart',
    description: 'Email service restarted',
    status: 'success',
    duration: '1.2s',
    details: {
      service: 'email_service',
      reason: 'configuration_change',
      previousVersion: '1.2.3',
      newVersion: '1.2.4'
    }
  },
  {
    id: '3',
    timestamp: '2024-01-20T14:20:00Z',
    event: 'maintenance_mode',
    description: 'System entered maintenance mode',
    status: 'info',
    duration: '15m',
    details: {
      reason: 'scheduled_maintenance',
      scheduledBy: 'admin@company.com',
      affectedServices: ['api_service', 'file_service']
    }
  },
  {
    id: '4',
    timestamp: '2024-01-20T14:15:00Z',
    event: 'backup_completed',
    description: 'Daily backup completed',
    status: 'success',
    duration: '45m',
    details: {
      backupSize: '15.2 GB',
      filesCount: 12543,
      location: '/backups/backup_20240120_141500.tar.gz'
    }
  },
  {
    id: '5',
    timestamp: '2024-01-20T14:10:00Z',
    event: 'security_alert',
    description: 'Multiple failed login attempts detected',
    status: 'warning',
    duration: '0s',
    details: {
      ipAddress: '192.168.1.103',
      attempts: 5,
      timeWindow: '5 minutes',
      action: 'ip_blocked'
    }
  }
];

const mockActivityStats = {
  totalTransactions: 15420,
  todayTransactions: 156,
  thisWeekTransactions: 1234,
  thisMonthTransactions: 5678,
  successRate: 96.6,
  averageResponseTime: 1.4,
  topUsers: [
    { user: 'admin@company.com', count: 234 },
    { user: 'john.doe@company.com', count: 189 },
    { user: 'jane.smith@company.com', count: 156 },
    { user: 'system', count: 123 },
    { user: 'backup@company.com', count: 98 }
  ],
  topActions: [
    { action: 'User Login', count: 4567 },
    { action: 'Document Upload', count: 2345 },
    { action: 'Document Download', count: 1890 },
    { action: 'Permission Change', count: 1234 },
    { action: 'System Backup', count: 567 }
  ]
};

export default function TransactionsPage() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('transactions');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [transactions, setTransactions] = useState(mockTransactions);
  const [auditLogs, setAuditLogs] = useState(mockAuditLogs);
  const [systemEvents, setSystemEvents] = useState(mockSystemEvents);
  const [activityStats, setActivityStats] = useState(mockActivityStats);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
  };

  const handleCategoryFilter = (category: string) => {
    setCategoryFilter(category);
  };

  const handleDateRange = (range: string) => {
    setDateRange(range);
  };

  const handleSelectItem = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredTransactions.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredTransactions.map(transaction => transaction.id));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-500';
      case 'failed': return 'text-red-500';
      case 'warning': return 'text-yellow-500';
      case 'info': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info': return <Info className="h-4 w-4 text-blue-500" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'authentication': return <Key className="h-4 w-4 text-blue-500" />;
      case 'document': return <FileText className="h-4 w-4 text-green-500" />;
      case 'security': return <Shield className="h-4 w-4 text-red-500" />;
      case 'system': return <Server className="h-4 w-4 text-purple-500" />;
      case 'performance': return <BarChart3 className="h-4 w-4 text-orange-500" />;
      case 'database': return <Database className="h-4 w-4 text-cyan-500" />;
      case 'file': return <FileText className="h-4 w-4 text-indigo-500" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         transaction.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         transaction.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || transaction.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const filteredAuditLogs = auditLogs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.source.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || log.level === statusFilter;
    const matchesCategory = categoryFilter === 'all' || log.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const filteredSystemEvents = systemEvents.filter(event => {
    const matchesSearch = event.event.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
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
          <h1 className="text-2xl font-semibold">Transactions & Audit Logs</h1>
          <p className="text-muted-foreground">Monitor system transactions, audit logs, and activity tracking</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-semibold">{formatNumber(activityStats.totalTransactions)}</p>
              </div>
              <Database className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-semibold">{activityStats.successRate}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Response Time</p>
                <p className="text-2xl font-semibold">{activityStats.averageResponseTime}s</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today</p>
                <p className="text-2xl font-semibold">{activityStats.todayTransactions}</p>
              </div>
              <Activity className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="transactions" className="gap-2">
            <Database className="h-4 w-4" />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2">
            <FileText className="h-4 w-4" />
            Audit Logs
          </TabsTrigger>
          <TabsTrigger value="events" className="gap-2">
            <Activity className="h-4 w-4" />
            System Events
          </TabsTrigger>
        </TabsList>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search transactions..."
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
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={handleCategoryFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="authentication">Authentication</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={dateRange} onValueChange={handleDateRange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Transactions List */}
          <div className="space-y-4">
            {filteredTransactions.map((transaction) => (
              <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        className="rounded border-input mt-1"
                        checked={selectedItems.includes(transaction.id)}
                        onChange={() => handleSelectItem(transaction.id)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getCategoryIcon(transaction.category)}
                          <h3 className="text-lg font-semibold">{transaction.action}</h3>
                          <Badge variant={transaction.status === 'success' ? 'default' : 'secondary'}>
                            {transaction.status}
                          </Badge>
                          <Badge variant="outline">{transaction.category}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{transaction.description}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">User:</span>
                            <span className="ml-2 font-medium">{transaction.user}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">IP:</span>
                            <span className="ml-2 font-medium">{transaction.ipAddress}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Time:</span>
                            <span className="ml-2 font-medium">{formatDate(transaction.timestamp)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Type:</span>
                            <span className="ml-2 font-medium">{transaction.type}</span>
                          </div>
                        </div>

                        {transaction.details && (
                          <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                            <h4 className="text-sm font-medium mb-2">Details:</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                              {Object.entries(transaction.details).map(([key, value]) => (
                                <div key={key} className="flex justify-between">
                                  <span className="text-muted-foreground">{key}:</span>
                                  <span className="font-medium">{String(value)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy ID
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Export
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
                    {selectedItems.length} transactions selected
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export Selected
                    </Button>
                    <Button variant="outline" size="sm">
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Selected
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="audit" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search audit logs..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={handleStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="debug">Debug</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={handleCategoryFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="database">Database</SelectItem>
                    <SelectItem value="file">File</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Audit Logs List */}
          <div className="space-y-4">
            {filteredAuditLogs.map((log) => (
              <Card key={log.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getStatusIcon(log.level)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{log.message}</span>
                        <Badge variant="outline" className="text-xs">
                          {log.level}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {log.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{log.details}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Source: {log.source}</span>
                        <span>User: {log.userId}</span>
                        <span>IP: {log.ipAddress}</span>
                        <span>{formatDate(log.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* System Events Tab */}
        <TabsContent value="events" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search system events..."
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
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* System Events List */}
          <div className="space-y-4">
            {filteredSystemEvents.map((event) => (
              <Card key={event.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(event.status)}
                        <h3 className="text-lg font-semibold">{event.event}</h3>
                        <Badge variant={event.status === 'success' ? 'default' : 'secondary'}>
                          {event.status}
                        </Badge>
                        {event.duration && (
                          <Badge variant="outline">{event.duration}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{event.description}</p>
                      
                      {event.details && (
                        <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                          <h4 className="text-sm font-medium mb-2">Details:</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                            {Object.entries(event.details).map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="text-muted-foreground">{key}:</span>
                                <span className="font-medium">{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <span>{formatDate(event.timestamp)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

