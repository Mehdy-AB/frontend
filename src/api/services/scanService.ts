/**
 * Scan Agent Service - Client for local Scan Agent API
 * Communicates with the desktop scanning service running on localhost
 */

export interface ScannerInfo {
    id: string;
    name: string;
    type: 'TWAIN' | 'WIA' | 'MOCK';
    hasAdf: boolean;
    hasDuplex: boolean;
    isDefault: boolean;
}

export interface ScanOptions {
    // Basic options
    dpi: number;
    colorMode: 'Color' | 'Grayscale' | 'BlackAndWhite';
    useAdf: boolean;
    showUi: boolean;
    duplex?: boolean;

    // Page settings
    pageSize?: 'A4' | 'A5' | 'A3' | 'Letter' | 'Legal' | 'Auto';
    orientation?: 'Portrait' | 'Landscape' | 'Auto';

    // Image adjustments
    brightness?: number;   // -100 to +100
    contrast?: number;     // -100 to +100
    threshold?: number;    // 0-255 for B&W mode

    // Post-processing
    autoCrop?: boolean;
    autoDeskew?: boolean;
    removeBlankPages?: boolean;

    // Output settings
    jpegQuality?: number;  // 1-100
    maxPages?: number;     // 0 = unlimited
}

export type ScanJobStatus =
    | 'Pending'
    | 'Scanning'
    | 'Processing'
    | 'Completed'
    | 'Failed'
    | 'Cancelled';

export interface ScanJobResponse {
    jobId: string;
    status: ScanJobStatus;
    pageCount: number;
    progress: number;
    errorMessage?: string;
}

export interface ScanResultResponse {
    jobId: string;
    status: string;
    pageCount: number;
    pdfPath?: string;
    fileName?: string;
    fileSize: number;
    createdAt: string;
    completedAt?: string;
}

export interface UploadRequest {
    folderId: number;
    title: string;
    lang: string;
    token: string;
    tags?: string;
}

export interface UploadResponse {
    documentId?: number;
    versionId?: number;
    success: boolean;
    errorMessage?: string;
}

const SCAN_AGENT_URL = 'http://localhost:5959';

export class ScanService {
    private baseUrl: string;

    constructor(baseUrl: string = SCAN_AGENT_URL) {
        this.baseUrl = baseUrl;
    }

    /**
     * Check if Scan Agent service is available
     */
    async isAvailable(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/api/health`, {
                method: 'GET',
                signal: AbortSignal.timeout(2000) // 2 second timeout
            });
            return response.ok;
        } catch {
            return false;
        }
    }

    /**
     * Get list of available scanners
     */
    async getScanners(): Promise<ScannerInfo[]> {
        const response = await fetch(`${this.baseUrl}/api/scanners`);

        if (!response.ok) {
            throw new Error(`Failed to get scanners: ${response.statusText}`);
        }

        const data = await response.json();
        return data.scanners || [];
    }

    /**
     * Start a scan job
     */
    async startScan(scannerId: string, options: ScanOptions): Promise<ScanJobResponse> {
        const response = await fetch(`${this.baseUrl}/api/scan`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                scannerId,
                options
            })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || `Failed to start scan: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Get scan job status
     */
    async getStatus(jobId: string): Promise<ScanJobResponse> {
        const response = await fetch(`${this.baseUrl}/api/status/${jobId}`);

        if (!response.ok) {
            throw new Error(`Failed to get status: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Get scan result details
     */
    async getResult(jobId: string): Promise<ScanResultResponse> {
        const response = await fetch(`${this.baseUrl}/api/result/${jobId}`);

        if (!response.ok) {
            throw new Error(`Failed to get result: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Upload scanned PDF to DMS backend
     */
    async upload(jobId: string, request: UploadRequest): Promise<UploadResponse> {
        const response = await fetch(`${this.baseUrl}/api/upload/${jobId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(request)
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || `Upload failed: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Get download URL for scanned PDF
     */
    getDownloadUrl(jobId: string): string {
        return `${this.baseUrl}/api/download/${jobId}`;
    }

    /**
     * Get PDF as base64 for embedding
     */
    async getBase64(jobId: string): Promise<{ base64: string; fileName: string; mimeType: string }> {
        const response = await fetch(`${this.baseUrl}/api/result/${jobId}/base64`);

        if (!response.ok) {
            throw new Error(`Failed to get base64: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Cancel a running scan job
     */
    async cancel(jobId: string): Promise<void> {
        const response = await fetch(`${this.baseUrl}/api/cancel/${jobId}`, {
            method: 'POST'
        });

        if (!response.ok) {
            throw new Error(`Failed to cancel: ${response.statusText}`);
        }
    }

    /**
     * Poll for job completion
     */
    async waitForCompletion(
        jobId: string,
        onProgress?: (job: ScanJobResponse) => void,
        intervalMs: number = 500,
        timeoutMs: number = 120000
    ): Promise<ScanJobResponse> {
        const startTime = Date.now();

        return new Promise((resolve, reject) => {
            const poll = async () => {
                try {
                    if (Date.now() - startTime > timeoutMs) {
                        reject(new Error('Scan timeout exceeded'));
                        return;
                    }

                    const status = await this.getStatus(jobId);
                    onProgress?.(status);

                    if (status.status === 'Completed') {
                        resolve(status);
                    } else if (status.status === 'Failed' || status.status === 'Cancelled') {
                        reject(new Error(status.errorMessage || `Scan ${status.status.toLowerCase()}`));
                    } else {
                        setTimeout(poll, intervalMs);
                    }
                } catch (error) {
                    reject(error);
                }
            };

            poll();
        });
    }
}

// Export singleton instance
export const scanService = new ScanService();
