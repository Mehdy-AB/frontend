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
  Fingerprint,
  Loader2
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
import { certificateService } from '@/api/services/certificateService';
import { CertificateResponse } from '@/types/api';
import { useNotifications } from '@/hooks/useNotifications';

const certificateTypes = ['All', 'ROOT_CA', 'INTERMEDIATE_CA', 'PERSONAL', 'ORGANIZATION', 'CODE_SIGNING', 'DOCUMENT_SIGNING'];
const statuses = ['All', 'VALID', 'EXPIRED', 'REVOKED', 'SUSPENDED', 'PENDING'];

export default function DigitalSignaturePage() {
  const { t } = useLanguage();
  const { showSuccess, showError } = useNotifications();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [certificates, setCertificates] = useState<CertificateResponse[]>([]);
  const [filteredCertificates, setFilteredCertificates] = useState<CertificateResponse[]>([]);
  const [selectedType, setSelectedType] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [loading, setLoading] = useState(false);
  const [expandedCertificates, setExpandedCertificates] = useState<number[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pageSize] = useState(20);

  // Fetch certificates from API
  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const response = await certificateService.getAllCertificates(page, pageSize);
      setCertificates(response.content);
      setFilteredCertificates(response.content);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Failed to fetch certificates:', error);
      showError('Failed to Load Certificates', 'Unable to load certificates. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchCertificates();
  }, [page, pageSize]);

  // Filter certificates based on search, type, and status
  useEffect(() => {
    let filtered = certificates;

    if (searchQuery) {
      filtered = filtered.filter(cert => 
        cert.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cert.description && cert.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        cert.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cert.issuer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cert.serialNumber.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedType !== 'All') {
      filtered = filtered.filter(cert => cert.certificateType === selectedType);
    }

    if (selectedStatus !== 'All') {
      filtered = filtered.filter(cert => cert.status === selectedStatus);
    }

    setFilteredCertificates(filtered);
  }, [searchQuery, selectedType, selectedStatus, certificates]);

  const handleToggleExpand = (id: number) => {
    setExpandedCertificates(prev =>
      prev.includes(id)
        ? prev.filter(certId => certId !== id)
        : [...prev, id]
    );
  };

  const handleToggleActive = async (id: number) => {
    try {
      await certificateService.toggleCertificateActive(id);
      showSuccess('Status Updated', 'Certificate status has been updated successfully');
      fetchCertificates();
    } catch (error) {
      console.error('Failed to toggle certificate status:', error);
      showError('Update Failed', 'Failed to update certificate status. Please try again.');
    }
  };

  const handleRevokeCertificate = async (id: number) => {
    try {
      await certificateService.revokeCertificate(id, {
        reason: 'Revoked by administrator'
      });
      showSuccess('Certificate Revoked', 'The certificate has been revoked successfully');
      fetchCertificates();
    } catch (error) {
      console.error('Failed to revoke certificate:', error);
      showError('Revocation Failed', 'Failed to revoke certificate. Please try again.');
    }
  };

  const handleDeleteCertificate = async (id: number) => {
    if (!confirm('Are you sure you want to delete this certificate? This action cannot be undone.')) {
      return;
    }

    try {
      await certificateService.deleteCertificate(id);
      showSuccess('Certificate Deleted', 'The certificate has been deleted successfully');
      fetchCertificates();
    } catch (error: any) {
      console.error('Failed to delete certificate:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete certificate. Please try again.';
      showError('Deletion Failed', errorMessage);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'VALID':
        return 'default';
      case 'EXPIRED':
        return 'secondary';
      case 'REVOKED':
        return 'destructive';
      case 'SUSPENDED':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'VALID':
        return <CheckCircle className="w-4 h-4" />;
      case 'EXPIRED':
        return <Clock className="w-4 h-4" />;
      case 'REVOKED':
        return <XCircle className="w-4 h-4" />;
      case 'SUSPENDED':
        return <Pause className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateStats = () => {
    const total = certificates.length;
    const valid = certificates.filter(c => c.status === 'VALID').length;
    const expired = certificates.filter(c => c.status === 'EXPIRED').length;
    const revoked = certificates.filter(c => c.status === 'REVOKED').length;
    const totalUsage = certificates.reduce((sum, c) => sum + c.usageCount, 0);

    return { total, valid, expired, revoked, totalUsage };
  };

  const stats = calculateStats();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8 text-primary" />
            Digital Certificates
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage digital certificates for document signing and verification
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Certificate
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Certificates</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileBadge className="w-8 h-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valid</p>
                <p className="text-2xl font-bold text-green-600">{stats.valid}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expired</p>
                <p className="text-2xl font-bold text-orange-600">{stats.expired}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revoked</p>
                <p className="text-2xl font-bold text-red-600">{stats.revoked}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Usage</p>
                <p className="text-2xl font-bold">{stats.totalUsage}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search certificates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Certificate Type" />
              </SelectTrigger>
              <SelectContent>
                {certificateTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Certificates List */}
      {loading ? (
        <Card>
          <CardContent className="p-8 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-2">Loading certificates...</span>
          </CardContent>
        </Card>
      ) : filteredCertificates.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 mx-auto text-muted-foreground opacity-50 mb-4" />
            <p className="text-lg font-medium">No certificates found</p>
            <p className="text-muted-foreground mt-1">Try adjusting your filters or add a new certificate</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredCertificates.map((cert) => (
            <Card key={cert.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="mt-1">
                      {cert.isActive ? (
                        <Lock className="w-5 h-5 text-green-600" />
                      ) : (
                        <Unlock className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{cert.name}</h3>
                        <Badge variant={getStatusBadgeVariant(cert.status)} className="flex items-center gap-1">
                          {getStatusIcon(cert.status)}
                          {cert.status}
                        </Badge>
                        {cert.isTrusted && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Trusted
                          </Badge>
                        )}
                      </div>
                      {cert.description && (
                        <p className="text-sm text-muted-foreground mb-2">{cert.description}</p>
                      )}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Type:</span>
                          <span className="ml-2 font-medium">{cert.certificateType}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Algorithm:</span>
                          <span className="ml-2 font-medium">{cert.algorithm}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Key Size:</span>
                          <span className="ml-2 font-medium">{cert.keySize} bit</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Usage:</span>
                          <span className="ml-2 font-medium">{cert.usageCount} times</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleExpand(cert.id)}
                    >
                      {expandedCertificates.includes(cert.id) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleActive(cert.id)}>
                          {cert.isActive ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                          {cert.isActive ? 'Deactivate' : 'Activate'}
                        </DropdownMenuItem>
                        {cert.status === 'VALID' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleRevokeCertificate(cert.id)}
                              className="text-orange-600"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Revoke
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteCertificate(cert.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {expandedCertificates.includes(cert.id) && (
                  <div className="border-t bg-muted/30 p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium mb-1">Issuer</p>
                        <p className="text-muted-foreground break-all">{cert.issuer}</p>
                      </div>
                      <div>
                        <p className="font-medium mb-1">Subject</p>
                        <p className="text-muted-foreground break-all">{cert.subject}</p>
                      </div>
                      <div>
                        <p className="font-medium mb-1">Serial Number</p>
                        <p className="text-muted-foreground font-mono text-xs break-all">{cert.serialNumber}</p>
                      </div>
                      <div>
                        <p className="font-medium mb-1">Thumbprint</p>
                        <p className="text-muted-foreground font-mono text-xs break-all">{cert.thumbprint}</p>
                      </div>
                      <div>
                        <p className="font-medium mb-1">Valid From</p>
                        <p className="text-muted-foreground">{formatDate(cert.validFrom)}</p>
                      </div>
                      <div>
                        <p className="font-medium mb-1">Valid To</p>
                        <p className="text-muted-foreground">{formatDate(cert.validTo)}</p>
                      </div>
                      {cert.owner && (
                        <div>
                          <p className="font-medium mb-1">Owner</p>
                          <p className="text-muted-foreground">{cert.owner.displayName || cert.owner.username}</p>
                        </div>
                      )}
                      {cert.lastUsedAt && (
                        <div>
                          <p className="font-medium mb-1">Last Used</p>
                          <p className="text-muted-foreground">{formatDate(cert.lastUsedAt)}</p>
                        </div>
                      )}
                    </div>
                    {cert.revocationReason && (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                        <p className="font-medium text-red-800 dark:text-red-200 mb-1">Revocation Reason</p>
                        <p className="text-sm text-red-700 dark:text-red-300">{cert.revocationReason}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
