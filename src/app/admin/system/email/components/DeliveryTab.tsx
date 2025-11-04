'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Zap } from 'lucide-react';
import type { DeliverySettings } from '../lib/types';

interface DeliveryTabProps {
  deliverySettings: DeliverySettings;
  onDeliverySettingsChange: (settings: DeliverySettings) => void;
}

export default function DeliveryTab({
  deliverySettings,
  onDeliverySettingsChange
}: DeliveryTabProps) {
  const updateDeliverySettings = (updates: Partial<DeliverySettings>) => {
    onDeliverySettingsChange({ ...deliverySettings, ...updates });
  };

  const updateRateLimiting = (updates: Partial<typeof deliverySettings.rateLimiting>) => {
    updateDeliverySettings({
      rateLimiting: { ...deliverySettings.rateLimiting, ...updates }
    });
  };

  const updateBounceHandling = (updates: Partial<typeof deliverySettings.bounceHandling>) => {
    updateDeliverySettings({
      bounceHandling: { ...deliverySettings.bounceHandling, ...updates }
    });
  };

  return (
    <div className="space-y-6">
      {/* Queue Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Queue Settings
          </CardTitle>
          <CardDescription>Configure email queue and processing options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Queue</Label>
              <p className="text-sm text-muted-foreground">
                Enable email queuing for asynchronous processing
              </p>
            </div>
            <Switch
              checked={deliverySettings.queueEnabled}
              onCheckedChange={(checked) => updateDeliverySettings({ queueEnabled: checked })}
            />
          </div>

          {deliverySettings.queueEnabled && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Max Retries</Label>
                  <Input
                    type="number"
                    value={deliverySettings.maxRetries}
                    onChange={(e) => updateDeliverySettings({ maxRetries: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Retry Delay (seconds)</Label>
                  <Input
                    type="number"
                    value={deliverySettings.retryDelay}
                    onChange={(e) => updateDeliverySettings({ retryDelay: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Batch Size</Label>
                  <Input
                    type="number"
                    value={deliverySettings.batchSize}
                    onChange={(e) => updateDeliverySettings({ batchSize: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Processing Interval (seconds)</Label>
                  <Input
                    type="number"
                    value={deliverySettings.processingInterval}
                    onChange={(e) => updateDeliverySettings({ processingInterval: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Queue Size</Label>
                  <Input
                    type="number"
                    value={deliverySettings.maxQueueSize}
                    onChange={(e) => updateDeliverySettings({ maxQueueSize: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Rate Limiting */}
      <Card>
        <CardHeader>
          <CardTitle>Rate Limiting</CardTitle>
          <CardDescription>Configure email sending rate limits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Rate Limiting</Label>
              <p className="text-sm text-muted-foreground">
                Limit the number of emails sent per time period
              </p>
            </div>
            <Switch
              checked={deliverySettings.rateLimiting.enabled}
              onCheckedChange={(checked) => updateRateLimiting({ enabled: checked })}
            />
          </div>

          {deliverySettings.rateLimiting.enabled && (
            <>
              <Separator />
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Max Per Minute</Label>
                  <Input
                    type="number"
                    value={deliverySettings.rateLimiting.maxPerMinute}
                    onChange={(e) => updateRateLimiting({ maxPerMinute: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Per Hour</Label>
                  <Input
                    type="number"
                    value={deliverySettings.rateLimiting.maxPerHour}
                    onChange={(e) => updateRateLimiting({ maxPerHour: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Per Day</Label>
                  <Input
                    type="number"
                    value={deliverySettings.rateLimiting.maxPerDay}
                    onChange={(e) => updateRateLimiting({ maxPerDay: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Bounce Handling */}
      <Card>
        <CardHeader>
          <CardTitle>Bounce Handling</CardTitle>
          <CardDescription>Configure bounce handling and retry logic</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Bounce Handling</Label>
              <p className="text-sm text-muted-foreground">
                Automatically handle bounced emails
              </p>
            </div>
            <Switch
              checked={deliverySettings.bounceHandling.enabled}
              onCheckedChange={(checked) => updateBounceHandling({ enabled: checked })}
            />
          </div>

          {deliverySettings.bounceHandling.enabled && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Max Bounces</Label>
                  <Input
                    type="number"
                    value={deliverySettings.bounceHandling.maxBounces}
                    onChange={(e) => updateBounceHandling({ maxBounces: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bounce Action</Label>
                  <Select
                    value={deliverySettings.bounceHandling.bounceAction}
                    onValueChange={(value) => updateBounceHandling({ bounceAction: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="disable">Disable</SelectItem>
                      <SelectItem value="remove">Remove</SelectItem>
                      <SelectItem value="notify">Notify Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
