/**
 * Format a date string or Date object to "23 Sep 2025, 15:45" format
 */
export function formatDate(date: string | Date | undefined | null): string {
  if (!date) return '-';

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
      return '-';
    }

    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
    const year = dateObj.getFullYear();
    const hours = dateObj.getHours().toString().padStart(2, '0');
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');

    return `${day} ${month} ${year}, ${hours}:${minutes}`;
  } catch (error) {
    return '-';
  }
}

/**
 * Format a date string or Date object to "09 Mar 2026" format (date only, no time)
 */
export function formatDateOnly(date: string | Date | undefined | null): string {
  if (!date) return '-';

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
      return '-';
    }

    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
    const year = dateObj.getFullYear();

    return `${day} ${month} ${year}`;
  } catch (error) {
    return '-';
  }
}
