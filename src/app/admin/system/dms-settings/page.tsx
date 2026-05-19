'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save,
  RefreshCw,
  Activity,
  HardDrive,
  Shield,
  Zap,
  Archive,
  FileText,
  FileType,
  Loader2,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDMSSettings } from './lib/hooks';
import OverviewTab from './components/OverviewTab';
import StorageTab from './components/StorageTab';
import SecurityTab from './components/SecurityTab';
import PerformanceTab from './components/PerformanceTab';
import BackupTab from './components/BackupTab';
import LogsTab from './components/LogsTab';
import FileTypesTab from './components/FileTypesTab';
import { useAdminPagePermissions } from '@/hooks/useAdminPagePermissions';

export default function DMSSettingsPage() {
  const router = useRouter();
  const { canView, canUpdate } = useAdminPagePermissions();
  const [activeTab, setActiveTab] = useState('overview');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!canView) {
      router.push('/');
    }
  }, [canView, router]);

  const {
    loading,
    saving,
    error,
    systemInfo,
    storageInfo,
    coreSettings,
    storageSettings: storageSettingsData,
    uploadRules,
    securitySettings,
    performanceSettings,
    backupSettings,
    serviceHealth,
    healthLoading,
    logs,
    logFilter,
    setCoreSettings,
    setStorageSettings: setStorageSettingsData,
    setUploadRules,
    setSecuritySettings,
    setPerformanceSettings,
    setBackupSettings,
    setLogFilter,
    handleSaveSettings,
    fetchSettings,
    triggerHealthCheck,
  } = useDMSSettings();

  const handleAddStorageLocation = () => {
    console.log('Add storage location');
  };

  const handleEditStorageLocation = (id: string) => {
    console.log('Edit storage location:', id);
  };

  const handleDeleteStorageLocation = (id: string) => {
    console.log('Delete storage location:', id);
  };

  const handleAddBackupLocation = () => {
    console.log('Add backup location');
  };

  const handleEditBackupLocation = (id: string) => {
    console.log('Edit backup location:', id);
  };

  const handleDeleteBackupLocation = (id: string) => {
    console.log('Delete backup location:', id);
  };

  const handleSave = async () => {
    try {
      await handleSaveSettings();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      // Error is already set in the hook
    }
  };

  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-destructive text-lg">You don't have permission to view this page</p>
        </div>
      </div>
    );
  }

  // Count down services for header badge
  const downServices = serviceHealth.filter(s => s.status === 'DOWN').length;
  const degradedServices = serviceHealth.filter(s => s.status === 'DEGRADED').length;

  return (
    <div className="space-y-6">
      {/* Service Health Warning Banner */}
      {downServices > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">
              {downServices} service{downServices > 1 ? 's are' : ' is'} currently down
            </p>
            <p className="text-xs text-red-600 mt-0.5">
              Affected operations (OCR, indexing) have been queued and will resume automatically when services recover.
            </p>
          </div>
          <Button size="sm" variant="outline" className="text-red-700 border-red-300 hover:bg-red-100" onClick={triggerHealthCheck} disabled={healthLoading}>
            {healthLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Re-check
          </Button>
        </div>
      )}

      {/* Degraded Service Warning Banner */}
      {degradedServices > 0 && downServices === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">
              {degradedServices} service{degradedServices > 1 ? 's are' : ' is'} degraded
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              System is operational but some services may respond slowly.
            </p>
          </div>
          <Button size="sm" variant="outline" className="text-amber-700 border-amber-300 hover:bg-amber-100" onClick={triggerHealthCheck} disabled={healthLoading}>
            {healthLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Re-check
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">DMS Settings</h1>
            {loading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
          </div>
          <p className="text-muted-foreground">Configure system settings, storage, and performance</p>
        </div>
        <div className="flex gap-2 items-center">
          {saveSuccess && (
            <span className="flex items-center gap-1 text-sm text-emerald-600">
              <CheckCircle2 className="h-4 w-4" /> Saved
            </span>
          )}
          {error && (
            <span className="text-sm text-red-500">{error}</span>
          )}
          <Button variant="outline" className="gap-2" onClick={fetchSettings} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleSave}
                disabled={saving || !canUpdate}
                className="gap-2"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </TooltipTrigger>
            {!canUpdate && (
              <TooltipContent>
                <p>You don't have permission to update system settings</p>
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview" className="gap-2">
            <Activity className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="storage" className="gap-2">
            <HardDrive className="h-4 w-4" />
            Storage
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-2">
            <Zap className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="backup" className="gap-2">
            <Archive className="h-4 w-4" />
            Backup
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <FileText className="h-4 w-4" />
            Logs
          </TabsTrigger>
          <TabsTrigger value="filetypes" className="gap-2">
            <FileType className="h-4 w-4" />
            File Types
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab
            systemInfo={systemInfo}
            coreSettings={coreSettings}
            onCoreSettingsChange={setCoreSettings}
            serviceHealth={serviceHealth}
            healthLoading={healthLoading}
            onRefreshHealth={triggerHealthCheck}
          />
        </TabsContent>

        <TabsContent value="storage">
          <StorageTab
            storageInfo={storageInfo}
            storageSettings={storageSettingsData}
            onStorageSettingsChange={setStorageSettingsData}
            onAddLocation={handleAddStorageLocation}
            onEditLocation={handleEditStorageLocation}
            onDeleteLocation={handleDeleteStorageLocation}
          />
        </TabsContent>

        <TabsContent value="security">
          <SecurityTab
            securitySettings={securitySettings}
            onSecuritySettingsChange={setSecuritySettings}
          />
        </TabsContent>

        <TabsContent value="performance">
          <PerformanceTab
            performanceSettings={performanceSettings}
            onPerformanceSettingsChange={setPerformanceSettings}
          />
        </TabsContent>

        <TabsContent value="backup">
          <BackupTab
            backupSettings={backupSettings}
            onBackupSettingsChange={setBackupSettings}
            onAddLocation={handleAddBackupLocation}
            onEditLocation={handleEditBackupLocation}
            onDeleteLocation={handleDeleteBackupLocation}
          />
        </TabsContent>

        <TabsContent value="logs">
          <LogsTab
            logs={logs}
            logFilter={logFilter}
            onFilterChange={setLogFilter}
          />
        </TabsContent>

        <TabsContent value="filetypes">
          <FileTypesTab
            canUpdate={canUpdate}
            uploadRules={uploadRules}
            onUploadRulesChange={setUploadRules}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
