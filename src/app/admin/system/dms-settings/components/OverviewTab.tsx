'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  Server, 
  Database, 
  Clock, 
  Archive, 
  Cpu, 
  MemoryStick, 
  HardDrive, 
  Activity,
  BarChart3
} from 'lucide-react';
import type { SystemInfo } from '../lib/types';
import { getStatusColor, formatDate } from '../lib/utils';
import { getStatusIcon } from '../lib/statusIcon';

interface OverviewTabProps {
  systemInfo: SystemInfo;
}

export default function OverviewTab({ systemInfo }: OverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">System Status</p>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusIcon(systemInfo.status)}
                  <span className={`font-medium capitalize ${getStatusColor(systemInfo.status)}`}>
                    {systemInfo.status}
                  </span>
                </div>
              </div>
              <Server className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Version</p>
                <p className="text-2xl font-semibold">{systemInfo.version}</p>
              </div>
              <Database className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Uptime</p>
                <p className="text-sm font-medium">{systemInfo.uptime}</p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Last Backup</p>
                <p className="text-sm font-medium">{formatDate(systemInfo.lastBackup)}</p>
              </div>
              <Archive className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Metrics
          </CardTitle>
          <CardDescription>Current system performance indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">CPU Usage</Label>
                <span className="text-sm font-medium">{systemInfo.performance.cpu}%</span>
              </div>
              <Progress value={systemInfo.performance.cpu} className="h-2" />
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Cpu className="h-3 w-3" />
                <span>Intel Xeon E5-2680 v4</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Memory Usage</Label>
                <span className="text-sm font-medium">{systemInfo.performance.memory}%</span>
              </div>
              <Progress value={systemInfo.performance.memory} className="h-2" />
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MemoryStick className="h-3 w-3" />
                <span>8 GB RAM</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Disk Usage</Label>
                <span className="text-sm font-medium">{systemInfo.performance.disk}%</span>
              </div>
              <Progress value={systemInfo.performance.disk} className="h-2" />
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <HardDrive className="h-3 w-3" />
                <span>500 GB SSD</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Network Usage</Label>
                <span className="text-sm font-medium">{systemInfo.performance.network}%</span>
              </div>
              <Progress value={systemInfo.performance.network} className="h-2" />
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Activity className="h-3 w-3" />
                <span>1 Gbps</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
