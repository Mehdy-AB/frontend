'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Eye, ExternalLink, CheckCircle, XCircle, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import type { EmailLog } from '../lib/types';
import { formatDate } from '../lib/utils';
import { getDeliveryStatusIcon } from '../lib/statusIcons';

interface LogsTabProps {
  logs: EmailLog[];
  searchQuery: string;
  statusFilter: string;
  onSearch: (query: string) => void;
  onStatusFilter: (status: string) => void;
  // Infinite scroll props
  loadMoreLogs?: () => void;
  hasMoreLogs?: boolean;
  loadingMoreLogs?: boolean;
}

// Export logs to CSV - returns success status and message
const exportToCSV = (logs: EmailLog[]): { success: boolean; message: string } => {
  if (logs.length === 0) {
    return { success: false, message: 'No logs to export' };
  }

  try {
    const headers = ['ID', 'Recipient', 'Subject', 'Campaign', 'Status', 'Clicked', 'Delivery Time (s)', 'Timestamp'];
    const csvContent = [
      headers.join(','),
      ...logs.map(log => [
        log.id,
        `"${log.recipient?.replace(/"/g, '""') || ''}"`,
        `"${log.subject?.replace(/"/g, '""') || ''}"`,
        `"${log.campaign?.replace(/"/g, '""') || ''}"`,
        log.status,
        log.clicked ? 'Yes' : 'No',
        log.deliveryTime || 0,
        log.timestamp || log.sentAt || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `email_logs_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return { success: true, message: `Successfully exported ${logs.length} logs` };
  } catch (error) {
    return { success: false, message: 'Failed to export logs' };
  }
};

export default function LogsTab({
  logs,
  searchQuery,
  statusFilter,
  onSearch,
  onStatusFilter,
  loadMoreLogs,
  hasMoreLogs = false,
  loadingMoreLogs = false
}: LogsTabProps) {
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [viewLog, setViewLog] = useState<EmailLog | null>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Infinite scroll detection
  const handleScroll = useCallback(() => {
    if (!tableContainerRef.current || !loadMoreLogs || !hasMoreLogs || loadingMoreLogs) return;

    const { scrollTop, scrollHeight, clientHeight } = tableContainerRef.current;
    // Load more when user scrolls to within 100px of the bottom
    if (scrollHeight - scrollTop - clientHeight < 100) {
      loadMoreLogs();
    }
  }, [loadMoreLogs, hasMoreLogs, loadingMoreLogs]);

  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const handleOpenExternal = (log: EmailLog) => {
    if (!log.bodyHtml) {
      setNotification({ type: 'error', message: 'No content available for this log' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    const blob = new Blob([log.bodyHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const handleExport = () => {
    const result = exportToCSV(logs);
    setNotification({ type: result.success ? 'success' : 'error', message: result.message });
    // Auto-dismiss after 3 seconds
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Export Notification */}
      {notification && (
        <div
          className={`flex items-center gap-3 p-4 rounded-lg border ${notification.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
            : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
            }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
          )}
          <span className="font-medium">{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="ml-auto text-current opacity-70 hover:opacity-100"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      )}

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
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="queued">Queued</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent className="p-0">
          <div
            ref={tableContainerRef}
            className="overflow-x-auto overflow-y-auto max-h-[600px]"
          >
            <table className="w-full">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="text-left p-4 text-sm font-medium">Status</th>
                  <th className="text-left p-4 text-sm font-medium">Recipient</th>
                  <th className="text-left p-4 text-sm font-medium">Subject</th>
                  <th className="text-left p-4 text-sm font-medium">Campaign</th>
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
                          log.status === 'sent' ? 'default' :
                            log.status === 'queued' ? 'secondary' : 'destructive'
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
                        {formatDate(log.timestamp || '')}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewLog(log)}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenExternal(log)}
                          disabled={!log.bodyHtml}
                          title="Open Message in New Tab"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Loading indicator for infinite scroll */}
            {loadingMoreLogs && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Loading more...</span>
              </div>
            )}
            {!hasMoreLogs && logs.length > 0 && (
              <div className="text-center py-4 text-sm text-muted-foreground">
                All logs loaded ({logs.length} total)
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* View Log Details Dialog */}
      <Dialog open={!!viewLog} onOpenChange={(open) => !open && setViewLog(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Email Log Details</DialogTitle>
            <DialogDescription>
              Sent to {viewLog?.recipient} on {viewLog?.timestamp ? formatDate(viewLog.timestamp) : 'Unknown Date'}
            </DialogDescription>
          </DialogHeader>

          {viewLog && (
            <div className="flex-1 overflow-hidden flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-muted-foreground">Subject:</span>
                  <p className="mt-1">{viewLog.subject}</p>
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground">Status:</span>
                  <div className="mt-1 flex items-center gap-2">
                    {getDeliveryStatusIcon(viewLog.status)}
                    <span className="capitalize">{viewLog.status}</span>
                  </div>
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground">Campaign:</span>
                  <p className="mt-1">{viewLog.campaign}</p>
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground">Log ID:</span>
                  <p className="mt-1 font-mono text-xs">{viewLog.id}</p>
                </div>
              </div>

              {viewLog.bounceReason && (
                <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-md">
                  <span className="font-semibold text-red-800 dark:text-red-300 block mb-1">Error Message:</span>
                  <p className="text-sm text-red-700 dark:text-red-400">{viewLog.bounceReason}</p>
                </div>
              )}

              <div className="flex-1 flex flex-col min-h-0 border rounded-md overflow-hidden bg-white">
                <div className="p-2 bg-muted border-b text-xs font-medium text-muted-foreground flex justify-between items-center">
                  <span>Message Content Preview</span>
                  <span className="text-[10px] uppercase tracking-wider opacity-70">HTML View</span>
                </div>
                {/* Always use white background for email content as most emails are designed for it */}
                <ScrollArea className="flex-1 bg-white h-[400px]">
                  <div className="p-4">
                    <div
                      className="prose max-w-none text-sm text-black"
                      dangerouslySetInnerHTML={{ __html: viewLog.bodyHtml || '<p class="text-gray-500 italic">No content available</p>' }}
                    />
                  </div>
                </ScrollArea>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => handleOpenExternal(viewLog)}
                  className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 transition-colors"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in New Tab
                </Button>
                <Button variant="default" onClick={() => setViewLog(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div >
  );
}
