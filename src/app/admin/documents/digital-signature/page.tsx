'use client';

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Plus, 
  Search, 
  Edit,
  Trash2,
  FileBadge,
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
  
  Download,
  Upload,
  CheckCircle,
  XCircle,
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
  Lock,
  Unlock,
  Calendar,
  User,
  Hash,
  Fingerprint
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
const mockCertificates = [
  {
    id: '1',
    name: 'Company Root CA',
    description: 'Root certificate authority for company digital signatures',
    type: 'Root CA',
    issuer: 'Company Internal CA',
    subject: 'CN=Company Root CA, O=Company Inc, C=US',
    serialNumber: '1234567890ABCDEF',
    thumbprint: 'A1B2C3D4E5F6789012345678901234567890ABCD',
    validFrom: '2024-01-01T00:00:00Z',
    validTo: '2026-01-01T00:00:00Z',
    keySize: 2048,
    algorithm: 'RSA-SHA256',
    isActive: true,
    isTrusted: true,
    usageCount: 1247,
    createdBy: 'Admin User',
    createdAt: '2024-01-01T08:00:00Z',
    lastUsed: '2024-01-20T14:22:00Z',
    status: 'Valid',
    documents: ['doc-001', 'doc-002', 'doc-003']
  },
  {
    id: '2',
    name: 'John Doe Personal',
    description: 'Personal certificate for John Doe',
    type: 'Personal',
    issuer: 'Company Internal CA',
    subject: 'CN=John Doe, OU=IT Department, O=Company Inc, C=US',
    serialNumber: '2345678901BCDEF0',
    thumbprint: 'B2C3D4E5F6789012345678901234567890ABCDEF',
    validFrom: '2024-01-15T00:00:00Z',
    validTo: '2025-01-15T00:00:00Z',
    keySize: 2048,
    algorithm: 'RSA-SHA256',
    isActive: true,
    isTrusted: true,
    usageCount: 89,
    createdBy: 'John Doe',
    createdAt: '2024-01-15T10:30:00Z',
    lastUsed: '2024-01-19T16:45:00Z',
    status: 'Valid',
    documents: ['doc-004', 'doc-005']
  },
  {
    id: '3',
    name: 'Legal Department CA',
    description: 'Certificate authority for legal department',
    type: 'Intermediate CA',
    issuer: 'Company Root CA',
    subject: 'CN=Legal Department CA, OU=Legal, O=Company Inc, C=US',
    serialNumber: '3456789012CDEF01',
    thumbprint: 'C3D4E5F6789012345678901234567890ABCDEF01',
    validFrom: '2024-01-10T00:00:00Z',
    validTo: '2025-01-10T00:00:00Z',
    keySize: 2048,
    algorithm: 'RSA-SHA256',
    isActive: true,
    isTrusted: true,
    usageCount: 234,
    createdBy: 'Legal Team',
    createdAt: '2024-01-10T09:15:00Z',
    lastUsed: '2024-01-18T12:15:00Z',
    status: 'Valid',
    documents: ['doc-006', 'doc-007', 'doc-008']
  },
  {
    id: '4',
    name: 'Expired Test Certificate',
    description: 'Test certificate that has expired',
    type: 'Personal',
    issuer: 'Test CA',
    subject: 'CN=Test User, O=Test Company, C=US',
    serialNumber: '4567890123DEF012',
    thumbprint: 'D4E5F6789012345678901234567890ABCDEF0123',
    validFrom: '2023-01-01T00:00:00Z',
    validTo: '2023-12-31T23:59:59Z',
    keySize: 1024,
    algorithm: 'RSA-SHA1',
    isActive: false,
    isTrusted: false,
    usageCount: 45,
    createdBy: 'Test User',
    createdAt: '2023-01-01T08:00:00Z',
    lastUsed: '2023-12-15T11:20:00Z',
    status: 'Expired',
    documents: ['doc-009']
  },
  {
    id: '5',
    name: 'Revoked Certificate',
    description: 'Certificate that has been revoked',
    type: 'Personal',
    issuer: 'Company Internal CA',
    subject: 'CN=Revoked User, OU=Former Employee, O=Company Inc, C=US',
    serialNumber: '5678901234EF0123',
    thumbprint: 'E5F6789012345678901234567890ABCDEF012345',
    validFrom: '2024-01-05T00:00:00Z',
    validTo: '2025-01-05T00:00:00Z',
    keySize: 2048,
    algorithm: 'RSA-SHA256',
    isActive: false,
    isTrusted: false,
    usageCount: 12,
    createdBy: 'Former Employee',
    createdAt: '2024-01-05T11:20:00Z',
    lastUsed: '2024-01-12T13:45:00Z',
    status: 'Revoked',
    documents: ['doc-010']
  }
];

const certificateTypes = ['All', 'Root CA', 'Intermediate CA', 'Personal', 'Code Signing', 'SSL/TLS'];
const statuses = ['All', 'Valid', 'Expired', 'Revoked', 'Pending'];
const algorithms = ['RSA-SHA1', 'RSA-SHA256', 'ECDSA-SHA256', 'DSA-SHA1'];

export default function DigitalSignaturePage() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [certificates, setCertificates] = useState(mockCertificates);
  const [filteredCertificates, setFilteredCertificates] = useState(mockCertificates);
  const [selectedType, setSelectedType] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [loading, setLoading] = useState(false);
  const [expandedCertificates, setExpandedCertificates] = useState<string[]>([]);

  // Filter certificates based on search, type, and status
  useEffect(() => {
    let filtered = certificates;

    if (searchQuery) {
      filtered = filtered.filter(cert => 
        cert.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cert.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cert.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cert.issuer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cert.serialNumber.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedType !== 'All') {
      filtered = filtered.filter(cert => cert.type === selectedType);
    }

    if (selectedStatus !== 'All') {
      filtered = filtered.filter(cert => cert.status === selectedStatus);
    }

    setFilteredCertificates(filtered);
  }, [searchQuery, selectedType, selectedStatus, certificates]);

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleCertificateExpansion = (certId: string) => {
    setExpandedCertificates(prev =>
      prev.includes(certId)
        ? prev.filter(id => id !== certId)
        : [...prev, certId]
    );
  };

  const toggleSelectCertificate = (certId: string) => {
    setSelectedItems(prev =>
      prev.includes(certId)
        ? prev.filter(id => id !== certId)
        : [...prev, certId]
    );
  };

  const handleToggleActive = (certId: string) => {
    setCertificates(prev => prev.map(cert => 
      cert.id === certId ? { 
        ...cert, 
        isActive: !cert.isActive,
        status: !cert.isActive ? 'Valid' : 'Revoked'
      } : cert
    ));
  };

  const handleDeleteCertificate = (certId: string) => {
    if (confirm('Are you sure you want to delete this certificate?')) {
      setCertificates(prev => prev.filter(cert => cert.id !== certId));
      setSelectedItems(prev => prev.filter(id => id !== certId));
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedItems.length} certificates?`)) {
      setCertificates(prev => prev.filter(cert => !selectedItems.includes(cert.id)));
      setSelectedItems([]);
    }
  };

  const handleBulkToggleActive = () => {
    setCertificates(prev => prev.map(cert => 
      selectedItems.includes(cert.id) ? { 
        ...cert, 
        isActive: !cert.isActive,
        status: !cert.isActive ? 'Valid' : 'Revoked'
      } : cert
    ));
    setSelectedItems([]);
  };

  const handleRevokeCertificate = (certId: string) => {
    if (confirm('Are you sure you want to revoke this certificate?')) {
      setCertificates(prev => prev.map(cert => 
        cert.id === certId ? { 
          ...cert, 
          isActive: false,
          isTrusted: false,
          status: 'Revoked'
        } : cert
      ));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Valid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Expired':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'Revoked':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'Pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Root CA':
        return <Shield className="h-4 w-4 text-blue-500" />;
      case 'Intermediate CA':
        return <FileBadge className="h-4 w-4 text-purple-500" />;
      case 'Personal':
        return <User className="h-4 w-4 text-green-500" />;
      case 'Code Signing':
        return <Key className="h-4 w-4 text-orange-500" />;
      case 'SSL/TLS':
        return <Lock className="h-4 w-4 text-cyan-500" />;
      default:
        return <FileBadge className="h-4 w-4 text-gray-500" />;
    }
  };

  const isExpiringSoon = (validTo: string) => {
    const validToDate = new Date(validTo);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return validToDate <= thirtyDaysFromNow && validToDate > new Date();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Digital Signatures</h1>
          <p className="text-muted-foreground">Manage digital certificates and signature settings</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            Import Certificate
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Certificate
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Certificates</p>
                <p className="text-2xl font-semibold">{certificates.length}</p>
              </div>
              <FileBadge className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valid Certificates</p>
                <p className="text-2xl font-semibold">{certificates.filter(c => c.status === 'Valid').length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expiring Soon</p>
                <p className="text-2xl font-semibold">
                  {certificates.filter(c => isExpiringSoon(c.validTo)).length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Usage</p>
                <p className="text-2xl font-semibold">{certificates.reduce((sum, cert) => sum + cert.usageCount, 0)}</p>
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
              placeholder="Search certificates..."
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
              {certificateTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {type}
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

          <Select defaultValue="all">
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Trust</SelectItem>
              <SelectItem value="trusted">Trusted</SelectItem>
              <SelectItem value="untrusted">Untrusted</SelectItem>
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
                {certificates.find(c => selectedItems.includes(c.id) && c.isActive) ? 'Revoke' : 'Activate'}
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Certificates Table */}
      <Card>
        <div className="overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 w-8">
                  <input 
                    type="checkbox" 
                    className="rounded border-input"
                    checked={selectedItems.length === filteredCertificates.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems(filteredCertificates.map(cert => cert.id));
                      } else {
                        setSelectedItems([]);
                      }
                    }}
                  />
                </th>
                <th className="text-left p-4 text-sm font-medium">Certificate</th>
                <th className="text-left p-4 text-sm font-medium">Type</th>
                <th className="text-left p-4 text-sm font-medium">Status</th>
                <th className="text-left p-4 text-sm font-medium">Valid Until</th>
                <th className="text-left p-4 text-sm font-medium">Usage</th>
                <th className="text-left p-4 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCertificates.map((cert) => {
                const isExpanded = expandedCertificates.includes(cert.id);
                const isExpiring = isExpiringSoon(cert.validTo);
                
                return (
                  <React.Fragment key={cert.id}>
                    <tr className="border-b hover:bg-muted/30">
                      <td className="p-4">
                        <input 
                          type="checkbox" 
                          className="rounded border-input"
                          checked={selectedItems.includes(cert.id)}
                          onChange={() => toggleSelectCertificate(cert.id)}
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => toggleCertificateExpansion(cert.id)}
                            className="p-1 rounded hover:bg-muted transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                          <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                            {getTypeIcon(cert.type)}
                          </div>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {cert.name}
                              {isExpiring && (
                                <Badge variant="destructive" className="text-xs">
                                  Expiring Soon
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">{cert.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(cert.type)}
                          <span className="text-sm">{cert.type}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(cert.status)}
                          <Badge variant={cert.status === 'Valid' ? "default" : "secondary"}>
                            {cert.status}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-muted-foreground">
                          {formatDate(cert.validTo)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{cert.usageCount}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(cert.id)}
                            title={cert.isActive ? 'Revoke' : 'Activate'}
                          >
                            {cert.isActive ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="sm" title="Download">
                            <Download className="h-4 w-4" />
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
                            onClick={() => handleDeleteCertificate(cert.id)}
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
                        <td colSpan={7} className="p-4">
                          <div className="grid grid-cols-3 gap-6 ml-12">
                            {/* Certificate Details */}
                            <div>
                              <h4 className="font-medium mb-3 flex items-center gap-2">
                                <FileBadge className="h-4 w-4" />
                                Certificate Information
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Serial Number:</span>
                                  <span className="font-mono text-xs">{cert.serialNumber}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Thumbprint:</span>
                                  <span className="font-mono text-xs">{cert.thumbprint.substring(0, 16)}...</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Algorithm:</span>
                                  <span>{cert.algorithm}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Key Size:</span>
                                  <span>{cert.keySize} bits</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Created by:</span>
                                  <span>{cert.createdBy}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Created at:</span>
                                  <span>{formatDate(cert.createdAt)}</span>
                                </div>
                              </div>
                            </div>

                            {/* Subject & Issuer */}
                            <div>
                              <h4 className="font-medium mb-3 flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Subject & Issuer
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div>
                                  <div className="text-muted-foreground mb-1">Subject:</div>
                                  <div className="font-mono text-xs bg-muted/50 p-2 rounded">
                                    {cert.subject}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-muted-foreground mb-1">Issuer:</div>
                                  <div className="font-mono text-xs bg-muted/50 p-2 rounded">
                                    {cert.issuer}
                                  </div>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Valid From:</span>
                                  <span>{formatDate(cert.validFrom)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Valid To:</span>
                                  <span className={isExpiring ? "text-yellow-600 font-medium" : ""}>
                                    {formatDate(cert.validTo)}
                                  </span>
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
                                  <span className="text-muted-foreground">Documents signed:</span>
                                  <span>{cert.documents.length}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Total usage:</span>
                                  <span>{cert.usageCount}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Last used:</span>
                                  <span>{formatDate(cert.lastUsed)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Trusted:</span>
                                  <span className={cert.isTrusted ? "text-green-600" : "text-red-600"}>
                                    {cert.isTrusted ? 'Yes' : 'No'}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Active:</span>
                                  <span className={cert.isActive ? "text-green-600" : "text-red-600"}>
                                    {cert.isActive ? 'Yes' : 'No'}
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
      {filteredCertificates.length === 0 && (
        <Card className="flex flex-col items-center justify-center py-12">
          <CardContent className="text-center">
            <FileBadge className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No certificates found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || selectedType !== 'All' || selectedStatus !== 'All'
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by creating your first certificate'
              }
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Certificate
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
