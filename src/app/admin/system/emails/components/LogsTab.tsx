'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Eye, ExternalLink, CheckCircle, XCircle } from 'lucide-react';
import type { EmailLog } from '../lib/types';
import { formatDate } from '../lib/utils';
import { getDeliveryStatusIcon } from '../lib/statusIcons';

interface LogsTabProps {
  logs: EmailLog[];
  searchQuery: string;
  statusFilter: string;
  onSearch: (query: string) => void;
  onStatusFilter: (status: string) => void;
}

export default function LogsTab({
  logs,
  searchQuery,
  statusFilter,
  onSearch,
  onStatusFilter
}: LogsTabProps) {
  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search logs..."
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
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="bounced">Bounced</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 text-sm font-medium">Status</th>
                  <th className="text-left p-4 text-sm font-medium">Recipient</th>
                  <th className="text-left p-4 text-sm font-medium">Subject</th>
                  <th className="text-left p-4 text-sm font-medium">Campaign</th>
                  <th className="text-left p-4 text-sm font-medium">Opened</th>
                  <th className="text-left p-4 text-sm font-medium">Clicked</th>
                  <th className="text-left p-4 text-sm font-medium">Delivery Time</th>
                  <th className="text-left p-4 text-sm font-medium">Timestamp</th>
                  <th className="text-left p-4 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b hover:bg-muted/30">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getDeliveryStatusIcon(log.status)}
                        <Badge variant={
                          log.status === 'delivered' ? 'default' :
                          log.status === 'bounced' ? 'secondary' : 'destructive'
                        }>
                          {log.status}
                        </Badge>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-medium">{log.recipient}</div>
                      {log.bounceReason && (
                        <div className="text-xs text-red-500">{log.bounceReason}</div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="text-sm">{log.subject}</div>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline">{log.campaign}</Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        {log.opened ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="text-sm">{log.opened ? 'Yes' : 'No'}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        {log.clicked ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="text-sm">{log.clicked ? 'Yes' : 'No'}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm">{log.deliveryTime}s</span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-muted-foreground">
                        {formatDate(log.timestamp)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
