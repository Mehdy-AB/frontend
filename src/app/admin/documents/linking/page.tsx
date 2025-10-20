'use client';

import { useState, useEffect } from 'react';
import { 
  Link2, 
  Plus, 
  Search, 
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Play,
  Pause,
  Settings,
  Eye,
  EyeOff
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
import { Separator } from '@/components/ui/separator';
import { DocumentService } from '@/api/services/documentService';
import { LinkRuleResponseDto, LinkRuleRequestDto } from '@/types/api';
import { useLanguage } from '../../../../contexts/LanguageContext';

export default function LinkRulesManagementPage() {
  const { t } = useLanguage();
  const [linkRules, setLinkRules] = useState<LinkRuleResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedRules, setSelectedRules] = useState<number[]>([]);

  // Fetch link rules
  const fetchLinkRules = async () => {
    try {
      setLoading(true);
      setError(null);
      const rulesData = await DocumentService.getAllLinkRules();
      console.log('API Response:', rulesData, 'Type:', typeof rulesData, 'Is Array:', Array.isArray(rulesData));
      // Ensure we always set an array, even if the API returns null/undefined
      setLinkRules(Array.isArray(rulesData) ? rulesData : []);
    } catch (err: any) {
      console.error('Error fetching link rules:', err);
      setError(err.message || 'Failed to load link rules');
      // Set empty array on error to prevent filter issues
      setLinkRules([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinkRules();
  }, []);

  // Filter rules based on search and status
  const filteredRules = (Array.isArray(linkRules) ? linkRules : []).filter(rule => {
    const matchesSearch = rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         rule.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         rule.linkType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && rule.enabled) ||
                         (filterStatus === 'inactive' && !rule.enabled);
    return matchesSearch && matchesStatus;
  });

  const handleCreateRule = async (ruleData: LinkRuleRequestDto) => {
    try {
      const newRule = await DocumentService.createLinkRule(ruleData);
      setLinkRules(prev => Array.isArray(prev) ? [...prev, newRule] : [newRule]);
    } catch (error) {
      console.error('Error creating link rule:', error);
      throw error;
    }
  };

  const handleUpdateRule = async (ruleId: number, ruleData: LinkRuleRequestDto) => {
    try {
      const updatedRule = await DocumentService.updateLinkRule(ruleId, ruleData);
      setLinkRules(prev => Array.isArray(prev) ? prev.map(rule => rule.id === ruleId ? updatedRule : rule) : []);
    } catch (error) {
      console.error('Error updating link rule:', error);
      throw error;
    }
  };

  const handleDeleteRule = async (ruleId: number) => {
    if (!confirm('Are you sure you want to delete this link rule?')) return;
    
    try {
      // Use the available method or fallback to toggle if delete is not available
      if (DocumentService.deleteLinkRule) {
        await DocumentService.deleteLinkRule(ruleId);
      } else {
        // Fallback: disable the rule instead of deleting
        await DocumentService.toggleLinkRule(ruleId, false);
      }
      setLinkRules(prev => Array.isArray(prev) ? prev.filter(rule => rule.id !== ruleId) : []);
    } catch (error) {
      console.error('Error deleting link rule:', error);
      alert('Failed to delete link rule. Please try again.');
    }
  };

  const handleToggleRule = async (ruleId: number, enabled: boolean) => {
    try {
      // Use the available methods or fallback to toggle
      if (DocumentService.enableLinkRule && DocumentService.disableLinkRule) {
        if (enabled) {
          await DocumentService.enableLinkRule(ruleId);
        } else {
          await DocumentService.disableLinkRule(ruleId);
        }
      } else {
        // Fallback to toggle method
        await DocumentService.toggleLinkRule(ruleId, enabled);
      }
      setLinkRules(prev => Array.isArray(prev) ? prev.map(rule => 
        rule.id === ruleId ? { ...rule, enabled } : rule
      ) : []);
    } catch (error) {
      console.error('Error toggling link rule:', error);
      alert('Failed to update link rule status. Please try again.');
    }
  };

  const toggleSelectRule = (ruleId: number) => {
    setSelectedRules(prev =>
      prev.includes(ruleId)
        ? prev.filter(id => id !== ruleId)
        : [...prev, ruleId]
    );
  };

  if (loading) {
    return <LinkRulesSkeleton />;
  }

  if (error) {
    return (
      <Card className="flex flex-col items-center justify-center py-12">
        <CardContent className="text-center">
          <div className="text-destructive text-lg mb-4">{error}</div>
          <Button onClick={() => fetchLinkRules()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Link Rules Management</h1>
          <p className="text-muted-foreground">Manage automatic document linking rules</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Rule
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search rules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={filterStatus} onValueChange={(value: 'all' | 'active' | 'inactive') => setFilterStatus(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rules</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {selectedRules.length} selected
          </span>
          {selectedRules.length > 0 && (
            <>
              <Button variant="outline" size="sm">
                Enable Selected
              </Button>
              <Button variant="outline" size="sm">
                Disable Selected
              </Button>
              <Button variant="destructive" size="sm">
                Delete Selected
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Rules List */}
      <div className="space-y-4">
        {filteredRules.map((rule) => (
          <Card key={rule.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Link2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{rule.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{rule.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    className="rounded border-ui"
                    checked={selectedRules.includes(rule.id)}
                    onChange={() => toggleSelectRule(rule.id)}
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        Configure
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        variant="destructive"
                        onClick={() => handleDeleteRule(rule.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Rule Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Link Type</label>
                    <p className="text-sm">{rule.linkType}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Conditions</label>
                    <p className="text-sm">{rule.conditions.length} condition(s)</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Active Links</label>
                    <p className="text-sm">{rule.activeLinksCount || 0}</p>
                  </div>
                </div>

                {/* Status and Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                      {rule.enabled ? 'Active' : 'Inactive'}
                    </Badge>
                    {rule.bidirectional && (
                      <Badge variant="outline">Bidirectional</Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleRule(rule.id, !rule.enabled)}
                    >
                      {rule.enabled ? (
                        <>
                          <Pause className="h-4 w-4 mr-2" />
                          Disable
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Enable
                        </>
                      )}
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Configure
                    </Button>
                  </div>
                </div>

                {/* Created Info */}
                <div className="text-xs text-muted-foreground">
                  Created by {rule.createdBy.firstName} {rule.createdBy.lastName} on{' '}
                  {new Date(rule.createdAt).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRules.length === 0 && (
        <Card className="flex flex-col items-center justify-center py-12">
          <CardContent className="text-center">
            <Link2 className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No link rules found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || filterStatus !== 'all' 
                ? 'No rules match your current filters.' 
                : 'Create your first link rule to get started.'
              }
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Rule
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Loading Skeleton
function LinkRulesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="h-8 bg-muted rounded w-64 animate-pulse shimmer mb-2"></div>
          <div className="h-4 bg-muted rounded w-96 animate-pulse shimmer"></div>
        </div>
        <div className="h-10 bg-muted rounded w-32 animate-pulse shimmer"></div>
      </div>

      <div className="flex gap-4">
        <div className="h-10 bg-muted rounded w-64 animate-pulse shimmer"></div>
        <div className="h-10 bg-muted rounded w-32 animate-pulse shimmer"></div>
      </div>

      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-muted rounded-full shimmer"></div>
                  <div>
                    <div className="h-6 bg-muted rounded w-48 shimmer mb-2"></div>
                    <div className="h-4 bg-muted rounded w-64 shimmer"></div>
                  </div>
                </div>
                <div className="h-8 w-8 bg-muted rounded shimmer"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="h-4 bg-muted rounded w-24 shimmer"></div>
                  <div className="h-4 bg-muted rounded w-32 shimmer"></div>
                  <div className="h-4 bg-muted rounded w-20 shimmer"></div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-6 bg-muted rounded w-16 shimmer"></div>
                  <div className="flex gap-2">
                    <div className="h-8 bg-muted rounded w-20 shimmer"></div>
                    <div className="h-8 bg-muted rounded w-24 shimmer"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}


