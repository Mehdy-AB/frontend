import axios from 'axios';

// License-specific API client that doesn't require authentication
// Uses the same base URL but without the auth token interceptor

const getApiUrl = (): string => {
    if (typeof window !== 'undefined') {
        return (window as any).ENV?.API_URL || 'http://localhost:8080';
    }
    return process.env.INTERNAL_API_URL || process.env.CLIENT_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
};

const licenseClient = axios.create({
    baseURL: getApiUrl(),
    headers: {
        'Content-Type': 'application/json',
    },
});

// License status types
export enum LicenseStatus {
    VALID = 'VALID',
    EXPIRED = 'EXPIRED',
    INVALID = 'INVALID',
    NOT_ACTIVATED = 'NOT_ACTIVATED',
    MACHINE_MISMATCH = 'MACHINE_MISMATCH',
    CLOCK_TAMPERED = 'CLOCK_TAMPERED',
}

// License status response DTO
export interface LicenseStatusDto {
    status: LicenseStatus;
    message: string;
    expirationDate?: string;
    daysRemaining?: number;
    customerName?: string;
}

// Machine info DTO
export interface MachineInfoDto {
    machineId: string;
    cpuId: string;
    macAddress: string;
    hostname: string;
}

// License error response (HTTP 402)
export interface LicenseErrorResponse {
    error: 'LICENSE_REQUIRED';
    status: LicenseStatus;
    message: string;
    machineInfo: MachineInfoDto;
    expirationDate?: string;
}

/**
 * License service for managing license activation
 */
export const licenseService = {
    /**
     * Check if license system is enabled
     */
    async isEnabled(): Promise<boolean> {
        try {
            const response = await licenseClient.get<boolean>('/api/license/enabled');
            return response.data;
        } catch (error) {
            console.error('Failed to check license system status:', error);
            return false;
        }
    },

    /**
     * Get current license status
     */
    async getStatus(): Promise<LicenseStatusDto> {
        const response = await licenseClient.get<LicenseStatusDto>('/api/license/status');
        return response.data;
    },

    /**
     * Get machine information for activation
     */
    async getMachineInfo(): Promise<MachineInfoDto> {
        const response = await licenseClient.get<MachineInfoDto>('/api/license/machine-info');
        return response.data;
    },

    /**
     * Activate a license with the provided token
     */
    async activate(licenseToken: string): Promise<LicenseStatusDto> {
        const response = await licenseClient.post<LicenseStatusDto>('/api/license/activate', {
            licenseToken,
        });
        return response.data;
    },

    /**
     * Check if a response indicates license is required
     */
    isLicenseRequiredError(error: any): error is { response: { status: 402; data: LicenseErrorResponse } } {
        return error?.response?.status === 402 && error?.response?.data?.error === 'LICENSE_REQUIRED';
    },
};
