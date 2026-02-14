'use client';

import { CheckCircle, Clock, Edit, Archive, Pause, Info, MailCheck, MailX, XCircle, Mail } from 'lucide-react';

/**
 * Get icon component for campaign/template status indicator
 */
export function getStatusIcon(status: string) {
  switch (status) {
    case 'active':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'scheduled':
      return <Clock className="h-4 w-4 text-blue-500" />;
    case 'draft':
      return <Edit className="h-4 w-4 text-yellow-500" />;
    case 'completed':
      return <Archive className="h-4 w-4 text-gray-500" />;
    case 'paused':
      return <Pause className="h-4 w-4 text-orange-500" />;
    default:
      return <Info className="h-4 w-4 text-gray-500" />;
  }
}

/**
 * Get icon component for email delivery status indicator
 */
export function getDeliveryStatusIcon(status: string) {
  switch (status) {
    case 'sent':
      return <MailCheck className="h-4 w-4 text-green-500" />;
    case 'queued':
      return <Clock className="h-4 w-4 text-blue-500" />;
    case 'failed':
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Mail className="h-4 w-4 text-gray-500" />;
  }
}
