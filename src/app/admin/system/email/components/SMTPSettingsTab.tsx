'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Server, Settings, TestTube, Eye, EyeOff, Send } from 'lucide-react';
import type { SMTPSettings } from '../lib/types';

interface SMTPSettingsTabProps {
  smtpSettings: SMTPSettings;
  onSmtpSettingsChange: (settings: SMTPSettings) => void;
  showPassword: boolean;
  onShowPasswordChange: (show: boolean) => void;
  testEmail: string;
  onTestEmailChange: (email: string) => void;
  testing: boolean;
  onTestConnection: () => void;
  onSendTestEmail: () => void;
}

export default function SMTPSettingsTab({
  smtpSettings,
  onSmtpSettingsChange,
  showPassword,
  onShowPasswordChange,
  testEmail,
  onTestEmailChange,
  testing,
  onTestConnection,
  onSendTestEmail
}: SMTPSettingsTabProps) {
  const updateSmtpSettings = (updates: Partial<SMTPSettings>) => {
    onSmtpSettingsChange({ ...smtpSettings, ...updates });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic SMTP Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              SMTP Configuration
            </CardTitle>
            <CardDescription>Configure SMTP server settings for sending emails</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Enable Email Sending</Label>
              <Switch
                checked={smtpSettings.enabled}
                onCheckedChange={(checked) => updateSmtpSettings({ enabled: checked })}
              />
            </div>

            <div className="space-y-2">
              <Label>SMTP Host</Label>
              <Input
                value={smtpSettings.host}
                onChange={(e) => updateSmtpSettings({ host: e.target.value })}
                placeholder="smtp.company.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Port</Label>
                <Input
                  type="number"
                  value={smtpSettings.port}
                  onChange={(e) => updateSmtpSettings({ port: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Security</Label>
                <Select
                  value={smtpSettings.secure ? 'ssl' : 'tls'}
                  onValueChange={(value) => updateSmtpSettings({ secure: value === 'ssl' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="tls">TLS</SelectItem>
                    <SelectItem value="ssl">SSL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Username</Label>
              <Input
                value={smtpSettings.username}
                onChange={(e) => updateSmtpSettings({ username: e.target.value })}
                placeholder="noreply@company.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Password</Label>
              <div className="flex gap-2">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={smtpSettings.password}
                  onChange={(e) => updateSmtpSettings({ password: e.target.value })}
                  placeholder="••••••••"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onShowPasswordChange(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>From Name</Label>
              <Input
                value={smtpSettings.fromName}
                onChange={(e) => updateSmtpSettings({ fromName: e.target.value })}
                placeholder="AebDMS System"
              />
            </div>

            <div className="space-y-2">
              <Label>From Email</Label>
              <Input
                value={smtpSettings.fromEmail}
                onChange={(e) => updateSmtpSettings({ fromEmail: e.target.value })}
                placeholder="noreply@company.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Reply-To Email</Label>
              <Input
                value={smtpSettings.replyTo}
                onChange={(e) => updateSmtpSettings({ replyTo: e.target.value })}
                placeholder="support@company.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Advanced SMTP Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Advanced Settings
            </CardTitle>
            <CardDescription>Configure advanced SMTP options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Connection Timeout (seconds)</Label>
              <Input
                type="number"
                value={smtpSettings.timeout}
                onChange={(e) => updateSmtpSettings({ timeout: parseInt(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label>Max Retries</Label>
              <Input
                type="number"
                value={smtpSettings.retries}
                onChange={(e) => updateSmtpSettings({ retries: parseInt(e.target.value) })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Connection Pooling</Label>
              <Switch
                checked={smtpSettings.connectionPool}
                onCheckedChange={(checked) => updateSmtpSettings({ connectionPool: checked })}
              />
            </div>

            <div className="space-y-2">
              <Label>Max Connections</Label>
              <Input
                type="number"
                value={smtpSettings.maxConnections}
                onChange={(e) => updateSmtpSettings({ maxConnections: parseInt(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label>Rate Limit (emails/hour)</Label>
              <Input
                type="number"
                value={smtpSettings.rateLimit}
                onChange={(e) => updateSmtpSettings({ rateLimit: parseInt(e.target.value) })}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Connection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Test Connection
          </CardTitle>
          <CardDescription>Test your SMTP configuration and send a test email</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={onTestConnection}
              disabled={testing}
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </Button>
            <div className="flex-1">
              <Input
                placeholder="Enter test email address"
                value={testEmail}
                onChange={(e) => onTestEmailChange(e.target.value)}
              />
            </div>
            <Button
              onClick={onSendTestEmail}
              disabled={testing || !testEmail.trim()}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              {testing ? 'Sending...' : 'Send Test Email'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
