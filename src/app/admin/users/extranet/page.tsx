'use client';

import React, { useState, useEffect } from 'react';
import { 
  Globe, 
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
  MapPin
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
const mockExtranetUsers = [
  {
    id: '1',
    username: 'partner_company_1',
    email: 'admin@partnercompany.com',
    firstName: 'John',
    lastName: 'Smith',
    company: 'Partner Company Inc.',
    department: 'IT',
    role: 'Partner Admin',
    accessLevel: 'Partner',
    isActive: true,
    isVerified: true,
    lastLogin: '2024-01-20T14:22:00Z',
    createdBy: 'Admin User',
    createdAt: '2024-01-15T10:30:00Z',
    status: 'Active',
    permissions: ['read_documents', 'download_files', 'view_reports'],
    allowedFolders: ['/Shared/Partner Documents', '/Public/Resources'],
    sessionCount: 45,
    totalAccessTime: '12h 34m',
    ipAddress: '192.168.1.100',
    location: 'New York, NY',
    phone: '+1-555-0123',
    notes: 'Primary contact for Partner Company Inc.'
  },
  {
    id: '2',
    username: 'client_consultant',
    email: 'consultant@clientfirm.com',
    firstName: 'Sarah',
    lastName: 'Johnson',
    company: 'Client Firm LLC',
    department: 'Consulting',
    role: 'Consultant',
    accessLevel: 'Client',
    isActive: true,
    isVerified: true,
    lastLogin: '2024-01-19T16:45:00Z',
    createdBy: 'Client Manager',
    createdAt: '2024-01-10T09:15:00Z',
    status: 'Active',
    permissions: ['read_documents', 'comment_documents'],
    allowedFolders: ['/Client/Project Alpha', '/Client/Reports'],
    sessionCount: 23,
    totalAccessTime: '8h 12m',
    ipAddress: '10.0.0.50',
    location: 'Los Angeles, CA',
    phone: '+1-555-0456',
    notes: 'External consultant working on Project Alpha'
  },
  {
    id: '3',
    username: 'vendor_support',
    email: 'support@vendortech.com',
    firstName: 'Mike',
    lastName: 'Wilson',
    company: 'Vendor Tech Solutions',
    department: 'Support',
    role: 'Vendor Support',
    accessLevel: 'Vendor',
    isActive: true,
    isVerified: true,
    lastLogin: '2024-01-18T12:15:00Z',
    createdBy: 'IT Manager',
    createdAt: '2024-01-05T11:20:00Z',
    status: 'Active',
    permissions: ['read_documents', 'view_logs', 'system_access'],
    allowedFolders: ['/System/Logs', '/Technical/Documentation'],
    sessionCount: 67,
    totalAccessTime: '24h 8m',
    ipAddress: '172.16.0.25',
    location: 'Chicago, IL',
    phone: '+1-555-0789',
    notes: 'Technical support for system maintenance'
  },
  {
    id: '4',
    username: 'temp_contractor',
    email: 'contractor@tempagency.com',
    firstName: 'Lisa',
    lastName: 'Brown',
    company: 'Temp Agency Corp',
    department: 'Contracting',
    role: 'Contractor',
    accessLevel: 'Temporary',
    isActive: false,
    isVerified: true,
    lastLogin: '2024-01-12T09:30:00Z',
    createdBy: 'HR Manager',
    createdAt: '2024-01-01T08:00:00Z',
    status: 'Inactive',
    permissions: ['read_documents'],
    allowedFolders: ['/Temporary/Project Files'],
    sessionCount: 12,
    totalAccessTime: '3h 45m',
    ipAddress: '192.168.2.150',
    location: 'Miami, FL',
    phone: '+1-555-0321',
    notes: 'Temporary contractor - project completed'
  },
  {
    id: '5',
    username: 'auditor_external',
    email: 'auditor@auditfirm.com',
    firstName: 'Robert',
    lastName: 'Davis',
    company: 'Audit Firm Partners',
    department: 'Audit',
    role: 'External Auditor',
    accessLevel: 'Auditor',
    isActive: true,
    isVerified: false,
    lastLogin: null,
    createdBy: 'Compliance Manager',
    createdAt: '2024-01-12T13:45:00Z',
    status: 'Pending Verification',
    permissions: ['read_documents', 'audit_access', 'export_data'],
    allowedFolders: ['/Audit/Financial Records', '/Audit/Compliance'],
    sessionCount: 0,
    totalAccessTime: '0h 0m',
    ipAddress: null,
    location: 'Boston, MA',
    phone: '+1-555-0654',
    notes: 'External auditor for annual compliance review'
  }
];

const accessLevels = ['All', 'Partner', 'Client', 'Vendor', 'Temporary', 'Auditor'];
const roles = ['All', 'Partner Admin', 'Consultant', 'Vendor Support', 'Contractor', 'External Auditor'];
const statuses = ['All', 'Active', 'Inactive', 'Pending Verification', 'Suspended', 'Expired'];

export default function ExtranetUsersPage() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [extranetUsers, setExtranetUsers] = useState(mockExtranetUsers);
  const [filteredUsers, setFilteredUsers] = useState(mockExtranetUsers);
  const [selectedAccessLevel, setSelectedAccessLevel] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [loading, setLoading] = useState(false);
  const [expandedUsers, setExpandedUsers] = useState<string[]>([]);

  // Filter users based on search, access level, and status
  useEffect(() => {
    let filtered = extranetUsers;

    if (searchQuery) {
      filtered = filtered.filter(user => 
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.company.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedAccessLevel !== 'All') {
      filtered = filtered.filter(user => user.accessLevel === selectedAccessLevel);
    }

    if (selectedStatus !== 'All') {
      filtered = filtered.filter(user => user.status === selectedStatus);
    }

    setFilteredUsers(filtered);
  }, [searchQuery, selectedAccessLevel, selectedStatus, extranetUsers]);

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleUserExpansion = (userId: string) => {
    setExpandedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleSelectUser = (userId: string) => {
    setSelectedItems(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleToggleActive = (userId: string) => {
    setExtranetUsers(prev => prev.map(user => 
      user.id === userId ? { 
        ...user, 
        isActive: !user.isActive,
        status: !user.isActive ? 'Active' : 'Inactive'
      } : user
    ));
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Are you sure you want to delete this extranet user?')) {
      setExtranetUsers(prev => prev.filter(user => user.id !== userId));
      setSelectedItems(prev => prev.filter(id => id !== userId));
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedItems.length} extranet users?`)) {
      setExtranetUsers(prev => prev.filter(user => !selectedItems.includes(user.id)));
      setSelectedItems([]);
    }
  };

  const handleBulkToggleActive = () => {
    setExtranetUsers(prev => prev.map(user => 
      selectedItems.includes(user.id) ? { 
        ...user, 
        isActive: !user.isActive,
        status: !user.isActive ? 'Active' : 'Inactive'
      } : user
    ));
    setSelectedItems([]);
  };

  const handleVerifyUser = (userId: string) => {
    setExtranetUsers(prev => prev.map(user => 
      user.id === userId ? { 
        ...user, 
        isVerified: true,
        status: 'Active'
      } : user
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
      case 'Suspended':
        return <Pause className="h-4 w-4 text-orange-500" />;
      case 'Expired':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'Partner':
        return 'bg-blue-100 text-blue-800';
      case 'Client':
        return 'bg-green-100 text-green-800';
      case 'Vendor':
        return 'bg-purple-100 text-purple-800';
      case 'Temporary':
        return 'bg-yellow-100 text-yellow-800';
      case 'Auditor':
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
          <h1 className="text-2xl font-semibold">Extranet Users</h1>
          <p className="text-muted-foreground">Manage external users and their access permissions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Copy className="h-4 w-4" />
            Import Users
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-semibold">{extranetUsers.length}</p>
              </div>
              <Globe className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-semibold">{extranetUsers.filter(u => u.isActive).length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Companies</p>
                <p className="text-2xl font-semibold">
                  {new Set(extranetUsers.map(u => u.company)).size}
                </p>
              </div>
              <Building className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sessions</p>
                <p className="text-2xl font-semibold">
                  {extranetUsers.reduce((sum, user) => sum + user.sessionCount, 0)}
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
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
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
              <SelectItem value="all">All Roles</SelectItem>
              {roles.slice(1).map(role => (
                <SelectItem key={role} value={role}>
                  {role}
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
                {extranetUsers.find(u => selectedItems.includes(u.id) && u.isActive) ? 'Deactivate' : 'Activate'}
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

      {/* Users Table */}
      <Card>
        <div className="overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 w-8">
                  <input 
                    type="checkbox" 
                    className="rounded border-input"
                    checked={selectedItems.length === filteredUsers.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems(filteredUsers.map(user => user.id));
                      } else {
                        setSelectedItems([]);
                      }
                    }}
                  />
                </th>
                <th className="text-left p-4 text-sm font-medium">User</th>
                <th className="text-left p-4 text-sm font-medium">Company</th>
                <th className="text-left p-4 text-sm font-medium">Access Level</th>
                <th className="text-left p-4 text-sm font-medium">Status</th>
                <th className="text-left p-4 text-sm font-medium">Last Login</th>
                <th className="text-left p-4 text-sm font-medium">Sessions</th>
                <th className="text-left p-4 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const isExpanded = expandedUsers.includes(user.id);
                
                return (
                  <React.Fragment key={user.id}>
                    <tr className="border-b hover:bg-muted/30">
                      <td className="p-4">
                        <input 
                          type="checkbox" 
                          className="rounded border-input"
                          checked={selectedItems.includes(user.id)}
                          onChange={() => toggleSelectUser(user.id)}
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => toggleUserExpansion(user.id)}
                            className="p-1 rounded hover:bg-muted transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                          <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {user.firstName} {user.lastName}
                              {!user.isVerified && (
                                <Badge variant="destructive" className="text-xs">
                                  Unverified
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                            <div className="text-xs text-muted-foreground">@{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <div className="text-sm font-medium">{user.company}</div>
                          <div className="text-xs text-muted-foreground">{user.department}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className={getAccessLevelColor(user.accessLevel)}>
                          {user.accessLevel}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(user.status)}
                          <Badge variant={user.isActive ? "default" : "secondary"}>
                            {user.status}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-muted-foreground">
                          {formatDate(user.lastLogin)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">{user.sessionCount}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(user.id)}
                            title={user.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {user.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                          {!user.isVerified && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleVerifyUser(user.id)}
                              title="Verify User"
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
                            onClick={() => handleDeleteUser(user.id)}
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
                            {/* User Details */}
                            <div>
                              <h4 className="font-medium mb-3 flex items-center gap-2">
                                <User className="h-4 w-4" />
                                User Information
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Role:</span>
                                  <span>{user.role}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Created by:</span>
                                  <span>{user.createdBy}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Created at:</span>
                                  <span>{formatDate(user.createdAt)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Phone:</span>
                                  <span>{user.phone}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Location:</span>
                                  <span>{user.location}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">IP Address:</span>
                                  <span className="font-mono text-xs">{user.ipAddress || 'N/A'}</span>
                                </div>
                              </div>
                            </div>

                            {/* Permissions & Access */}
                            <div>
                              <h4 className="font-medium mb-3 flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                Permissions & Access
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div>
                                  <div className="text-muted-foreground mb-1">Permissions:</div>
                                  <div className="flex flex-wrap gap-1">
                                    {user.permissions.map(permission => (
                                      <Badge key={permission} variant="outline" className="text-xs">
                                        {permission}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-muted-foreground mb-1">Allowed Folders:</div>
                                  <div className="space-y-1">
                                    {user.allowedFolders.map(folder => (
                                      <div key={folder} className="text-xs font-mono bg-muted/50 p-1 rounded">
                                        {folder}
                                      </div>
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
                                  <span className="text-muted-foreground">Sessions:</span>
                                  <span>{user.sessionCount}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Total Access Time:</span>
                                  <span>{user.totalAccessTime}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Last Login:</span>
                                  <span>{formatDate(user.lastLogin)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Verified:</span>
                                  <span className={user.isVerified ? "text-green-600" : "text-red-600"}>
                                    {user.isVerified ? 'Yes' : 'No'}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Active:</span>
                                  <span className={user.isActive ? "text-green-600" : "text-red-600"}>
                                    {user.isActive ? 'Yes' : 'No'}
                                  </span>
                                </div>
                                {user.notes && (
                                  <div>
                                    <div className="text-muted-foreground mb-1">Notes:</div>
                                    <div className="text-xs bg-muted/50 p-2 rounded">
                                      {user.notes}
                                    </div>
                                  </div>
                                )}
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
      {filteredUsers.length === 0 && (
        <Card className="flex flex-col items-center justify-center py-12">
          <CardContent className="text-center">
            <Globe className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No extranet users found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || selectedAccessLevel !== 'All' || selectedStatus !== 'All'
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by adding your first extranet user'
              }
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
