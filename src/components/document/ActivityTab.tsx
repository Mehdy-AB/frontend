// components/document/ActivityTab.tsx
'use client';

import { History, User } from 'lucide-react';
import { DocumentViewDto } from '../../types/documentView';
import { AuditLog } from '../../types/api';
import { formatDate } from '../../utils/documentUtils';

interface ActivityTabProps {
  document: DocumentViewDto;
  auditLogs: AuditLog[];
  isLoading: boolean;
}

export default function ActivityTab({ document, auditLogs, isLoading }: ActivityTabProps) {
  if (isLoading) {
    return (
      <div className="p-4 space-y-6">
        <div className="animate-pulse">
          <div className="h-6 bg-neutral-ui rounded w-32 mb-4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="h-8 w-8 bg-neutral-ui rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-neutral-ui rounded w-3/4"></div>
                  <div className="h-3 bg-neutral-ui rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div>
        <h3 className="font-medium text-neutral-text-dark mb-3">Recent Activity</h3>
        {auditLogs.length === 0 ? (
          <div className="text-center py-8 text-neutral-text-light">
            <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No activity recorded yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {auditLogs.map((log) => (
              <div key={log.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="h-8 w-8 bg-primary-light rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 w-px bg-neutral-ui my-1"></div>
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium text-sm">{log.username}</span>
                    <span className="text-xs text-neutral-text-light">{formatDate(log.timestamp)}</span>
                  </div>
                  <div className="text-sm text-neutral-text-light capitalize">
                    {log.action || 'Activity'}
                  </div>
                  {log.details && (
                    <div className="text-xs text-neutral-text-light mt-1">
                      {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                    </div>
                  )}
                  {!log.action && log.details && (
                    <div className="text-sm text-neutral-text-dark mt-1">
                      {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Statistics */}
      <div>
        <h3 className="font-medium text-neutral-text-dark mb-3">Document Statistics</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-center p-3 bg-neutral-background rounded">
            <div className="font-semibold text-lg">{auditLogs.length}</div>
            <div className="text-neutral-text-light">Total Activities</div>
          </div>
          <div className="text-center p-3 bg-neutral-background rounded">
            <div className="font-semibold text-lg">
              {auditLogs.filter(log => 
                (log.action && log.action.toLowerCase().includes('view')) ||
                (log.details && log.details.toLowerCase().includes('view'))
              ).length}
            </div>
            <div className="text-neutral-text-light">Views</div>
          </div>
        </div>
      </div>
    </div>
  );
}
