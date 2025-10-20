'use client';

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
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
  Lock,
  Unlock,
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
  Folder
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
const mockSecuredSpaces = [
  {
    id: '1',
    name: 'Executive Confidential',
    description: 'Highly secure space for executive-level confidential documents',
    type: 'Department',
    encryptionLevel: 'AES-256',
    accessLevel: 'Restricted',
    isActive: true,
    isEncrypted: true,
    requiresAuthentication: true,
    requiresApproval: true,
    maxUsers: 10,
    currentUsers: 8,
    documentCount: 156,
    totalSize: '2.3 GB',
    createdBy: 'Admin User',
    createdAt: '2024-01-15T10:30:00Z',
    lastAccessed: '2024-01-20T14:22:00Z',
    status: 'Active',
    permissions: ['read', 'write', 'delete'],
    auditLogs: 1247,
    complianceLevel: 'SOX',
    retentionPolicy: '7 years',
    backupFrequency: 'Daily'
  },
  {
    id: '2',
    name: 'Legal Documents',
    description: 'Secure space for legal documents and case files',
    type: 'Department',
    encryptionLevel: 'AES-256',
    accessLevel: 'Confidential',
    isActive: true,
    isEncrypted: true,
    requiresAuthentication: true,
    requiresApproval: false,
    maxUsers: 25,
    currentUsers: 18,
    documentCount: 234,
    totalSize: '4.7 GB',
    createdBy: 'Legal Team',
    createdAt: '2024-01-10T09:15:00Z',
    lastAccessed: '2024-01-19T16:45:00Z',
    status: 'Active',
    permissions: ['read', 'write'],
    auditLogs: 892,
    complianceLevel: 'GDPR',
    retentionPolicy: '10 years',
    backupFrequency: 'Daily'
  },
  {
    id: '3',
    name: 'Financial Records',
    description: 'Secure space for financial documents and accounting records',
    type: 'Department',
    encryptionLevel: 'AES-256',
    accessLevel: 'Restricted',
    isActive: true,
    isEncrypted: true,
    requiresAuthentication: true,
    requiresApproval: true,
    maxUsers: 15,
    currentUsers: 12,
    documentCount: 445,
    totalSize: '8.9 GB',
    createdBy: 'Finance Team',
    createdAt: '2024-01-05T11:20:00Z',
    lastAccessed: '2024-01-18T12:15:00Z',
    status: 'Active',
    permissions: ['read', 'write', 'delete'],
    auditLogs: 1567,
    complianceLevel: 'SOX',
    retentionPolicy: '7 years',
    backupFrequency: 'Hourly'
  },
  {
    id: '4',
    name: 'HR Personnel Files',
    description: 'Secure space for employee personnel files and HR documents',
    type: 'Department',
    encryptionLevel: 'AES-128',
    accessLevel: 'Confidential',
    isActive: true,
    isEncrypted: true,
    requiresAuthentication: true,
    requiresApproval: false,
    maxUsers: 8,
    currentUsers: 5,
    documentCount: 89,
    totalSize: '1.2 GB',
    createdBy: 'HR Team',
    createdAt: '2024-01-12T13:45:00Z',
    lastAccessed: '2024-01-17T11:20:00Z',
    status: 'Active',
    permissions: ['read', 'write'],
    auditLogs: 234,
    complianceLevel: 'GDPR',
    retentionPolicy: '5 years',
    backupFrequency: 'Daily'
  },
  {
    id: '5',
    name: 'Archived Projects',
    description: 'Long-term storage for completed project documents',
    type: 'Archive',
    encryptionLevel: 'AES-256',
    accessLevel: 'Restricted',
    isActive: false,
    isEncrypted: true,
    requiresAuthentication: true,
    requiresApproval: true,
    maxUsers: 5,
    currentUsers: 2,
    documentCount: 1234,
    totalSize: '15.6 GB',
    createdBy: 'Project Manager',
    createdAt: '2024-01-01T08:00:00Z',
    lastAccessed: '2024-01-15T09:30:00Z',
    status: 'Inactive',
    permissions: ['read'],
    auditLogs: 456,
    complianceLevel: 'Internal',
    retentionPolicy: '15 years',
    backupFrequency: 'Weekly'
  }
];

const spaceTypes = ['All', 'Department', 'Project', 'Archive', 'Personal', 'Public'];
const accessLevels = ['All', 'Public', 'Internal', 'Confidential', 'Restricted', 'Top Secret'];
const encryptionLevels = ['AES-128', 'AES-256', 'RSA-2048', 'RSA-4096'];
const complianceLevels = ['SOX', 'GDPR', 'HIPAA', 'PCI-DSS', 'Internal', 'Custom'];
const statuses = ['All', 'Active', 'Inactive', 'Maintenance', 'Error'];

export default function SecuredSpacesPage() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [securedSpaces, setSecuredSpaces] = useState(mockSecuredSpaces);
  const [filteredSpaces, setFilteredSpaces] = useState(mockSecuredSpaces);
  const [selectedType, setSelectedType] = useState('All');
  const [selectedAccessLevel, setSelectedAccessLevel] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [loading, setLoading] = useState(false);
  const [expandedSpaces, setExpandedSpaces] = useState<string[]>([]);

  // Filter spaces based on search, type, access level, and status
  useEffect(() => {
    let filtered = securedSpaces;

    if (searchQuery) {
      filtered = filtered.filter(space => 
        space.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        space.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        space.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedType !== 'All') {
      filtered = filtered.filter(space => space.type === selectedType);
    }

    if (selectedAccessLevel !== 'All') {
      filtered = filtered.filter(space => space.accessLevel === selectedAccessLevel);
    }

    if (selectedStatus !== 'All') {
      filtered = filtered.filter(space => space.status === selectedStatus);
    }

    setFilteredSpaces(filtered);
  }, [searchQuery, selectedType, selectedAccessLevel, selectedStatus, securedSpaces]);

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleSpaceExpansion = (spaceId: string) => {
    setExpandedSpaces(prev =>
      prev.includes(spaceId)
        ? prev.filter(id => id !== spaceId)
        : [...prev, spaceId]
    );
  };

  const toggleSelectSpace = (spaceId: string) => {
    setSelectedItems(prev =>
      prev.includes(spaceId)
        ? prev.filter(id => id !== spaceId)
        : [...prev, spaceId]
    );
  };

  const handleToggleActive = (spaceId: string) => {
    setSecuredSpaces(prev => prev.map(space => 
      space.id === spaceId ? { 
        ...space, 
        isActive: !space.isActive,
        status: !space.isActive ? 'Active' : 'Inactive'
      } : space
    ));
  };

  const handleDeleteSpace = (spaceId: string) => {
    if (confirm('Are you sure you want to delete this secured space?')) {
      setSecuredSpaces(prev => prev.filter(space => space.id !== spaceId));
      setSelectedItems(prev => prev.filter(id => id !== spaceId));
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedItems.length} secured spaces?`)) {
      setSecuredSpaces(prev => prev.filter(space => !selectedItems.includes(space.id)));
      setSelectedItems([]);
    }
  };

  const handleBulkToggleActive = () => {
    setSecuredSpaces(prev => prev.map(space => 
      selectedItems.includes(space.id) ? { 
        ...space, 
        isActive: !space.isActive,
        status: !space.isActive ? 'Active' : 'Inactive'
      } : space
    ));
    setSelectedItems([]);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Inactive':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      case 'Maintenance':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'Error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Department':
        return <Building className="h-4 w-4 text-blue-500" />;
      case 'Project':
        return <Folder className="h-4 w-4 text-green-500" />;
      case 'Archive':
        return <Database className="h-4 w-4 text-purple-500" />;
      case 'Personal':
        return <User className="h-4 w-4 text-orange-500" />;
      case 'Public':
        return <Globe className="h-4 w-4 text-cyan-500" />;
      default:
        return <Shield className="h-4 w-4 text-gray-500" />;
    }
  };

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'Public':
        return 'bg-green-100 text-green-800';
      case 'Internal':
        return 'bg-blue-100 text-blue-800';
      case 'Confidential':
        return 'bg-yellow-100 text-yellow-800';
      case 'Restricted':
        return 'bg-orange-100 text-orange-800';
      case 'Top Secret':
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
          <h1 className="text-2xl font-semibold">Secured Spaces</h1>
          <p className="text-muted-foreground">Manage secure document storage spaces and access controls</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Server className="h-4 w-4" />
            Import Spaces
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Space
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Spaces</p>
                <p className="text-2xl font-semibold">{securedSpaces.length}</p>
              </div>
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Spaces</p>
                <p className="text-2xl font-semibold">{securedSpaces.filter(s => s.isActive).length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Documents</p>
                <p className="text-2xl font-semibold">{securedSpaces.reduce((sum, space) => sum + space.documentCount, 0)}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Size</p>
                <p className="text-2xl font-semibold">
                  {securedSpaces.reduce((sum, space) => {
                    const size = parseFloat(space.totalSize);
                    return sum + size;
                  }, 0).toFixed(1)} GB
                </p>
              </div>
              <Database className="h-8 w-8 text-purple-500" />
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
              placeholder="Search spaces..."
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
              {spaceTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedAccessLevel} onValueChange={setSelectedAccessLevel}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {accessLevels.map(level => (
                <SelectItem key={level} value={level}>
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-32">
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
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {selectedItems.length} selected
          </span>
          {selectedItems.length > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={handleBulkToggleActive}>
                {securedSpaces.find(s => selectedItems.includes(s.id) && s.isActive) ? 'Deactivate' : 'Activate'}
              </Button>
              <Button variant="outline" size="sm">
                <Key className="h-4 w-4 mr-1" />
                Manage Access
              </Button>
              <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Spaces Table */}
      <Card>
        <div className="overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 w-8">
                  <input 
                    type="checkbox" 
                    className="rounded border-input"
                    checked={selectedItems.length === filteredSpaces.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems(filteredSpaces.map(space => space.id));
                      } else {
                        setSelectedItems([]);
                      }
                    }}
                  />
                </th>
                <th className="text-left p-4 text-sm font-medium">Space</th>
                <th className="text-left p-4 text-sm font-medium">Type</th>
                <th className="text-left p-4 text-sm font-medium">Access Level</th>
                <th className="text-left p-4 text-sm font-medium">Documents</th>
                <th className="text-left p-4 text-sm font-medium">Status</th>
                <th className="text-left p-4 text-sm font-medium">Last Accessed</th>
                <th className="text-left p-4 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSpaces.map((space) => {
                const isExpanded = expandedSpaces.includes(space.id);
                
                return (
                  <React.Fragment key={space.id}>
                    <tr className="border-b hover:bg-muted/30">
                      <td className="p-4">
                        <input 
                          type="checkbox" 
                          className="rounded border-input"
                          checked={selectedItems.includes(space.id)}
                          onChange={() => toggleSelectSpace(space.id)}
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => toggleSpaceExpansion(space.id)}
                            className="p-1 rounded hover:bg-muted transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                          <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                            {getTypeIcon(space.type)}
                          </div>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {space.name}
                              {space.isEncrypted && (
                                <Lock className="h-4 w-4 text-green-500" />
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">{space.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(space.type)}
                          <span className="text-sm">{space.type}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className={getAccessLevelColor(space.accessLevel)}>
                          {space.accessLevel}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{space.documentCount}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(space.status)}
                          <Badge variant={space.isActive ? "default" : "secondary"}>
                            {space.status}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-muted-foreground">
                          {formatDate(space.lastAccessed)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(space.id)}
                            title={space.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {space.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="sm" title="Manage Access">
                            <Users className="h-4 w-4" />
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
                            onClick={() => handleDeleteSpace(space.id)}
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
                            {/* Space Details */}
                            <div>
                              <h4 className="font-medium mb-3 flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                Space Information
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Created by:</span>
                                  <span>{space.createdBy}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Created at:</span>
                                  <span>{formatDate(space.createdAt)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Encryption:</span>
                                  <span>{space.encryptionLevel}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Auth Required:</span>
                                  <span>{space.requiresAuthentication ? 'Yes' : 'No'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Approval Required:</span>
                                  <span>{space.requiresApproval ? 'Yes' : 'No'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Max Users:</span>
                                  <span>{space.maxUsers}</span>
                                </div>
                              </div>
                            </div>

                            {/* Security & Compliance */}
                            <div>
                              <h4 className="font-medium mb-3 flex items-center gap-2">
                                <Lock className="h-4 w-4" />
                                Security & Compliance
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Compliance:</span>
                                  <span>{space.complianceLevel}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Retention:</span>
                                  <span>{space.retentionPolicy}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Backup:</span>
                                  <span>{space.backupFrequency}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Audit Logs:</span>
                                  <span>{space.auditLogs}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Permissions:</span>
                                  <div className="flex gap-1">
                                    {space.permissions.map(perm => (
                                      <Badge key={perm} variant="outline" className="text-xs">
                                        {perm}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
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
                                  <span className="text-muted-foreground">Current Users:</span>
                                  <span>{space.currentUsers}/{space.maxUsers}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Documents:</span>
                                  <span>{space.documentCount}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Total Size:</span>
                                  <span>{space.totalSize}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Last Accessed:</span>
                                  <span>{formatDate(space.lastAccessed)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Encrypted:</span>
                                  <span className={space.isEncrypted ? "text-green-600" : "text-red-600"}>
                                    {space.isEncrypted ? 'Yes' : 'No'}
                                  </span>
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
      {filteredSpaces.length === 0 && (
        <Card className="flex flex-col items-center justify-center py-12">
          <CardContent className="text-center">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No secured spaces found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || selectedType !== 'All' || selectedAccessLevel !== 'All' || selectedStatus !== 'All'
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by creating your first secured space'
              }
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Space
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
