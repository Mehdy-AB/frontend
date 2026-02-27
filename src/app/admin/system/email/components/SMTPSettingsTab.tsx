'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Server, TestTube, Eye, EyeOff, Send, Mail, Lock } from 'lucide-react';
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

  // Determine security value for select
  const getSecurityValue = () => {
    if (smtpSettings.secure) return 'ssl';
    return 'tls';
  };

  const handleSecurityChange = (value: string) => {
    updateSmtpSettings({ secure: value === 'ssl' });
  };

  return (
    <div className="space-y-6">
      {/* SMTP Configuration */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Server className="h-5 w-5 text-primary" />
            SMTP Configuration
          </CardTitle>
          <CardDescription>Configure your SMTP server settings for sending emails</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable Toggle */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Enable Email Sending</Label>
              <p className="text-sm text-muted-foreground">Turn on to enable email notifications</p>
            </div>
            <Switch
              checked={smtpSettings.enabled}
              onCheckedChange={(checked) => updateSmtpSettings({ enabled: checked })}
            />
          </div>

          {/* Server Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>SMTP Host <span className="text-destructive">*</span></Label>
              <Input
                value={smtpSettings.host}
                onChange={(e) => updateSmtpSettings({ host: e.target.value })}
                placeholder="smtp.example.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Port <span className="text-destructive">*</span></Label>
                <Input
                  type="number"
                  value={smtpSettings.port}
                  onChange={(e) => updateSmtpSettings({ port: parseInt(e.target.value) || 587 })}
                  placeholder="587"
                />
              </div>
              <div className="space-y-2">
                <Label>Security</Label>
                <Select value={getSecurityValue()} onValueChange={handleSecurityChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="tls">TLS (STARTTLS)</SelectItem>
                    <SelectItem value="ssl">SSL/TLS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Authentication */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Lock className="h-4 w-4" />
              Authentication
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Username</Label>
                <Input
                  value={smtpSettings.username}
                  onChange={(e) => updateSmtpSettings({ username: e.target.value })}
                  placeholder="your-email@example.com"
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
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    type="button"
                    onClick={() => onShowPasswordChange(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Leave blank to keep existing password</p>
              </div>
            </div>
          </div>

          {/* Sender Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Mail className="h-4 w-4" />
              Sender Information
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From Email <span className="text-destructive">*</span></Label>
                <Input
                  type="email"
                  value={smtpSettings.fromEmail}
                  onChange={(e) => updateSmtpSettings({ fromEmail: e.target.value })}
                  placeholder="noreply@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>From Name</Label>
                <Input
                  value={smtpSettings.fromName}
                  onChange={(e) => updateSmtpSettings({ fromName: e.target.value })}
                  placeholder="DMS System"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reply-To Email</Label>
              <Input
                type="email"
                value={smtpSettings.replyTo}
                onChange={(e) => updateSmtpSettings({ replyTo: e.target.value })}
                placeholder="support@example.com (optional)"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Connection */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TestTube className="h-5 w-5 text-primary" />
            Test Connection
          </CardTitle>
          <CardDescription>Verify your SMTP configuration by sending a test email</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="email"
                placeholder="Enter test email address"
                value={testEmail}
                onChange={(e) => onTestEmailChange(e.target.value)}
              />
            </div>
            <Button
              onClick={onSendTestEmail}
              disabled={testing || !testEmail.trim()}
              className="gap-2 min-w-[160px]"
            >
              {testing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Test Email
                </>
              )}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            💡 Tip: Save your settings first, then send a test email to verify the configuration works correctly.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
