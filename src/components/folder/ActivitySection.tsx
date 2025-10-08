import React from 'react';
import { 
  History as HistoryIcon, 
  ChevronDown, 
  ChevronUp, 
  User 
} from 'lucide-react';
import { AuditLog } from '@/types/api';

interface ActivitySectionProps {
  showActivitySection: boolean;
  onToggleActivitySection: () => void;
  auditLogs: AuditLog[];
  isLoadingAuditLogs: boolean;
  formatDate: (dateString: string) => string;
  isLoading?: boolean;
}

export function ActivitySection({
  showActivitySection,
  onToggleActivitySection,
  auditLogs,
  isLoadingAuditLogs,
  formatDate,
  isLoading = false
}: ActivitySectionProps) {
  return (
    <div>
      <button
        onClick={onToggleActivitySection}
        className="flex items-center gap-2 w-full text-left hover:bg-white p-2 rounded-md transition-colors"
      >
        <h3 className="text-sm font-semibold text-gray-900">Recent Activity</h3>
        {showActivitySection ? (
          <ChevronUp className="h-4 w-4 text-gray-500 ml-auto" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500 ml-auto" />
        )}
      </button>
      
      {showActivitySection && (
        <div className="mt-4">
          {isLoading ? (
            // Initial loading skeleton
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-3 p-3 bg-white rounded-lg border border-gray-200">
                  <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                    <div className="h-2 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : isLoadingAuditLogs ? (
            // Refreshing loading skeleton
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-3 p-3 bg-white rounded-lg border border-gray-200">
                  <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                    <div className="h-2 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <HistoryIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No activity recorded yet</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {auditLogs.slice(0, 10).map((log) => (
                <div key={log.id} className="flex gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-gray-900 text-sm">{log.username}</span>
                      <span className="text-xs text-gray-500 ml-2">{formatDate(log.timestamp).split(',')[0]}</span>
                    </div>
                    <div className="text-gray-700 capitalize text-sm">{log.action}</div>
                    {log.details && (
                      <div className="text-xs text-gray-500 mt-1 line-clamp-2">{log.details}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
