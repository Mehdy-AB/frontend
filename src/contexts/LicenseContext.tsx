'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { licenseService, LicenseStatus, LicenseStatusDto, MachineInfoDto } from '@/api/services/licenseService';

interface LicenseContextType {
    // License state
    isLicensed: boolean;
    isLoading: boolean;
    isLicenseSystemEnabled: boolean;
    licenseStatus: LicenseStatusDto | null;
    machineInfo: MachineInfoDto | null;

    // Actions
    checkLicense: () => Promise<void>;
    activateLicense: (token: string) => Promise<LicenseStatusDto>;
    refreshMachineInfo: () => Promise<void>;
}

const LicenseContext = createContext<LicenseContextType | undefined>(undefined);

export function useLicense() {
    const context = useContext(LicenseContext);
    if (!context) {
        throw new Error('useLicense must be used within a LicenseProvider');
    }
    return context;
}

interface LicenseProviderProps {
    children: ReactNode;
}

export function LicenseProvider({ children }: LicenseProviderProps) {
    const [isLicensed, setIsLicensed] = useState(true); // Assume licensed initially
    const [isLoading, setIsLoading] = useState(true);
    const [isLicenseSystemEnabled, setIsLicenseSystemEnabled] = useState(false);
    const [licenseStatus, setLicenseStatus] = useState<LicenseStatusDto | null>(null);
    const [machineInfo, setMachineInfo] = useState<MachineInfoDto | null>(null);

    const checkLicense = useCallback(async () => {
        try {
            setIsLoading(true);

            // First check if license system is enabled
            const enabled = await licenseService.isEnabled();
            setIsLicenseSystemEnabled(enabled);

            if (!enabled) {
                // License system not enabled - allow access
                setIsLicensed(true);
                setLicenseStatus({
                    status: LicenseStatus.VALID,
                    message: 'License system not configured',
                });
                return;
            }

            // Get license status
            const status = await licenseService.getStatus();
            setLicenseStatus(status);
            setIsLicensed(status.status === LicenseStatus.VALID);

            // If not licensed, get machine info for activation popup
            if (status.status !== LicenseStatus.VALID) {
                await refreshMachineInfo();
            }
        } catch (error) {
            console.error('License check failed:', error);
            // On error, get machine info anyway
            await refreshMachineInfo();
            setIsLicensed(false);
            setLicenseStatus({
                status: LicenseStatus.INVALID,
                message: 'Failed to verify license. Please activate.',
            });
        } finally {
            setIsLoading(false);
        }
    }, []);

    const refreshMachineInfo = useCallback(async () => {
        try {
            const info = await licenseService.getMachineInfo();
            setMachineInfo(info);
        } catch (error) {
            console.error('Failed to get machine info:', error);
        }
    }, []);

    const activateLicense = useCallback(async (token: string): Promise<LicenseStatusDto> => {
        const result = await licenseService.activate(token);
        setLicenseStatus(result);
        setIsLicensed(result.status === LicenseStatus.VALID);
        return result;
    }, []);

    // Check license on mount
    useEffect(() => {
        checkLicense();
    }, [checkLicense]);

    const value: LicenseContextType = {
        isLicensed,
        isLoading,
        isLicenseSystemEnabled,
        licenseStatus,
        machineInfo,
        checkLicense,
        activateLicense,
        refreshMachineInfo,
    };

    return (
        <LicenseContext.Provider value={value}>
            {children}
        </LicenseContext.Provider>
    );
}
