'use client';

import React, { useState } from 'react';
import { useLicense } from '@/contexts/LicenseContext';
import { LicenseStatus } from '@/api/services/licenseService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Check, Key, AlertTriangle, Monitor, ShieldCheck, ExternalLink, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Full-screen license activation modal.
 * Blocks the entire app until a valid license is activated.
 * 
 * Design: Clean, Professional, White Theme. WIDE LAYOUT.
 */
export function LicenseActivationModal() {
    const {
        isLicensed,
        isLoading,
        isLicenseSystemEnabled,
        licenseStatus,
        machineInfo,
        activateLicense,
        checkLicense
    } = useLicense();

    const [licenseToken, setLicenseToken] = useState('');
    const [isActivating, setIsActivating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    // Don't show modal if loading, licensed, or system not enabled
    if (isLoading || isLicensed || !isLicenseSystemEnabled) {
        return null;
    }

    const copyToClipboard = async (text: string, fieldName: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(fieldName);
            setTimeout(() => setCopiedField(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleActivate = async () => {
        if (!licenseToken.trim()) {
            setError('Please enter your license key');
            return;
        }

        setIsActivating(true);
        setError(null);

        try {
            const result = await activateLicense(licenseToken.trim());

            if (result.status !== LicenseStatus.VALID) {
                setError(result.message);
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to activate license. Please check your license key.');
        } finally {
            setIsActivating(false);
        }
    };

    const getStatusMessage = () => {
        switch (licenseStatus?.status) {
            case LicenseStatus.EXPIRED:
                return 'Your license has expired. Please renew to continue.';
            case LicenseStatus.CLOCK_TAMPERED:
                return 'System clock error detected. Please check your date and time setttings.';
            case LicenseStatus.MACHINE_MISMATCH:
                return 'This license is not valid for this machine.';
            default:
                return 'Please activate your software license to proceed.';
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-50/90 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="w-full max-w-4xl bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden mx-4 relative"
            >
                <div className="flex flex-col md:flex-row h-full">

                    {/* Left Panel: Information & Branding */}
                    <div className="w-full md:w-5/12 bg-slate-900 p-10 text-white flex flex-col justify-between relative overflow-hidden">
                        {/* Background Pattern */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/50">
                                    <ShieldCheck className="w-6 h-6 text-white" />
                                </div>
                                <span className="font-bold text-xl tracking-tight">GiDOC ECM</span>
                            </div>

                            <h1 className="text-3xl font-bold mb-4 leading-tight">
                                Activation Required
                            </h1>
                            <p className="text-slate-400 text-base mb-8 leading-relaxed">
                                {getStatusMessage()}
                            </p>
                        </div>

                        <div className="space-y-6 relative z-10">
                            <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 backdrop-blur-sm">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Need a License Key?</h3>
                                <p className="text-sm text-slate-300 mb-4">
                                    Please visit our secure portal to purchase or retrieve your activation key.
                                </p>
                                <a
                                    href="https://gidoc.vercel.app/demo"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-all shadow-lg shadow-blue-900/20 group"
                                >
                                    Get Activation Key
                                    <ExternalLink className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
                                </a>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <Monitor className="w-3 h-3" />
                                <span>Machine ID: <span className="font-mono text-slate-400">{machineInfo?.machineId?.substring(0, 8)}...</span></span>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Action & Inputs */}
                    <div className="w-full md:w-7/12 p-10 flex flex-col justify-center bg-white relative">

                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">License Verification</h2>
                            <p className="text-gray-600">
                                Enter your unique license key to unlock the application features.
                            </p>
                        </div>

                        {/* Machine Details Card */}
                        <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center">
                                    <Monitor className="w-3.5 h-3.5 mr-2" />
                                    System Fingerprint
                                </h3>
                                <button
                                    onClick={() => {
                                        const allInfo = `Machine ID: ${machineInfo?.machineId}\nCPU ID: ${machineInfo?.cpuId}`;
                                        copyToClipboard(allInfo, 'all');
                                    }}
                                    className="text-xs flex items-center font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                                >
                                    {copiedField === 'all' ? (
                                        <>
                                            <Check className="w-3 h-3 mr-1" /> Copied All
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-3 h-3 mr-1" /> Copy All Details
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="grid gap-4">
                                <div className="group relative">
                                    <label className="text-[10px] uppercase text-gray-400 font-bold mb-1 block">Machine ID</label>
                                    <div className="flex items-center">
                                        <code className="flex-1 text-sm font-mono text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-2 truncate relative group-hover:border-blue-300 transition-colors">
                                            {machineInfo?.machineId || 'Loading...'}
                                        </code>
                                        <button
                                            onClick={() => machineInfo?.machineId && copyToClipboard(machineInfo.machineId, 'machineId')}
                                            className="absolute right-1 top-6 p-1.5 text-gray-400 hover:text-blue-600 bg-white hover:bg-blue-50 rounded-md transition-all shadow-sm border border-transparent hover:border-blue-100"
                                            title="Copy ID"
                                        >
                                            {copiedField === 'machineId' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="group relative">
                                    <label className="text-[10px] uppercase text-gray-400 font-bold mb-1 block">CPU ID</label>
                                    <div className="flex items-center">
                                        <code className="flex-1 text-sm font-mono text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-2 relative group-hover:border-blue-300 transition-colors">
                                            {machineInfo?.cpuId || 'Loading...'}
                                        </code>
                                        <button
                                            onClick={() => machineInfo?.cpuId && copyToClipboard(machineInfo.cpuId, 'cpuId')}
                                            className="absolute right-1 top-6 p-1.5 text-gray-400 hover:text-blue-600 bg-white hover:bg-blue-50 rounded-md transition-all shadow-sm border border-transparent hover:border-blue-100"
                                            title="Copy CPU ID"
                                        >
                                            {copiedField === 'cpuId' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* License Input */}
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                    <Key className="w-4 h-4 mr-2 text-gray-400" />
                                    Enter License Key
                                </label>
                                <div className="relative">
                                    <Input
                                        type="text"
                                        placeholder="Paste your license key here..."
                                        value={licenseToken}
                                        onChange={(e) => {
                                            setLicenseToken(e.target.value);
                                            setError(null);
                                        }}
                                        onKeyDown={(e) => e.key === 'Enter' && handleActivate()}
                                        className="w-full pl-4 pr-4 py-3 h-12 bg-white border-gray-300 text-base text-gray-900 focus:border-blue-500 focus:ring-blue-500/10 placeholder:text-gray-400 transition-all font-mono shadow-sm rounded-lg"
                                    />
                                </div>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-3 flex items-start gap-3 text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 text-sm"
                                    >
                                        <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
                                        <span>{error}</span>
                                    </motion.div>
                                )}
                            </div>

                            <div className="flex flex-col gap-4 pt-2">
                                <Button
                                    onClick={handleActivate}
                                    disabled={isActivating || !licenseToken.trim()}
                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 h-12 text-base rounded-lg shadow-xl shadow-slate-900/10 transition-all disabled:opacity-70 disabled:cursor-not-allowed hover:translate-y-[-1px] active:translate-y-[1px]"
                                >
                                    {isActivating ? (
                                        <span className="flex items-center gap-2">
                                            <RefreshCw className="w-5 h-5 animate-spin" />
                                            Validating License...
                                        </span>
                                    ) : (
                                        "Activate License"
                                    )}
                                </Button>

                                <button
                                    onClick={checkLicense}
                                    className="text-xs text-gray-500 hover:text-gray-700 underline underline-offset-2 transition-colors text-center"
                                >
                                    Refresh Status
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </motion.div>
        </div>
    );
}
