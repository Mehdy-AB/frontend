'use client';

import React, { useState, useEffect } from 'react';
import { 
  Mail, 
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
  ExternalLink
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
const mockAliases = [
  {
    id: '1',
    alias: 'admin@company.com',
    targetEmail: 'john.doe@company.com',
    description: 'Main admin email alias',
    type: 'Forward',
    isActive: true,
    isVerified: true,
    createdBy: 'Admin User',
    createdAt: '2024-01-15T10:30:00Z',
    lastUsed: '2024-01-20T14:22:00Z',
    status: 'Active',
    forwardCount: 1247,
    bounceCount: 12,
    user: {
      id: 'user-1',
      name: 'John Doe',
      email: 'john.doe@company.com',
      department: 'IT'
    },
    rules: [
      { condition: 'subject contains "urgent"', action: 'forward to manager' },
      { condition: 'from external domain', action: 'add security warning' }
    ]
  },
  {
    id: '2',
    alias: 'support@company.com',
    targetEmail: 'support-team@company.com',
    description: 'Customer support email alias',
    type: 'Distribution List',
    isActive: true,
    isVerified: true,
    createdBy: 'Support Manager',
    createdAt: '2024-01-10T09:15:00Z',
    lastUsed: '2024-01-19T16:45:00Z',
    status: 'Active',
    forwardCount: 2341,
    bounceCount: 23,
    user: {
      id: 'user-2',
      name: 'Support Team',
      email: 'support-team@company.com',
      department: 'Support'
    },
    rules: [
      { condition: 'priority high', action: 'escalate to senior support' },
      { condition: 'after hours', action: 'send auto-reply' }
    ]
  },
  {
    id: '3',
    alias: 'hr@company.com',
    targetEmail: 'hr-team@company.com',
    description: 'Human resources email alias',
    type: 'Forward',
    isActive: true,
    isVerified: true,
    createdBy: 'HR Manager',
    createdAt: '2024-01-05T11:20:00Z',
    lastUsed: '2024-01-18T12:15:00Z',
    status: 'Active',
    forwardCount: 456,
    bounceCount: 5,
    user: {
      id: 'user-3',
      name: 'HR Team',
      email: 'hr-team@company.com',
      department: 'HR'
    },
    rules: [
      { condition: 'contains personal info', action: 'encrypt message' },
      { condition: 'from job applicant', action: 'forward to recruitment' }
    ]
  },
  {
    id: '4',
    alias: 'old-admin@company.com',
    targetEmail: 'admin@company.com',
    description: 'Legacy admin email alias (deprecated)',
    type: 'Forward',
    isActive: false,
    isVerified: true,
    createdBy: 'System Admin',
    createdAt: '2023-12-01T08:00:00Z',
    lastUsed: '2024-01-10T09:30:00Z',
    status: 'Inactive',
    forwardCount: 89,
    bounceCount: 2,
    user: {
      id: 'user-4',
      name: 'System Admin',
      email: 'admin@company.com',
      department: 'IT'
    },
    rules: []
  },
  {
    id: '5',
    alias: 'info@company.com',
    targetEmail: 'marketing@company.com',
    description: 'General information email alias',
    type: 'Auto-Reply',
    isActive: true,
    isVerified: false,
    createdBy: 'Marketing Team',
    createdAt: '2024-01-12T13:45:00Z',
    lastUsed: '2024-01-17T11:20:00Z',
    status: 'Pending Verification',
    forwardCount: 0,
    bounceCount: 0,
    user: {
      id: 'user-5',
      name: 'Marketing Team',
      email: 'marketing@company.com',
      department: 'Marketing'
    },
    rules: [
      { condition: 'always', action: 'send company info auto-reply' }
    ]
  }
];

const aliasTypes = ['All', 'Forward', 'Distribution List', 'Auto-Reply', 'Catch-All'];
const statuses = ['All', 'Active', 'Inactive', 'Pending Verification', 'Error', 'Suspended'];

export default function UserAliasPage() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [aliases, setAliases] = useState(mockAliases);
  const [filteredAliases, setFilteredAliases] = useState(mockAliases);
  const [selectedType, setSelectedType] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [loading, setLoading] = useState(false);
  const [expandedAliases, setExpandedAliases] = useState<string[]>([]);

  // Filter aliases based on search, type, and status
  useEffect(() => {
    let filtered = aliases;

    if (searchQuery) {
      filtered = filtered.filter(alias => 
        alias.alias.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alias.targetEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alias.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alias.user.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedType !== 'All') {
      filtered = filtered.filter(alias => alias.type === selectedType);
    }

    if (selectedStatus !== 'All') {
      filtered = filtered.filter(alias => alias.status === selectedStatus);
    }

    setFilteredAliases(filtered);
  }, [searchQuery, selectedType, selectedStatus, aliases]);

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleAliasExpansion = (aliasId: string) => {
    setExpandedAliases(prev =>
      prev.includes(aliasId)
        ? prev.filter(id => id !== aliasId)
        : [...prev, aliasId]
    );
  };

  const toggleSelectAlias = (aliasId: string) => {
    setSelectedItems(prev =>
      prev.includes(aliasId)
        ? prev.filter(id => id !== aliasId)
        : [...prev, aliasId]
    );
  };

  const handleToggleActive = (aliasId: string) => {
    setAliases(prev => prev.map(alias => 
      alias.id === aliasId ? { 
        ...alias, 
        isActive: !alias.isActive,
        status: !alias.isActive ? 'Active' : 'Inactive'
      } : alias
    ));
  };

  const handleDeleteAlias = (aliasId: string) => {
    if (confirm('Are you sure you want to delete this email alias?')) {
      setAliases(prev => prev.filter(alias => alias.id !== aliasId));
      setSelectedItems(prev => prev.filter(id => id !== aliasId));
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedItems.length} email aliases?`)) {
      setAliases(prev => prev.filter(alias => !selectedItems.includes(alias.id)));
      setSelectedItems([]);
    }
  };

  const handleBulkToggleActive = () => {
    setAliases(prev => prev.map(alias => 
      selectedItems.includes(alias.id) ? { 
        ...alias, 
        isActive: !alias.isActive,
        status: !alias.isActive ? 'Active' : 'Inactive'
      } : alias
    ));
    setSelectedItems([]);
  };

  const handleVerifyAlias = (aliasId: string) => {
    setAliases(prev => prev.map(alias => 
      alias.id === aliasId ? { 
        ...alias, 
        isVerified: true,
        status: 'Active'
      } : alias
    ));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Inactive':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      case 'Pending Verification':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'Error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'Suspended':
        return <Pause className="h-4 w-4 text-orange-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Forward':
        return <ArrowRight className="h-4 w-4 text-blue-500" />;
      case 'Distribution List':
        return <Users className="h-4 w-4 text-green-500" />;
      case 'Auto-Reply':
        return <Mail className="h-4 w-4 text-purple-500" />;
      case 'Catch-All':
        return <Globe className="h-4 w-4 text-orange-500" />;
      default:
        return <Mail className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Inactive':
        return 'bg-gray-100 text-gray-800';
      case 'Pending Verification':
        return 'bg-yellow-100 text-yellow-800';
      case 'Error':
        return 'bg-red-100 text-red-800';
      case 'Suspended':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Email Aliases</h1>
          <p className="text-muted-foreground">Manage email aliases and forwarding rules</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Copy className="h-4 w-4" />
            Import Aliases
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Alias
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Aliases</p>
                <p className="text-2xl font-semibold">{aliases.length}</p>
              </div>
              <Mail className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Aliases</p>
                <p className="text-2xl font-semibold">{aliases.filter(a => a.isActive).length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Forwards</p>
                <p className="text-2xl font-semibold">{aliases.reduce((sum, alias) => sum + alias.forwardCount, 0)}</p>
              </div>
              <ArrowRight className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bounce Rate</p>
                <p className="text-2xl font-semibold">
                  {Math.round(
                    (aliases.reduce((sum, alias) => sum + alias.bounceCount, 0) / 
                     aliases.reduce((sum, alias) => sum + alias.forwardCount, 0)) * 100
                  )}%
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
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
              placeholder="Search aliases..."
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
              {aliasTypes.map(type => (
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
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="unverified">Unverified</SelectItem>
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
                {aliases.find(a => selectedItems.includes(a.id) && a.isActive) ? 'Deactivate' : 'Activate'}
              </Button>
              <Button variant="outline" size="sm">
                <Copy className="h-4 w-4 mr-1" />
                Duplicate
              </Button>
              <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Aliases Table */}
      <Card>
        <div className="overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 w-8">
                  <input 
                    type="checkbox" 
                    className="rounded border-input"
                    checked={selectedItems.length === filteredAliases.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems(filteredAliases.map(alias => alias.id));
                      } else {
                        setSelectedItems([]);
                      }
                    }}
                  />
                </th>
                <th className="text-left p-4 text-sm font-medium">Alias</th>
                <th className="text-left p-4 text-sm font-medium">Type</th>
                <th className="text-left p-4 text-sm font-medium">Target</th>
                <th className="text-left p-4 text-sm font-medium">Status</th>
                <th className="text-left p-4 text-sm font-medium">Forwards</th>
                <th className="text-left p-4 text-sm font-medium">Last Used</th>
                <th className="text-left p-4 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAliases.map((alias) => {
                const isExpanded = expandedAliases.includes(alias.id);
                
                return (
                  <React.Fragment key={alias.id}>
                    <tr className="border-b hover:bg-muted/30">
                      <td className="p-4">
                        <input 
                          type="checkbox" 
                          className="rounded border-input"
                          checked={selectedItems.includes(alias.id)}
                          onChange={() => toggleSelectAlias(alias.id)}
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => toggleAliasExpansion(alias.id)}
                            className="p-1 rounded hover:bg-muted transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                          <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Mail className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {alias.alias}
                              {!alias.isVerified && (
                                <Badge variant="destructive" className="text-xs">
                                  Unverified
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">{alias.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(alias.type)}
                          <span className="text-sm">{alias.type}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm font-medium">{alias.user.name}</div>
                            <div className="text-xs text-muted-foreground">{alias.targetEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(alias.status)}
                          <Badge className={getStatusColor(alias.status)}>
                            {alias.status}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{alias.forwardCount}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-muted-foreground">
                          {formatDate(alias.lastUsed)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(alias.id)}
                            title={alias.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {alias.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                          {!alias.isVerified && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleVerifyAlias(alias.id)}
                              title="Verify Alias"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" title="Edit">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Settings">
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAlias(alias.id)}
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
                            {/* Alias Details */}
                            <div>
                              <h4 className="font-medium mb-3 flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                Alias Information
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Created by:</span>
                                  <span>{alias.createdBy}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Created at:</span>
                                  <span>{formatDate(alias.createdAt)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Type:</span>
                                  <span>{alias.type}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Verified:</span>
                                  <span className={alias.isVerified ? "text-green-600" : "text-red-600"}>
                                    {alias.isVerified ? 'Yes' : 'No'}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Active:</span>
                                  <span className={alias.isActive ? "text-green-600" : "text-red-600"}>
                                    {alias.isActive ? 'Yes' : 'No'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Forwarding Rules */}
                            <div>
                              <h4 className="font-medium mb-3 flex items-center gap-2">
                                <ArrowRight className="h-4 w-4" />
                                Forwarding Rules ({alias.rules.length})
                              </h4>
                              <div className="space-y-2 text-sm max-h-40 overflow-y-auto">
                                {alias.rules.map((rule: any, index: number) => (
                                  <div key={index} className="p-2 bg-muted/50 rounded">
                                    <div className="font-medium text-xs">{rule.condition}</div>
                                    <div className="text-xs text-muted-foreground">{rule.action}</div>
                                  </div>
                                ))}
                                {alias.rules.length === 0 && (
                                  <div className="text-xs text-muted-foreground">No rules configured</div>
                                )}
                              </div>
                            </div>

                            {/* Usage Statistics */}
                            <div>
                              <h4 className="font-medium mb-3 flex items-center gap-2">
                                <BarChart3 className="h-4 w-4" />
                                Usage Statistics
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Total forwards:</span>
                                  <span>{alias.forwardCount}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Bounces:</span>
                                  <span className="text-red-600">{alias.bounceCount}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Bounce rate:</span>
                                  <span>
                                    {alias.forwardCount > 0 
                                      ? Math.round((alias.bounceCount / alias.forwardCount) * 100) 
                                      : 0}%
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Last used:</span>
                                  <span>{formatDate(alias.lastUsed)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Target user:</span>
                                  <span>{alias.user.name}</span>
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
      {filteredAliases.length === 0 && (
        <Card className="flex flex-col items-center justify-center py-12">
          <CardContent className="text-center">
            <Mail className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No email aliases found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || selectedType !== 'All' || selectedStatus !== 'All'
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by creating your first email alias'
              }
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Alias
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
