'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Eye, Edit, MoreVertical, Play, Pause, Copy, Trash2 } from 'lucide-react';
import type { EmailCampaign } from '../lib/types';
import { formatDate, formatNumber } from '../lib/utils';

interface CampaignsTabProps {
  campaigns: EmailCampaign[];
  searchQuery: string;
  statusFilter: string;
  typeFilter: string;
  selectedItems: string[];
  onSearch: (query: string) => void;
  onStatusFilter: (status: string) => void;
  onTypeFilter: (type: string) => void;
  onSelectItem: (itemId: string) => void;
  onDeleteCampaign: (campaignId: string) => void;
}

export default function CampaignsTab({
  campaigns,
  searchQuery,
  statusFilter,
  typeFilter,
  selectedItems,
  onSearch,
  onStatusFilter,
  onTypeFilter,
  onSelectItem,
  onDeleteCampaign
}: CampaignsTabProps) {
  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => onSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={onStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={onTypeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="automated">Automated</SelectItem>
                <SelectItem value="newsletter">Newsletter</SelectItem>
                <SelectItem value="transactional">Transactional</SelectItem>
                <SelectItem value="announcement">Announcement</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns List */}
      <div className="space-y-4">
        {campaigns.map((campaign) => (
          <Card key={campaign.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    className="rounded border-input mt-1"
                    checked={selectedItems.includes(campaign.id)}
                    onChange={() => onSelectItem(campaign.id)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{campaign.name}</h3>
                      <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                        {campaign.status}
                      </Badge>
                      <Badge variant="outline">{campaign.type}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{campaign.subject}</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Recipients:</span>
                        <span className="ml-2 font-medium">{formatNumber(campaign.recipients)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Sent:</span>
                        <span className="ml-2 font-medium">{formatNumber(campaign.sent)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Delivered:</span>
                        <span className="ml-2 font-medium">{formatNumber(campaign.delivered)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Opened:</span>
                        <span className="ml-2 font-medium">{formatNumber(campaign.opened)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span>Created by {campaign.createdBy}</span>
                      <span>•</span>
                      <span>{formatDate(campaign.createdAt)}</span>
                      {campaign.lastSent && (
                        <>
                          <span>•</span>
                          <span>Last sent: {formatDate(campaign.lastSent)}</span>
                        </>
                      )}
                      {campaign.nextScheduled && (
                        <>
                          <span>•</span>
                          <span>Next: {formatDate(campaign.nextScheduled)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Play className="mr-2 h-4 w-4" />
                        Start Campaign
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Pause className="mr-2 h-4 w-4" />
                        Pause Campaign
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => onDeleteCampaign(campaign.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
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
                {selectedItems.length} campaigns selected
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Play className="h-4 w-4 mr-2" />
                  Start Selected
                </Button>
                <Button variant="outline" size="sm">
                  <Pause className="h-4 w-4 mr-2" />
                  Pause Selected
                </Button>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
