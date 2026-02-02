/**
 * Export utilities for admin pages
 * Supports exporting data to CSV format with selected items filtering
 */

export interface ExportOptions {
    filename: string;
    columns: { key: string; header: string }[];
}

/**
 * Convert array of objects to CSV string
 */
export function objectsToCSV<T extends Record<string, any>>(
    data: T[],
    columns: { key: string; header: string }[]
): string {
    // Header row
    const headerRow = columns.map(col => `"${col.header}"`).join(',');

    // Data rows
    const dataRows = data.map(item =>
        columns.map(col => {
            const value = getNestedValue(item, col.key);
            // Escape quotes and wrap in quotes
            const stringValue = value != null ? String(value) : '';
            return `"${stringValue.replace(/"/g, '""')}"`;
        }).join(',')
    );

    return [headerRow, ...dataRows].join('\n');
}

/**
 * Get nested object value using dot notation
 */
function getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) =>
        current && current[key] !== undefined ? current[key] : null, obj
    );
}

/**
 * Trigger browser download of CSV file
 */
export function downloadCSV(csvContent: string, filename: string): void {
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}

/**
 * Export data to CSV and trigger download
 */
export function exportToCSV<T extends Record<string, any>>(
    data: T[],
    options: ExportOptions
): void {
    const csvContent = objectsToCSV(data, options.columns);
    downloadCSV(csvContent, options.filename);
}

/**
 * Export selected items from a list
 */
export function exportSelected<T extends { id: string }>(
    allData: T[],
    selectedIds: string[],
    options: ExportOptions
): void {
    const selectedData = allData.filter(item => selectedIds.includes(item.id));
    exportToCSV(selectedData, options);
}

// Pre-defined column configurations for admin pages
export const USER_EXPORT_COLUMNS = [
    { key: 'username', header: 'Username' },
    { key: 'email', header: 'Email' },
    { key: 'displayName', header: 'Display Name' },
    { key: 'firstName', header: 'First Name' },
    { key: 'lastName', header: 'Last Name' },
    { key: 'status', header: 'Status' },
    { key: 'emailVerified', header: 'Email Verified' },
    { key: 'createdAt', header: 'Created At' },
];

export const ROLE_EXPORT_COLUMNS = [
    { key: 'name', header: 'Role Name' },
    { key: 'description', header: 'Description' },
    { key: 'userCount', header: 'User Count' },
    { key: 'createdAt', header: 'Created At' },
];

export const GROUP_EXPORT_COLUMNS = [
    { key: 'name', header: 'Group Name' },
    { key: 'description', header: 'Description' },
    { key: 'userCount', header: 'User Count' },
    { key: 'createdAt', header: 'Created At' },
];
