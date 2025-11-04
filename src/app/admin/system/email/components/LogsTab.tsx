'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database } from 'lucide-react';
import type { EmailLog } from '../lib/types';
import { formatDate } from '../lib/utils';
import { getStatusIcon } from '../lib/statusIcon';
import { getStatusColor } from '../lib/utils';

interface LogsTabProps {
  emailLogs: EmailLog[];
}

export default function LogsTab({ emailLogs }: LogsTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Email Logs
          </CardTitle>
          <CardDescription>View email delivery logs and status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {emailLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No logs found
              </div>
            ) : (
              emailLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(log.status)}
                    <div>
                      <h4 className="font-medium">{log.subject}</h4>
                      <p className="text-sm text-muted-foreground">{log.recipient}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(log.timestamp)} • {log.deliveryTime}s • {log.template}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${getStatusColor(log.status)}`}>
                      {log.status}
                    </p>
                    {log.error && (
                      <p className="text-xs text-red-500 mt-1">{log.error}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
