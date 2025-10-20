'use client';

import React, { useState, useEffect } from 'react';
import { 
  Stamp, 
  Plus, 
  Search, 
  Edit,
  Trash2,
  Filter,
  MoreVertical,
  ChevronDown,
  ChevronRight,
  FileText,
  Image,
  Calendar,
  Users,
  Eye,
  EyeOff,
  Settings,
  Download,
  Upload,
  Palette,
  Type,
  Move,
  Copy,
  BarChart3,
  Clock
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
const mockStamps = [
  {
    id: '1',
    name: 'Approved',
    description: 'Standard approval stamp for documents',
    type: 'Text',
    content: 'APPROVED',
    color: '#10b981',
    backgroundColor: '#d1fae5',
    borderColor: '#10b981',
    fontSize: 24,
    fontFamily: 'Arial',
    fontWeight: 'bold',
    position: 'Bottom Right',
    opacity: 0.8,
    isActive: true,
    usageCount: 234,
    createdBy: 'Admin User',
    createdAt: '2024-01-15T10:30:00Z',
    lastUsed: '2024-01-20T14:22:00Z',
    category: 'Approval',
    size: { width: 120, height: 60 },
    rotation: 0,
    documents: ['doc-001', 'doc-002', 'doc-003']
  },
  {
    id: '2',
    name: 'Confidential',
    description: 'Confidential document stamp',
    type: 'Text',
    content: 'CONFIDENTIAL',
    color: '#ef4444',
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
    fontSize: 20,
    fontFamily: 'Arial',
    fontWeight: 'bold',
    position: 'Top Center',
    opacity: 0.9,
    isActive: true,
    usageCount: 156,
    createdBy: 'Admin User',
    createdAt: '2024-01-10T09:15:00Z',
    lastUsed: '2024-01-19T16:45:00Z',
    category: 'Security',
    size: { width: 150, height: 40 },
    rotation: 0,
    documents: ['doc-004', 'doc-005']
  },
  {
    id: '3',
    name: 'Draft',
    description: 'Draft document watermark',
    type: 'Text',
    content: 'DRAFT',
    color: '#6b7280',
    backgroundColor: 'transparent',
    borderColor: '#6b7280',
    fontSize: 48,
    fontFamily: 'Arial',
    fontWeight: 'normal',
    position: 'Center',
    opacity: 0.3,
    isActive: true,
    usageCount: 89,
    createdBy: 'Admin User',
    createdAt: '2024-01-05T11:20:00Z',
    lastUsed: '2024-01-18T12:15:00Z',
    category: 'Status',
    size: { width: 200, height: 80 },
    rotation: -45,
    documents: ['doc-006', 'doc-007']
  },
  {
    id: '4',
    name: 'Company Logo',
    description: 'Company logo stamp for official documents',
    type: 'Image',
    content: '/logo.svg',
    color: '#3b82f6',
    backgroundColor: 'transparent',
    borderColor: '#3b82f6',
    fontSize: 0,
    fontFamily: '',
    fontWeight: 'normal',
    position: 'Top Left',
    opacity: 1.0,
    isActive: true,
    usageCount: 445,
    createdBy: 'Admin User',
    createdAt: '2024-01-01T08:00:00Z',
    lastUsed: '2024-01-21T09:30:00Z',
    category: 'Branding',
    size: { width: 100, height: 100 },
    rotation: 0,
    documents: ['doc-008', 'doc-009', 'doc-010']
  },
  {
    id: '5',
    name: 'Expired',
    description: 'Expired document stamp',
    type: 'Text',
    content: 'EXPIRED',
    color: '#f59e0b',
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
    fontSize: 22,
    fontFamily: 'Arial',
    fontWeight: 'bold',
    position: 'Bottom Left',
    opacity: 0.85,
    isActive: false,
    usageCount: 23,
    createdBy: 'Admin User',
    createdAt: '2024-01-12T13:45:00Z',
    lastUsed: '2024-01-17T11:20:00Z',
    category: 'Status',
    size: { width: 130, height: 50 },
    rotation: 0,
    documents: ['doc-011']
  }
];

const categories = ['All', 'Approval', 'Security', 'Status', 'Branding', 'Custom'];
const stampTypes = ['Text', 'Image', 'Shape'];
const positions = ['Top Left', 'Top Center', 'Top Right', 'Center', 'Bottom Left', 'Bottom Center', 'Bottom Right'];

export default function DocumentStampsPage() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [stamps, setStamps] = useState(mockStamps);
  const [filteredStamps, setFilteredStamps] = useState(mockStamps);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [loading, setLoading] = useState(false);
  const [expandedStamps, setExpandedStamps] = useState<string[]>([]);

  // Filter stamps based on search, category, and type
  useEffect(() => {
    let filtered = stamps;

    if (searchQuery) {
      filtered = filtered.filter(stamp => 
        stamp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stamp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stamp.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(stamp => stamp.category === selectedCategory);
    }

    if (selectedType !== 'All') {
      filtered = filtered.filter(stamp => stamp.type === selectedType);
    }

    setFilteredStamps(filtered);
  }, [searchQuery, selectedCategory, selectedType, stamps]);

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleStampExpansion = (stampId: string) => {
    setExpandedStamps(prev =>
      prev.includes(stampId)
        ? prev.filter(id => id !== stampId)
        : [...prev, stampId]
    );
  };

  const toggleSelectStamp = (stampId: string) => {
    setSelectedItems(prev =>
      prev.includes(stampId)
        ? prev.filter(id => id !== stampId)
        : [...prev, stampId]
    );
  };

  const handleToggleActive = (stampId: string) => {
    setStamps(prev => prev.map(stamp => 
      stamp.id === stampId ? { ...stamp, isActive: !stamp.isActive } : stamp
    ));
  };

  const handleDeleteStamp = (stampId: string) => {
    if (confirm('Are you sure you want to delete this stamp?')) {
      setStamps(prev => prev.filter(stamp => stamp.id !== stampId));
      setSelectedItems(prev => prev.filter(id => id !== stampId));
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedItems.length} stamps?`)) {
      setStamps(prev => prev.filter(stamp => !selectedItems.includes(stamp.id)));
      setSelectedItems([]);
    }
  };

  const handleBulkToggleActive = () => {
    setStamps(prev => prev.map(stamp => 
      selectedItems.includes(stamp.id) ? { ...stamp, isActive: !stamp.isActive } : stamp
    ));
    setSelectedItems([]);
  };

  const handleDuplicateStamp = (stampId: string) => {
    const stamp = stamps.find(s => s.id === stampId);
    if (stamp) {
      const newStamp = {
        ...stamp,
        id: Date.now().toString(),
        name: `${stamp.name} (Copy)`,
        usageCount: 0,
        createdAt: new Date().toISOString(),
        lastUsed: new Date().toISOString(),
        documents: []
      };
      setStamps(prev => [...prev, newStamp]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Document Stamps</h1>
          <p className="text-muted-foreground">Manage document stamps and watermarks</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Stamp
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Stamps</p>
                <p className="text-2xl font-semibold">{stamps.length}</p>
              </div>
              <Stamp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Stamps</p>
                <p className="text-2xl font-semibold">{stamps.filter(s => s.isActive).length}</p>
              </div>
              <Eye className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Categories</p>
                <p className="text-2xl font-semibold">{categories.length - 1}</p>
              </div>
              <Palette className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Usage</p>
                <p className="text-2xl font-semibold">{stamps.reduce((sum, stamp) => sum + stamp.usageCount, 0)}</p>
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
              placeholder="Search stamps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Types</SelectItem>
              {stampTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select defaultValue="all">
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
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
                {stamps.find(s => selectedItems.includes(s.id) && s.isActive) ? 'Deactivate' : 'Activate'}
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

      {/* Stamps Table */}
      <Card>
        <div className="overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 w-8">
                  <input 
                    type="checkbox" 
                    className="rounded border-input"
                    checked={selectedItems.length === filteredStamps.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems(filteredStamps.map(stamp => stamp.id));
                      } else {
                        setSelectedItems([]);
                      }
                    }}
                  />
                </th>
                <th className="text-left p-4 text-sm font-medium">Stamp</th>
                <th className="text-left p-4 text-sm font-medium">Type</th>
                <th className="text-left p-4 text-sm font-medium">Category</th>
                <th className="text-left p-4 text-sm font-medium">Usage</th>
                <th className="text-left p-4 text-sm font-medium">Status</th>
                <th className="text-left p-4 text-sm font-medium">Last Used</th>
                <th className="text-left p-4 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStamps.map((stamp) => {
                const isExpanded = expandedStamps.includes(stamp.id);
                
                return (
                  <React.Fragment key={stamp.id}>
                    <tr className="border-b hover:bg-muted/30">
                      <td className="p-4">
                        <input 
                          type="checkbox" 
                          className="rounded border-input"
                          checked={selectedItems.includes(stamp.id)}
                          onChange={() => toggleSelectStamp(stamp.id)}
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => toggleStampExpansion(stamp.id)}
                            className="p-1 rounded hover:bg-muted transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                          <div className="relative">
                            {stamp.type === 'Image' ? (
                              <div className="w-12 h-12 bg-muted rounded border flex items-center justify-center">
                                <Image className="h-6 w-6 text-muted-foreground" />
                              </div>
                            ) : (
                              <div 
                                className="w-12 h-12 rounded border-2 flex items-center justify-center text-xs font-bold"
                                style={{ 
                                  backgroundColor: stamp.backgroundColor,
                                  borderColor: stamp.borderColor,
                                  color: stamp.color,
                                  opacity: stamp.opacity
                                }}
                              >
                                {stamp.content.length > 8 ? stamp.content.substring(0, 8) + '...' : stamp.content}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{stamp.name}</div>
                            <div className="text-sm text-muted-foreground">{stamp.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline">
                          {stamp.type === 'Text' ? <Type className="h-3 w-3 mr-1" /> : <Image className="h-3 w-3 mr-1" />}
                          {stamp.type}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant="secondary">{stamp.category}</Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{stamp.usageCount}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant={stamp.isActive ? "default" : "secondary"}>
                          {stamp.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-muted-foreground">
                          {formatDate(stamp.lastUsed)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(stamp.id)}
                            title={stamp.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {stamp.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="sm" title="Edit">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Duplicate" onClick={() => handleDuplicateStamp(stamp.id)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Settings">
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteStamp(stamp.id)}
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
                            {/* Stamp Details */}
                            <div>
                              <h4 className="font-medium mb-3 flex items-center gap-2">
                                <Stamp className="h-4 w-4" />
                                Stamp Information
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Created by:</span>
                                  <span>{stamp.createdBy}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Created at:</span>
                                  <span>{formatDate(stamp.createdAt)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Position:</span>
                                  <span>{stamp.position}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Size:</span>
                                  <span>{stamp.size.width}×{stamp.size.height}px</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Rotation:</span>
                                  <span>{stamp.rotation}°</span>
                                </div>
                              </div>
                            </div>

                            {/* Visual Properties */}
                            <div>
                              <h4 className="font-medium mb-3 flex items-center gap-2">
                                <Palette className="h-4 w-4" />
                                Visual Properties
                              </h4>
                              <div className="space-y-2 text-sm">
                                {stamp.type === 'Text' && (
                                  <>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Font:</span>
                                      <span>{stamp.fontFamily}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Size:</span>
                                      <span>{stamp.fontSize}px</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Weight:</span>
                                      <span>{stamp.fontWeight}</span>
                                    </div>
                                  </>
                                )}
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Color:</span>
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-4 h-4 rounded border"
                                      style={{ backgroundColor: stamp.color }}
                                    />
                                    <span className="font-mono text-xs">{stamp.color}</span>
                                  </div>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Background:</span>
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-4 h-4 rounded border"
                                      style={{ backgroundColor: stamp.backgroundColor }}
                                    />
                                    <span className="font-mono text-xs">{stamp.backgroundColor}</span>
                                  </div>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Opacity:</span>
                                  <span>{Math.round(stamp.opacity * 100)}%</span>
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
                                  <span className="text-muted-foreground">Documents stamped:</span>
                                  <span>{stamp.documents.length}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Total usage:</span>
                                  <span>{stamp.usageCount}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Last used:</span>
                                  <span>{formatDate(stamp.lastUsed)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Type:</span>
                                  <span>{stamp.type}</span>
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
      {filteredStamps.length === 0 && (
        <Card className="flex flex-col items-center justify-center py-12">
          <CardContent className="text-center">
            <Stamp className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No stamps found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || selectedCategory !== 'All' || selectedType !== 'All'
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by creating your first stamp'
              }
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Stamp
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
