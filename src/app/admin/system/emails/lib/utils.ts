/**
 * Utility functions for Email Management module
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
 * Format a number with thousand separators
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Get CSS color class for campaign/template status
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'active': return 'text-green-500';
    case 'scheduled': return 'text-blue-500';
    case 'draft': return 'text-yellow-500';
    case 'completed': return 'text-gray-500';
    case 'paused': return 'text-orange-500';
    default: return 'text-gray-500';
  }
}
