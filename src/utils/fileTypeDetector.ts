/**
 * File Type Detector using Magic Numbers (File Signatures)
 * Detects actual file type by reading the first bytes of the file
 */

export interface FileTypeInfo {
    mimeType: string;
    extension: string;
    description: string;
}

// Magic number signatures for common file types
const FILE_SIGNATURES: Array<{
    signature: number[];
    offset: number;
    mimeType: string;
    extension: string;
    description: string;
}> = [
        // PDF
        { signature: [0x25, 0x50, 0x44, 0x46], offset: 0, mimeType: 'application/pdf', extension: 'pdf', description: 'PDF Document' },

        // Microsoft Office (DOCX, XLSX, PPTX) - ZIP-based formats
        { signature: [0x50, 0x4B, 0x03, 0x04], offset: 0, mimeType: 'application/vnd.openxmlformats-officedocument', extension: 'docx', description: 'Office Document' },

        // PNG
        { signature: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], offset: 0, mimeType: 'image/png', extension: 'png', description: 'PNG Image' },

        // JPEG
        { signature: [0xFF, 0xD8, 0xFF], offset: 0, mimeType: 'image/jpeg', extension: 'jpg', description: 'JPEG Image' },

        // GIF
        { signature: [0x47, 0x49, 0x46, 0x38], offset: 0, mimeType: 'image/gif', extension: 'gif', description: 'GIF Image' },

        // Old Office formats (DOC, XLS, PPT)
        { signature: [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1], offset: 0, mimeType: 'application/msword', extension: 'doc', description: 'Office Document (Legacy)' },

        // ZIP
        { signature: [0x50, 0x4B], offset: 0, mimeType: 'application/zip', extension: 'zip', description: 'ZIP Archive' },

        // Text files (UTF-8 BOM)
        { signature: [0xEF, 0xBB, 0xBF], offset: 0, mimeType: 'text/plain', extension: 'txt', description: 'Text File' },
    ];

/**
 * Read the first N bytes of a file
 */
async function readFileBytes(file: File, numBytes: number): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        const blob = file.slice(0, numBytes);

        reader.onload = () => {
            if (reader.result instanceof ArrayBuffer) {
                resolve(new Uint8Array(reader.result));
            } else {
                reject(new Error('Failed to read file as ArrayBuffer'));
            }
        };

        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(blob);
    });
}

/**
 * Check if bytes match a signature at a given offset
 */
function matchesSignature(bytes: Uint8Array, signature: number[], offset: number): boolean {
    if (bytes.length < offset + signature.length) {
        return false;
    }

    for (let i = 0; i < signature.length; i++) {
        if (bytes[offset + i] !== signature[i]) {
            return false;
        }
    }

    return true;
}

/**
 * Detect more specific Office format by checking internal structure
 */
async function detectOfficeType(file: File): Promise<FileTypeInfo | null> {
    try {
        // For ZIP-based Office files, we need to check the content
        // This is a simplified check - in production, you might want to use a library
        const fileName = file.name.toLowerCase();

        if (fileName.endsWith('.docx')) {
            return {
                mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                extension: 'docx',
                description: 'Word Document'
            };
        } else if (fileName.endsWith('.xlsx')) {
            return {
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                extension: 'xlsx',
                description: 'Excel Spreadsheet'
            };
        } else if (fileName.endsWith('.pptx')) {
            return {
                mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                extension: 'pptx',
                description: 'PowerPoint Presentation'
            };
        }

        // Default to docx if we can't determine
        return {
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            extension: 'docx',
            description: 'Office Document'
        };
    } catch {
        return null;
    }
}

/**
 * Detect file type from file content using magic numbers
 */
export async function detectFileType(file: File): Promise<FileTypeInfo | null> {
    try {
        // Read first 16 bytes (enough for most signatures)
        const bytes = await readFileBytes(file, 16);

        // Check against all known signatures
        for (const sig of FILE_SIGNATURES) {
            if (matchesSignature(bytes, sig.signature, sig.offset)) {
                // Special handling for Office formats
                if (sig.mimeType === 'application/vnd.openxmlformats-officedocument') {
                    const officeType = await detectOfficeType(file);
                    if (officeType) return officeType;
                }

                return {
                    mimeType: sig.mimeType,
                    extension: sig.extension,
                    description: sig.description
                };
            }
        }

        // If no signature matched, try to infer from MIME type provided by browser
        if (file.type) {
            const extension = file.name.split('.').pop()?.toLowerCase() || 'bin';
            return {
                mimeType: file.type,
                extension,
                description: 'Unknown File Type'
            };
        }

        return null;
    } catch (error) {
        console.error('Error detecting file type:', error);
        return null;
    }
}

/**
 * Validate if a MIME type is in the allowed list
 */
export function isAllowedMimeType(mimeType: string, allowedTypes: string[]): boolean {
    return allowedTypes.some(allowed => {
        // Exact match
        if (allowed === mimeType) return true;

        // Wildcard match (e.g., "image/*")
        if (allowed.endsWith('/*')) {
            const category = allowed.split('/')[0];
            return mimeType.startsWith(category + '/');
        }

        return false;
    });
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get default allowed MIME types (can be overridden by environment config)
 */
export const DEFAULT_ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.ms-excel',
    'application/vnd.ms-powerpoint',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/gif',
    'text/plain'
];
