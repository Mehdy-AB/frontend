export interface VariableDefinition {
    id?: number;
    workflowId?: number;
    variableKey: string;
    label: string;
    type: string;
    isRequired?: boolean;
    defaultValue?: any;
    createdAt?: string;
    updatedAt?: string;
}

export const VARIABLE_TYPES = [
    { value: 'STRING', label: 'Text (Single Line)' },
    { value: 'TEXT', label: 'Text (Multi Line)' },
    { value: 'EMAIL', label: 'Email' },
    { value: 'NUMBER', label: 'Number' },
    { value: 'DECIMAL', label: 'Decimal' },
    { value: 'BOOLEAN', label: 'Boolean' },
    { value: 'DATE', label: 'Date' },
    { value: 'TIME', label: 'Time' },
    { value: 'DATETIME', label: 'Date & Time' },
];

/**
 * Auto-generate a snake_case key from a label.
 * e.g. "Invoice Amount" → "invoice_amount"
 */
export function generateKeyFromLabel(label: string): string {
    return label
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s_]/g, '')
        .replace(/\s+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
}
