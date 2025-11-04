'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Archive, Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import type { BackupSettings } from '../lib/types';

interface BackupTabProps {
  backupSettings: BackupSettings;
  onBackupSettingsChange: (settings: BackupSettings) => void;
  onAddLocation?: () => void;
  onEditLocation?: (id: string) => void;
  onDeleteLocation?: (id: string) => void;
}

export default function BackupTab({ 
  backupSettings,
  onBackupSettingsChange,
  onAddLocation,
  onEditLocation,
  onDeleteLocation
}: BackupTabProps) {
  const updateBackupSettings = (updates: Partial<BackupSettings>) => {
    onBackupSettingsChange({
      ...backupSettings,
      ...updates
    });
  };

  const toggleLocation = (locationId: string) => {
    const updatedLocations = backupSettings.locations.map(loc =>
      loc.id === locationId ? { ...loc, enabled: !loc.enabled } : loc
    );
    updateBackupSettings({ locations: updatedLocations });
  };

  return (
    <div className="space-y-6">
      {/* Backup Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Backup Configuration
          </CardTitle>
          <CardDescription>Configure automated backup settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Automated Backups</Label>
              <p className="text-sm text-muted-foreground">
                Automatically backup system data
              </p>
            </div>
            <Switch
              checked={backupSettings.enabled}
              onCheckedChange={(checked) => updateBackupSettings({ enabled: checked })}
            />
          </div>

          {backupSettings.enabled && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Schedule</Label>
                  <Select
                    value={backupSettings.schedule}
                    onValueChange={(value) => updateBackupSettings({ schedule: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input
                    type="time"
                    value={backupSettings.time}
                    onChange={(e) => updateBackupSettings({ time: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Retention Period (days)</Label>
                  <Input
                    type="number"
                    value={backupSettings.retention}
                    onChange={(e) => updateBackupSettings({ retention: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Compression</Label>
                    <p className="text-sm text-muted-foreground">
                      Compress backup files
                    </p>
                  </div>
                  <Switch
                    checked={backupSettings.compression}
                    onCheckedChange={(checked) => updateBackupSettings({ compression: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Encryption</Label>
                    <p className="text-sm text-muted-foreground">
                      Encrypt backup files
                    </p>
                  </div>
                  <Switch
                    checked={backupSettings.encryption}
                    onCheckedChange={(checked) => updateBackupSettings({ encryption: checked })}
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Backup Locations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Backup Locations</CardTitle>
              <CardDescription>Configure backup storage locations</CardDescription>
            </div>
            <Button onClick={onAddLocation} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Location
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {backupSettings.locations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No backup locations configured
              </div>
            ) : (
              backupSettings.locations.map((location) => (
                <div key={location.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{location.name}</h3>
                        <Badge variant={location.enabled ? 'default' : 'secondary'}>
                          {location.enabled ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Enabled
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              Disabled
                            </>
                          )}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{location.path}</p>
                    </div>
                    <div className="flex gap-2">
                      <Switch
                        checked={location.enabled}
                        onCheckedChange={() => toggleLocation(location.id)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditLocation?.(location.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteLocation?.(location.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
