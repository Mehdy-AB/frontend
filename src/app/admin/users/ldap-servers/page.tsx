'use client';

import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Plus, 
  Search, 
  Edit,
  Trash2,
  Wrench ,
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
  Wifi,
  WifiOff,
  TestTube,
  Activity
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
const mockLdapServers = [
  {
    id: '1',
    name: 'Corporate Active Directory',
    description: 'Main corporate Active Directory server',
    hostname: 'ad.company.com',
    port: 389,
    sslPort: 636,
    baseDN: 'DC=company,DC=com',
    bindDN: 'CN=ldap-service,OU=Service Accounts,DC=company,DC=com',
    isActive: true,
    isSecure: true,
    useSSL: true,
    useTLS: false,
    connectionTimeout: 30,
    searchTimeout: 10,
    maxConnections: 100,
    currentConnections: 45,
    lastSync: '2024-01-20T14:22:00Z',
    lastTest: '2024-01-20T14:20:00Z',
    status: 'Connected',
    createdBy: 'Admin User',
    createdAt: '2024-01-15T10:30:00Z',
    lastModified: '2024-01-20T14:22:00Z',
    syncCount: 1247,
    errorCount: 12,
    userCount: 1250,
    groupCount: 45,
    attributes: {
      username: 'sAMAccountName',
      firstName: 'givenName',
      lastName: 'sn',
      email: 'mail',
      department: 'department',
      title: 'title',
      phone: 'telephoneNumber'
    },
    filters: {
      userFilter: '(&(objectClass=user)(objectCategory=person))',
      groupFilter: '(&(objectClass=group)(objectCategory=group))',
      enabledFilter: '(!(userAccountControl:1.2.840.113556.1.4.803:=2))'
    }
  },
  {
    id: '2',
    name: 'HR Directory Server',
    description: 'HR department LDAP server for employee data',
    hostname: 'hr-ldap.company.com',
    port: 389,
    sslPort: 636,
    baseDN: 'OU=HR,DC=company,DC=com',
    bindDN: 'CN=hr-ldap,OU=Service Accounts,DC=company,DC=com',
    isActive: true,
    isSecure: true,
    useSSL: true,
    useTLS: false,
    connectionTimeout: 30,
    searchTimeout: 10,
    maxConnections: 50,
    currentConnections: 12,
    lastSync: '2024-01-19T16:45:00Z',
    lastTest: '2024-01-19T16:43:00Z',
    status: 'Connected',
    createdBy: 'HR Manager',
    createdAt: '2024-01-10T09:15:00Z',
    lastModified: '2024-01-19T16:45:00Z',
    syncCount: 456,
    errorCount: 3,
    userCount: 89,
    groupCount: 8,
    attributes: {
      username: 'uid',
      firstName: 'givenName',
      lastName: 'sn',
      email: 'mail',
      department: 'ou',
      title: 'title',
      phone: 'telephoneNumber'
    },
    filters: {
      userFilter: '(&(objectClass=inetOrgPerson)(objectClass=person))',
      groupFilter: '(&(objectClass=groupOfNames)(objectClass=group))',
      enabledFilter: '(!(accountStatus=disabled))'
    }
  },
  {
    id: '3',
    name: 'External Partner LDAP',
    description: 'External partner company LDAP server',
    hostname: 'ldap.partnercompany.com',
    port: 389,
    sslPort: 636,
    baseDN: 'DC=partner,DC=com',
    bindDN: 'CN=partner-service,OU=Service Accounts,DC=partner,DC=com',
    isActive: true,
    isSecure: false,
    useSSL: false,
    useTLS: true,
    connectionTimeout: 60,
    searchTimeout: 15,
    maxConnections: 25,
    currentConnections: 8,
    lastSync: '2024-01-18T12:15:00Z',
    lastTest: '2024-01-18T12:13:00Z',
    status: 'Connected',
    createdBy: 'Partner Manager',
    createdAt: '2024-01-05T11:20:00Z',
    lastModified: '2024-01-18T12:15:00Z',
    syncCount: 234,
    errorCount: 8,
    userCount: 156,
    groupCount: 12,
    attributes: {
      username: 'uid',
      firstName: 'givenName',
      lastName: 'sn',
      email: 'mail',
      department: 'ou',
      title: 'title',
      phone: 'telephoneNumber'
    },
    filters: {
      userFilter: '(&(objectClass=inetOrgPerson)(objectClass=person))',
      groupFilter: '(&(objectClass=groupOfNames)(objectClass=group))',
      enabledFilter: '(!(accountStatus=disabled))'
    }
  },
  {
    id: '4',
    name: 'Legacy LDAP Server',
    description: 'Legacy LDAP server (deprecated)',
    hostname: 'legacy-ldap.company.com',
    port: 389,
    sslPort: 636,
    baseDN: 'DC=legacy,DC=company,DC=com',
    bindDN: 'CN=legacy-service,OU=Service Accounts,DC=legacy,DC=company,DC=com',
    isActive: false,
    isSecure: false,
    useSSL: false,
    useTLS: false,
    connectionTimeout: 30,
    searchTimeout: 10,
    maxConnections: 10,
    currentConnections: 0,
    lastSync: '2024-01-10T09:30:00Z',
    lastTest: '2024-01-10T09:28:00Z',
    status: 'Disconnected',
    createdBy: 'System Admin',
    createdAt: '2023-12-01T08:00:00Z',
    lastModified: '2024-01-10T09:30:00Z',
    syncCount: 89,
    errorCount: 45,
    userCount: 0,
    groupCount: 0,
    attributes: {
      username: 'uid',
      firstName: 'givenName',
      lastName: 'sn',
      email: 'mail',
      department: 'ou',
      title: 'title',
      phone: 'telephoneNumber'
    },
    filters: {
      userFilter: '(&(objectClass=inetOrgPerson)(objectClass=person))',
      groupFilter: '(&(objectClass=groupOfNames)(objectClass=group))',
      enabledFilter: '(!(accountStatus=disabled))'
    }
  },
  {
    id: '5',
    name: 'Test LDAP Server',
    description: 'Development and testing LDAP server',
    hostname: 'test-ldap.company.com',
    port: 389,
    sslPort: 636,
    baseDN: 'DC=test,DC=company,DC=com',
    bindDN: 'CN=test-service,OU=Service Accounts,DC=test,DC=company,DC=com',
    isActive: true,
    isSecure: true,
    useSSL: true,
    useTLS: false,
    connectionTimeout: 30,
    searchTimeout: 10,
    maxConnections: 20,
    currentConnections: 3,
    lastSync: '2024-01-17T11:20:00Z',
    lastTest: '2024-01-17T11:18:00Z',
    status: 'Error',
    createdBy: 'Developer',
    createdAt: '2024-01-12T13:45:00Z',
    lastModified: '2024-01-17T11:20:00Z',
    syncCount: 23,
    errorCount: 15,
    userCount: 12,
    groupCount: 3,
    attributes: {
      username: 'uid',
      firstName: 'givenName',
      lastName: 'sn',
      email: 'mail',
      department: 'ou',
      title: 'title',
      phone: 'telephoneNumber'
    },
    filters: {
      userFilter: '(&(objectClass=inetOrgPerson)(objectClass=person))',
      groupFilter: '(&(objectClass=groupOfNames)(objectClass=group))',
      enabledFilter: '(!(accountStatus=disabled))'
    }
  }
];

const serverTypes = ['All', 'Active Directory', 'OpenLDAP', 'Apache Directory', 'Custom'];
const statuses = ['All', 'Connected', 'Disconnected', 'Error', 'Testing', 'Maintenance'];

export default function LdapServersPage() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [ldapServers, setLdapServers] = useState(mockLdapServers);
  const [filteredServers, setFilteredServers] = useState(mockLdapServers);
  const [selectedType, setSelectedType] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [loading, setLoading] = useState(false);
  const [expandedServers, setExpandedServers] = useState<string[]>([]);

  // Filter servers based on search, type, and status
  useEffect(() => {
    let filtered = ldapServers;

    if (searchQuery) {
      filtered = filtered.filter(server => 
        server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        server.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        server.hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        server.baseDN.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedType !== 'All') {
      // This would need to be mapped based on actual server type detection
      filtered = filtered;
    }

    if (selectedStatus !== 'All') {
      filtered = filtered.filter(server => server.status === selectedStatus);
    }

    setFilteredServers(filtered);
  }, [searchQuery, selectedType, selectedStatus, ldapServers]);

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleServerExpansion = (serverId: string) => {
    setExpandedServers(prev =>
      prev.includes(serverId)
        ? prev.filter(id => id !== serverId)
        : [...prev, serverId]
    );
  };

  const toggleSelectServer = (serverId: string) => {
    setSelectedItems(prev =>
      prev.includes(serverId)
        ? prev.filter(id => id !== serverId)
        : [...prev, serverId]
    );
  };

  const handleToggleActive = (serverId: string) => {
    setLdapServers(prev => prev.map(server => 
      server.id === serverId ? { 
        ...server, 
        isActive: !server.isActive,
        status: !server.isActive ? 'Connected' : 'Disconnected'
      } : server
    ));
  };

  const handleDeleteServer = (serverId: string) => {
    if (confirm('Are you sure you want to delete this LDAP server?')) {
      setLdapServers(prev => prev.filter(server => server.id !== serverId));
      setSelectedItems(prev => prev.filter(id => id !== serverId));
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedItems.length} LDAP servers?`)) {
      setLdapServers(prev => prev.filter(server => !selectedItems.includes(server.id)));
      setSelectedItems([]);
    }
  };

  const handleBulkToggleActive = () => {
    setLdapServers(prev => prev.map(server => 
      selectedItems.includes(server.id) ? { 
        ...server, 
        isActive: !server.isActive,
        status: !server.isActive ? 'Connected' : 'Disconnected'
      } : server
    ));
    setSelectedItems([]);
  };

  const handleTestConnection = (serverId: string) => {
    // Simulate connection test
    setLdapServers(prev => prev.map(server => 
      server.id === serverId ? {
        ...server,
        lastTest: new Date().toISOString(),
        status: Math.random() > 0.3 ? 'Connected' : 'Error'
      } : server
    ));
  };

  const handleSyncNow = (serverId: string) => {
    // Simulate sync operation
    setLdapServers(prev => prev.map(server => 
      server.id === serverId ? {
        ...server,
        lastSync: new Date().toISOString(),
        syncCount: server.syncCount + 1
      } : server
    ));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Disconnected':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      case 'Error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'Testing':
        return <TestTube className="h-4 w-4 text-yellow-500" />;
      case 'Maintenance':
        return <Wrench className="h-4 w-4 text-orange-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Connected':
        return 'bg-green-100 text-green-800';
      case 'Disconnected':
        return 'bg-gray-100 text-gray-800';
      case 'Error':
        return 'bg-red-100 text-red-800';
      case 'Testing':
        return 'bg-yellow-100 text-yellow-800';
      case 'Maintenance':
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
          <h1 className="text-2xl font-semibold">LDAP Servers</h1>
          <p className="text-muted-foreground">Manage LDAP server connections and synchronization</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Copy className="h-4 w-4" />
            Import Config
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Server
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Servers</p>
                <p className="text-2xl font-semibold">{ldapServers.length}</p>
              </div>
              <Server className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Connected</p>
                <p className="text-2xl font-semibold">{ldapServers.filter(s => s.status === 'Connected').length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-semibold">{ldapServers.reduce((sum, server) => sum + server.userCount, 0)}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Syncs</p>
                <p className="text-2xl font-semibold">{ldapServers.reduce((sum, server) => sum + server.syncCount, 0)}</p>
              </div>
              <Activity className="h-8 w-8 text-purple-500" />
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
              placeholder="Search servers..."
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
              {serverTypes.map(type => (
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
              <SelectItem value="all">All Security</SelectItem>
              <SelectItem value="secure">Secure</SelectItem>
              <SelectItem value="insecure">Insecure</SelectItem>
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
                {ldapServers.find(s => selectedItems.includes(s.id) && s.isActive) ? 'Disconnect' : 'Connect'}
              </Button>
              <Button variant="outline" size="sm">
                <TestTube className="h-4 w-4 mr-1" />
                Test All
              </Button>
              <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Servers Table */}
      <Card>
        <div className="overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 w-8">
                  <input 
                    type="checkbox" 
                    className="rounded border-input"
                    checked={selectedItems.length === filteredServers.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems(filteredServers.map(server => server.id));
                      } else {
                        setSelectedItems([]);
                      }
                    }}
                  />
                </th>
                <th className="text-left p-4 text-sm font-medium">Server</th>
                <th className="text-left p-4 text-sm font-medium">Hostname</th>
                <th className="text-left p-4 text-sm font-medium">Security</th>
                <th className="text-left p-4 text-sm font-medium">Status</th>
                <th className="text-left p-4 text-sm font-medium">Users</th>
                <th className="text-left p-4 text-sm font-medium">Last Sync</th>
                <th className="text-left p-4 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredServers.map((server) => {
                const isExpanded = expandedServers.includes(server.id);
                
                return (
                  <React.Fragment key={server.id}>
                    <tr className="border-b hover:bg-muted/30">
                      <td className="p-4">
                        <input 
                          type="checkbox" 
                          className="rounded border-input"
                          checked={selectedItems.includes(server.id)}
                          onChange={() => toggleSelectServer(server.id)}
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => toggleServerExpansion(server.id)}
                            className="p-1 rounded hover:bg-muted transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                          <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Server className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {server.name}
                              {server.isSecure && (
                                <Lock className="h-4 w-4 text-green-500" />
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">{server.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-mono text-sm">{server.hostname}</div>
                        <div className="text-xs text-muted-foreground">Port: {server.port}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {server.isSecure ? (
                            <Lock className="h-4 w-4 text-green-500" />
                          ) : (
                            <Unlock className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-sm">
                            {server.useSSL ? 'SSL' : server.useTLS ? 'TLS' : 'None'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(server.status)}
                          <Badge className={getStatusColor(server.status)}>
                            {server.status}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">{server.userCount}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-muted-foreground">
                          {formatDate(server.lastSync)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(server.id)}
                            title={server.isActive ? 'Disconnect' : 'Connect'}
                          >
                            {server.isActive ? <WifiOff className="h-4 w-4" /> : <Wifi className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTestConnection(server.id)}
                            title="Test Connection"
                          >
                            <TestTube className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSyncNow(server.id)}
                            title="Sync Now"
                          >
                            <Activity className="h-4 w-4" />
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
                            onClick={() => handleDeleteServer(server.id)}
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
                            {/* Server Details */}
                            <div>
                              <h4 className="font-medium mb-3 flex items-center gap-2">
                                <Server className="h-4 w-4" />
                                Server Configuration
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Base DN:</span>
                                  <span className="font-mono text-xs">{server.baseDN}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Bind DN:</span>
                                  <span className="font-mono text-xs">{server.bindDN}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">SSL Port:</span>
                                  <span>{server.sslPort}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Timeout:</span>
                                  <span>{server.connectionTimeout}s</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Max Connections:</span>
                                  <span>{server.currentConnections}/{server.maxConnections}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Created by:</span>
                                  <span>{server.createdBy}</span>
                                </div>
                              </div>
                            </div>

                            {/* Attribute Mapping */}
                            <div>
                              <h4 className="font-medium mb-3 flex items-center gap-2">
                                <Tag className="h-4 w-4" />
                                Attribute Mapping
                              </h4>
                              <div className="space-y-2 text-sm">
                                {Object.entries(server.attributes).map(([key, value]) => (
                                  <div key={key} className="flex justify-between">
                                    <span className="text-muted-foreground">{key}:</span>
                                    <span className="font-mono text-xs">{value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Statistics */}
                            <div>
                              <h4 className="font-medium mb-3 flex items-center gap-2">
                                <BarChart3 className="h-4 w-4" />
                                Statistics
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Sync Count:</span>
                                  <span>{server.syncCount}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Error Count:</span>
                                  <span className="text-red-600">{server.errorCount}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Users:</span>
                                  <span>{server.userCount}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Groups:</span>
                                  <span>{server.groupCount}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Last Test:</span>
                                  <span>{formatDate(server.lastTest)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Last Modified:</span>
                                  <span>{formatDate(server.lastModified)}</span>
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
      {filteredServers.length === 0 && (
        <Card className="flex flex-col items-center justify-center py-12">
          <CardContent className="text-center">
            <Server className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No LDAP servers found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || selectedType !== 'All' || selectedStatus !== 'All'
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by adding your first LDAP server'
              }
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Server
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
