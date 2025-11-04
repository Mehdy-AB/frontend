'use client';

import { CheckCircle, AlertTriangle, Clock, Info } from 'lucide-react';

/**
 * Get icon component for email status indicator
 */
export function getStatusIcon(status: string) {
  switch (status) {
    case 'delivered':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'bounced':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case 'failed':
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    case 'pending':
      return <Clock className="h-4 w-4 text-blue-500" />;
    default:
      return <Info className="h-4 w-4 text-gray-500" />;
  }
}
