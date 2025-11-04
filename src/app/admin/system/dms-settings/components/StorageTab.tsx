'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { HardDrive, Plus, Edit, Trash2, Cloud, Server } from 'lucide-react';
import type { StorageInfo } from '../lib/types';
import { formatStorageSize } from '../lib/utils';

interface StorageTabProps {
  storageInfo: StorageInfo;
  onAddLocation?: () => void;
  onEditLocation?: (id: string) => void;
  onDeleteLocation?: (id: string) => void;
}

export default function StorageTab({ 
  storageInfo,
  onAddLocation,
  onEditLocation,
  onDeleteLocation
}: StorageTabProps) {
  const usedPercentage = (storageInfo.used / storageInfo.total) * 100;

  return (
    <div className="space-y-6">
      {/* Storage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Storage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatStorageSize(storageInfo.total)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Used Storage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatStorageSize(storageInfo.used)}</div>
            <div className="text-sm text-muted-foreground mt-1">
              {usedPercentage.toFixed(1)}% of total
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Available Storage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatStorageSize(storageInfo.available)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Storage Usage Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Storage Usage</CardTitle>
          <CardDescription>Current storage utilization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Used: {formatStorageSize(storageInfo.used)}</span>
                <span>Available: {formatStorageSize(storageInfo.available)}</span>
              </div>
              <Progress value={usedPercentage} className="h-3" />
            </div>
            
            {/* Storage Breakdown */}
            <div className="space-y-2">
              {storageInfo.breakdown.map((item) => (
                <div key={item.type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm">{item.type}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      {formatStorageSize(item.size)} ({item.percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Storage Locations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Storage Locations</CardTitle>
              <CardDescription>Configured storage locations</CardDescription>
            </div>
            <Button onClick={onAddLocation} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Location
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {storageInfo.locations.map((location) => {
              const locationUsedPercentage = (location.used / location.size) * 100;
              return (
                <div key={location.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {location.type === 'Cloud' ? (
                          <Cloud className="h-4 w-4 text-blue-500" />
                        ) : (
                          <Server className="h-4 w-4 text-gray-500" />
                        )}
                        <h3 className="font-medium">{location.name}</h3>
                        <Badge variant={location.status === 'active' ? 'default' : 'secondary'}>
                          {location.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{location.path}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Type: {location.type}
                      </p>
                    </div>
                    <div className="flex gap-2">
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
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>
                        Used: {formatStorageSize(location.used)} / {formatStorageSize(location.size)}
                      </span>
                      <span>{locationUsedPercentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={locationUsedPercentage} className="h-2" />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
