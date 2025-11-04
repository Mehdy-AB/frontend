'use client';

import { useState } from 'react';
import { 
  Save, 
  RefreshCw, 
  Activity,
  HardDrive, 
  Shield, 
  Zap,
  Archive,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDMSSettings } from './lib/hooks';
import OverviewTab from './components/OverviewTab';
import StorageTab from './components/StorageTab';
import SecurityTab from './components/SecurityTab';
import PerformanceTab from './components/PerformanceTab';
import BackupTab from './components/BackupTab';
import LogsTab from './components/LogsTab';

export default function DMSSettingsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  
  const {
    saving,
    systemInfo,
    storageInfo,
    securitySettings,
    performanceSettings,
    backupSettings,
    logs,
    logFilter,
    setSecuritySettings,
    setPerformanceSettings,
    setBackupSettings,
    setLogFilter,
    handleSaveSettings
  } = useDMSSettings();

  const handleAddStorageLocation = () => {
    // TODO: Implement add storage location modal
    console.log('Add storage location');
  };

  const handleEditStorageLocation = (id: string) => {
    // TODO: Implement edit storage location modal
    console.log('Edit storage location:', id);
  };

  const handleDeleteStorageLocation = (id: string) => {
    // TODO: Implement delete storage location confirmation
    console.log('Delete storage location:', id);
  };

  const handleAddBackupLocation = () => {
    // TODO: Implement add backup location modal
    console.log('Add backup location');
  };

  const handleEditBackupLocation = (id: string) => {
    // TODO: Implement edit backup location modal
    console.log('Edit backup location:', id);
  };

  const handleDeleteBackupLocation = (id: string) => {
    // TODO: Implement delete backup location confirmation
    console.log('Delete backup location:', id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">DMS Settings</h1>
          <p className="text-muted-foreground">Configure system settings, storage, and performance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={handleSaveSettings} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
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
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab systemInfo={systemInfo} />
        </TabsContent>

        <TabsContent value="storage">
          <StorageTab
            storageInfo={storageInfo}
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
      </Tabs>
    </div>
  );
}

