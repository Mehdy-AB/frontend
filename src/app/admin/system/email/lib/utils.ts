/**
 * Utility functions for Email Configuration module
 */

/**
 * Format a date string to a readable format
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Get CSS color class for email status
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'delivered': return 'text-green-500';
    case 'bounced': return 'text-yellow-500';
    case 'failed': return 'text-red-500';
    case 'pending': return 'text-blue-500';
    default: return 'text-gray-500';
  }
}
