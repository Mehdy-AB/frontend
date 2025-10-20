'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Plus, 
  Search, 
  Edit,
  Trash2,
  Filter,
  MoreVertical,
  ChevronDown,
  ChevronRight,
  FileText,
  Settings,
  Eye,
  EyeOff,
  BarChart3,
  Clock,
  Users,
  Key,
  Database,
  CheckCircle,
  XCircle,
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
  Calendar,
  User,
  Hash,
  Fingerprint,
  Server,
  Globe,
  Building,
  Folder,
  Tag,
  Type,
  List,
  ToggleLeft,
  ToggleRight,
  ArrowRight,
  ArrowLeft,
  Copy,
  ExternalLink,
  Shield,
  Lock,
  Unlock,
  Mail,
  Phone,
  MapPin,
  Send,
  MessageSquare,
  Zap,
  Volume2,
  VolumeX
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
import { useLanguage } from '../../../../contexts/LanguageContext';

// Mock data for demonstration
const mockNotificationSettings = [
  {
    id: '1',
    name: 'Document Upload Notification',
    description: 'Notify users when documents are uploaded to their folders',
    type: 'Email',
    trigger: 'Document Upload',
    isActive: true,
    isEnabled: true,
    priority: 'High',
    createdBy: 'Admin User',
    createdAt: '2024-01-15T10:30:00Z',
    lastModified: '2024-01-20T14:22:00Z',
    status: 'Active',
    recipients: ['folder_owner', 'folder_collaborators'],
    template: 'A new document "{{document_name}}" has been uploaded to folder "{{folder_name}}"',
    conditions: [
      { field: 'document_type', operator: 'in', value: 'pdf,doc,docx' },
      { field: 'file_size', operator: 'greater_than', value: '1MB' }
    ],
    deliveryCount: 1247,
    successCount: 1203,
    failureCount: 44,
    lastSent: '2024-01-20T14:22:00Z'
  },
  {
    id: '2',
    name: 'Document Approval Required',
    description: 'Notify approvers when documents require approval',
    type: 'Email',
    trigger: 'Document Approval',
    isActive: true,
    isEnabled: true,
    priority: 'High',
    createdBy: 'Workflow Manager',
    createdAt: '2024-01-10T09:15:00Z',
    lastModified: '2024-01-19T16:45:00Z',
    status: 'Active',
    recipients: ['approvers', 'document_owner'],
    template: 'Document "{{document_name}}" requires your approval. Please review and approve within {{deadline}}.',
    conditions: [
      { field: 'approval_required', operator: 'equals', value: 'true' },
      { field: 'approval_level', operator: 'equals', value: '{{user_role}}' }
    ],
    deliveryCount: 456,
    successCount: 423,
    failureCount: 33,
    lastSent: '2024-01-19T16:45:00Z'
  },
  {
    id: '3',
    name: 'System Maintenance Alert',
    description: 'Notify all users about scheduled system maintenance',
    type: 'System',
    trigger: 'Scheduled Maintenance',
    isActive: true,
    isEnabled: true,
    priority: 'Critical',
    createdBy: 'System Admin',
    createdAt: '2024-01-05T11:20:00Z',
    lastModified: '2024-01-18T12:15:00Z',
    status: 'Active',
    recipients: ['all_users'],
    template: 'System maintenance scheduled for {{maintenance_date}} from {{start_time}} to {{end_time}}. System will be unavailable during this time.',
    conditions: [
      { field: 'maintenance_type', operator: 'in', value: 'scheduled,emergency' },
      { field: 'advance_notice', operator: 'greater_than', value: '24h' }
    ],
    deliveryCount: 234,
    successCount: 234,
    failureCount: 0,
    lastSent: '2024-01-18T12:15:00Z'
  },
  {
    id: '4',
    name: 'Password Expiry Warning',
    description: 'Warn users before their password expires',
    type: 'Email',
    trigger: 'Password Expiry',
    isActive: true,
    isEnabled: true,
    priority: 'Medium',
    createdBy: 'Security Admin',
    createdAt: '2024-01-12T13:45:00Z',
    lastModified: '2024-01-17T11:20:00Z',
    status: 'Active',
    recipients: ['user'],
    template: 'Your password will expire in {{days_remaining}} days. Please change your password to avoid account lockout.',
    conditions: [
      { field: 'password_expiry_days', operator: 'less_than', value: '7' },
      { field: 'user_status', operator: 'equals', value: 'active' }
    ],
    deliveryCount: 89,
    successCount: 85,
    failureCount: 4,
    lastSent: '2024-01-17T11:20:00Z'
  },
  {
    id: '5',
    name: 'Failed Login Attempts',
    description: 'Alert administrators about suspicious login attempts',
    type: 'Email',
    trigger: 'Security Event',
    isActive: false,
    isEnabled: false,
    priority: 'Critical',
    createdBy: 'Security Admin',
    createdAt: '2024-01-01T08:00:00Z',
    lastModified: '2024-01-15T09:30:00Z',
    status: 'Inactive',
    recipients: ['security_team', 'system_admin'],
    template: 'Suspicious login activity detected for user {{username}} from IP {{ip_address}}. {{failed_attempts}} failed attempts in the last {{time_window}}.',
    conditions: [
      { field: 'failed_attempts', operator: 'greater_than', value: '5' },
      { field: 'time_window', operator: 'less_than', value: '15m' }
    ],
    deliveryCount: 12,
    successCount: 10,
    failureCount: 2,
    lastSent: '2024-01-15T09:30:00Z'
  }
];

const notificationTypes = ['All', 'Email', 'SMS', 'System', 'Push', 'Webhook'];
const triggers = ['All', 'Document Upload', 'Document Approval', 'Scheduled Maintenance', 'Password Expiry', 'Security Event', 'User Action'];
const priorities = ['All', 'Low', 'Medium', 'High', 'Critical'];
const statuses = ['All', 'Active', 'Inactive', 'Draft', 'Error', 'Testing'];

export default function UserNotificationsPage() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [notifications, setNotifications] = useState(mockNotificationSettings);
  const [filteredNotifications, setFilteredNotifications] = useState(mockNotificationSettings);
  const [selectedType, setSelectedType] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [loading, setLoading] = useState(false);
  const [expandedNotifications, setExpandedNotifications] = useState<string[]>([]);

  // Filter notifications based on search, type, and status
  useEffect(() => {
    let filtered = notifications;

    if (searchQuery) {
      filtered = filtered.filter(notification => 
        notification.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notification.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notification.trigger.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notification.template.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedType !== 'All') {
      filtered = filtered.filter(notification => notification.type === selectedType);
    }

    if (selectedStatus !== 'All') {
      filtered = filtered.filter(notification => notification.status === selectedStatus);
    }

    setFilteredNotifications(filtered);
  }, [searchQuery, selectedType, selectedStatus, notifications]);

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleNotificationExpansion = (notificationId: string) => {
    setExpandedNotifications(prev =>
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const toggleSelectNotification = (notificationId: string) => {
    setSelectedItems(prev =>
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const handleToggleActive = (notificationId: string) => {
    setNotifications(prev => prev.map(notification => 
      notification.id === notificationId ? { 
        ...notification, 
        isActive: !notification.isActive,
        status: !notification.isActive ? 'Active' : 'Inactive'
      } : notification
    ));
  };

  const handleDeleteNotification = (notificationId: string) => {
    if (confirm('Are you sure you want to delete this notification setting?')) {
      setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
      setSelectedItems(prev => prev.filter(id => id !== notificationId));
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedItems.length} notification settings?`)) {
      setNotifications(prev => prev.filter(notification => !selectedItems.includes(notification.id)));
      setSelectedItems([]);
    }
  };

  const handleBulkToggleActive = () => {
    setNotifications(prev => prev.map(notification => 
      selectedItems.includes(notification.id) ? { 
        ...notification, 
        isActive: !notification.isActive,
        status: !notification.isActive ? 'Active' : 'Inactive'
      } : notification
    ));
    setSelectedItems([]);
  };

  const handleTestNotification = (notificationId: string) => {
    // Simulate test notification
    setNotifications(prev => prev.map(notification => 
      notification.id === notificationId ? {
        ...notification,
        lastSent: new Date().toISOString(),
        deliveryCount: notification.deliveryCount + 1,
        successCount: notification.successCount + 1
      } : notification
    ));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Inactive':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      case 'Draft':
        return <Edit className="h-4 w-4 text-yellow-500" />;
      case 'Error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'Testing':
        return <Zap className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Email':
        return <Mail className="h-4 w-4 text-blue-500" />;
      case 'SMS':
        return <Phone className="h-4 w-4 text-green-500" />;
      case 'System':
        return <Server className="h-4 w-4 text-purple-500" />;
      case 'Push':
        return <Bell className="h-4 w-4 text-orange-500" />;
      case 'Webhook':
        return <ExternalLink className="h-4 w-4 text-cyan-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Low':
        return 'bg-gray-100 text-gray-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'High':
        return 'bg-orange-100 text-orange-800';
      case 'Critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Notification Settings</h1>
          <p className="text-muted-foreground">Manage user notification preferences and delivery settings</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Copy className="h-4 w-4" />
            Import Settings
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Notification
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Notifications</p>
                <p className="text-2xl font-semibold">{notifications.length}</p>
              </div>
              <Bell className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-semibold">{notifications.filter(n => n.isActive).length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sent</p>
                <p className="text-2xl font-semibold">{notifications.reduce((sum, n) => sum + n.deliveryCount, 0)}</p>
              </div>
              <Send className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-semibold">
                  {Math.round(
                    (notifications.reduce((sum, n) => sum + n.successCount, 0) / 
                     notifications.reduce((sum, n) => sum + n.deliveryCount, 0)) * 100
                  )}%
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {notificationTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Status</SelectItem>
              {statuses.slice(1).map(status => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select defaultValue="all">
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              {priorities.slice(1).map(priority => (
                <SelectItem key={priority} value={priority}>
                  {priority}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {selectedItems.length} selected
          </span>
          {selectedItems.length > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={handleBulkToggleActive}>
                {notifications.find(n => selectedItems.includes(n.id) && n.isActive) ? 'Deactivate' : 'Activate'}
              </Button>
              <Button variant="outline" size="sm">
                <Zap className="h-4 w-4 mr-1" />
                Test All
              </Button>
              <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Notifications Table */}
      <Card>
        <div className="overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 w-8">
                  <input 
                    type="checkbox" 
                    className="rounded border-input"
                    checked={selectedItems.length === filteredNotifications.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems(filteredNotifications.map(notification => notification.id));
                      } else {
                        setSelectedItems([]);
                      }
                    }}
                  />
                </th>
                <th className="text-left p-4 text-sm font-medium">Notification</th>
                <th className="text-left p-4 text-sm font-medium">Type</th>
                <th className="text-left p-4 text-sm font-medium">Trigger</th>
                <th className="text-left p-4 text-sm font-medium">Priority</th>
                <th className="text-left p-4 text-sm font-medium">Status</th>
                <th className="text-left p-4 text-sm font-medium">Sent</th>
                <th className="text-left p-4 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredNotifications.map((notification) => {
                const isExpanded = expandedNotifications.includes(notification.id);
                
                return (
                  <React.Fragment key={notification.id}>
                    <tr className="border-b hover:bg-muted/30">
                      <td className="p-4">
                        <input 
                          type="checkbox" 
                          className="rounded border-input"
                          checked={selectedItems.includes(notification.id)}
                          onChange={() => toggleSelectNotification(notification.id)}
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => toggleNotificationExpansion(notification.id)}
                            className="p-1 rounded hover:bg-muted transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                          <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Bell className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{notification.name}</div>
                            <div className="text-sm text-muted-foreground">{notification.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(notification.type)}
                          <span className="text-sm">{notification.type}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">{notification.trigger}</div>
                      </td>
                      <td className="p-4">
                        <Badge className={getPriorityColor(notification.priority)}>
                          {notification.priority}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(notification.status)}
                          <Badge variant={notification.isActive ? "default" : "secondary"}>
                            {notification.status}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">{notification.deliveryCount}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(notification.id)}
                            title={notification.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {notification.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTestNotification(notification.id)}
                            title="Test Notification"
                          >
                            <Zap className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Edit">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Settings">
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteNotification(notification.id)}
                            title="Delete"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expanded Details */}
                    {isExpanded && (
                      <tr className="bg-muted/20">
                        <td colSpan={8} className="p-4">
                          <div className="grid grid-cols-3 gap-6 ml-12">
                            {/* Notification Details */}
                            <div>
                              <h4 className="font-medium mb-3 flex items-center gap-2">
                                <Bell className="h-4 w-4" />
                                Notification Details
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Created by:</span>
                                  <span>{notification.createdBy}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Created at:</span>
                                  <span>{formatDate(notification.createdAt)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Last modified:</span>
                                  <span>{formatDate(notification.lastModified)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Enabled:</span>
                                  <span className={notification.isEnabled ? "text-green-600" : "text-red-600"}>
                                    {notification.isEnabled ? 'Yes' : 'No'}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Recipients:</span>
                                  <div className="flex flex-wrap gap-1">
                                    {notification.recipients.map(recipient => (
                                      <Badge key={recipient} variant="outline" className="text-xs">
                                        {recipient}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Template & Conditions */}
                            <div>
                              <h4 className="font-medium mb-3 flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                Template & Conditions
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div>
                                  <div className="text-muted-foreground mb-1">Template:</div>
                                  <div className="text-xs bg-muted/50 p-2 rounded font-mono">
                                    {notification.template}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-muted-foreground mb-1">Conditions:</div>
                                  <div className="space-y-1">
                                    {notification.conditions.map((condition, index) => (
                                      <div key={index} className="text-xs bg-muted/50 p-1 rounded">
                                        {condition.field} {condition.operator} {condition.value}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Delivery Statistics */}
                            <div>
                              <h4 className="font-medium mb-3 flex items-center gap-2">
                                <BarChart3 className="h-4 w-4" />
                                Delivery Statistics
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Total sent:</span>
                                  <span>{notification.deliveryCount}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Successful:</span>
                                  <span className="text-green-600">{notification.successCount}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Failed:</span>
                                  <span className="text-red-600">{notification.failureCount}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Success rate:</span>
                                  <span>
                                    {notification.deliveryCount > 0 
                                      ? Math.round((notification.successCount / notification.deliveryCount) * 100) 
                                      : 0}%
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Last sent:</span>
                                  <span>{formatDate(notification.lastSent)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Empty State */}
      {filteredNotifications.length === 0 && (
        <Card className="flex flex-col items-center justify-center py-12">
          <CardContent className="text-center">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No notification settings found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || selectedType !== 'All' || selectedStatus !== 'All'
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by creating your first notification setting'
              }
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Notification
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
