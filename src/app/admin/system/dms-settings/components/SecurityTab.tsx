'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Shield, Lock, Key, Globe, FileText } from 'lucide-react';
import type { SecuritySettings } from '../lib/types';

interface SecurityTabProps {
  securitySettings: SecuritySettings;
  onSecuritySettingsChange: (settings: SecuritySettings) => void;
}

export default function SecurityTab({ 
  securitySettings,
  onSecuritySettingsChange 
}: SecurityTabProps) {
  const updateAuthentication = (updates: Partial<typeof securitySettings.authentication>) => {
    onSecuritySettingsChange({
      ...securitySettings,
      authentication: { ...securitySettings.authentication, ...updates }
    });
  };

  const updateEncryption = (updates: Partial<typeof securitySettings.encryption>) => {
    onSecuritySettingsChange({
      ...securitySettings,
      encryption: { ...securitySettings.encryption, ...updates }
    });
  };

  const updateAccess = (updates: Partial<typeof securitySettings.access>) => {
    onSecuritySettingsChange({
      ...securitySettings,
      access: { ...securitySettings.access, ...updates }
    });
  };

  const updateAudit = (updates: Partial<typeof securitySettings.audit>) => {
    onSecuritySettingsChange({
      ...securitySettings,
      audit: { ...securitySettings.audit, ...updates }
    });
  };

  return (
    <div className="space-y-6">
      {/* Authentication Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Authentication
          </CardTitle>
          <CardDescription>Configure user authentication and session settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Authentication Method</Label>
              <Select
                value={securitySettings.authentication.method}
                onValueChange={(value) => updateAuthentication({ method: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jwt">JWT</SelectItem>
                  <SelectItem value="oauth2">OAuth 2.0</SelectItem>
                  <SelectItem value="saml">SAML</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Session Timeout (minutes)</Label>
              <Input
                type="number"
                value={securitySettings.authentication.sessionTimeout}
                onChange={(e) => updateAuthentication({ sessionTimeout: parseInt(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label>Max Login Attempts</Label>
              <Input
                type="number"
                value={securitySettings.authentication.maxLoginAttempts}
                onChange={(e) => updateAuthentication({ maxLoginAttempts: parseInt(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label>Lockout Duration (minutes)</Label>
              <Input
                type="number"
                value={securitySettings.authentication.lockoutDuration}
                onChange={(e) => updateAuthentication({ lockoutDuration: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require Multi-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">
                Enable MFA for all users
              </p>
            </div>
            <Switch
              checked={securitySettings.authentication.requireMFA}
              onCheckedChange={(checked) => updateAuthentication({ requireMFA: checked })}
            />
          </div>

          <Separator />

          <div>
            <Label className="mb-4 block">Password Policy</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Minimum Length</Label>
                <Input
                  type="number"
                  value={securitySettings.authentication.passwordPolicy.minLength}
                  onChange={(e) => updateAuthentication({
                    passwordPolicy: {
                      ...securitySettings.authentication.passwordPolicy,
                      minLength: parseInt(e.target.value)
                    }
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>Max Age (days)</Label>
                <Input
                  type="number"
                  value={securitySettings.authentication.passwordPolicy.maxAge}
                  onChange={(e) => updateAuthentication({
                    passwordPolicy: {
                      ...securitySettings.authentication.passwordPolicy,
                      maxAge: parseInt(e.target.value)
                    }
                  })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="flex items-center justify-between">
                <Label>Require Uppercase</Label>
                <Switch
                  checked={securitySettings.authentication.passwordPolicy.requireUppercase}
                  onCheckedChange={(checked) => updateAuthentication({
                    passwordPolicy: {
                      ...securitySettings.authentication.passwordPolicy,
                      requireUppercase: checked
                    }
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Require Lowercase</Label>
                <Switch
                  checked={securitySettings.authentication.passwordPolicy.requireLowercase}
                  onCheckedChange={(checked) => updateAuthentication({
                    passwordPolicy: {
                      ...securitySettings.authentication.passwordPolicy,
                      requireLowercase: checked
                    }
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Require Numbers</Label>
                <Switch
                  checked={securitySettings.authentication.passwordPolicy.requireNumbers}
                  onCheckedChange={(checked) => updateAuthentication({
                    passwordPolicy: {
                      ...securitySettings.authentication.passwordPolicy,
                      requireNumbers: checked
                    }
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Require Symbols</Label>
                <Switch
                  checked={securitySettings.authentication.passwordPolicy.requireSymbols}
                  onCheckedChange={(checked) => updateAuthentication({
                    passwordPolicy: {
                      ...securitySettings.authentication.passwordPolicy,
                      requireSymbols: checked
                    }
                  })}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Encryption Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Encryption
          </CardTitle>
          <CardDescription>Configure data encryption settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Encryption</Label>
              <p className="text-sm text-muted-foreground">
                Encrypt data at rest and in transit
              </p>
            </div>
            <Switch
              checked={securitySettings.encryption.enabled}
              onCheckedChange={(checked) => updateEncryption({ enabled: checked })}
            />
          </div>

          {securitySettings.encryption.enabled && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Algorithm</Label>
                  <Select
                    value={securitySettings.encryption.algorithm}
                    onValueChange={(value) => updateEncryption({ algorithm: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AES-256">AES-256</SelectItem>
                      <SelectItem value="AES-128">AES-128</SelectItem>
                      <SelectItem value="RSA-2048">RSA-2048</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Key Rotation (days)</Label>
                  <Input
                    type="number"
                    value={securitySettings.encryption.keyRotation}
                    onChange={(e) => updateEncryption({ keyRotation: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Access Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Access Control
          </CardTitle>
          <CardDescription>Configure IP whitelisting and domain restrictions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>IP Whitelist (one per line)</Label>
            <textarea
              className="w-full min-h-[100px] p-2 border rounded-md"
              value={securitySettings.access.ipWhitelist.join('\n')}
              onChange={(e) => updateAccess({
                ipWhitelist: e.target.value.split('\n').filter(line => line.trim())
              })}
            />
          </div>

          <div className="space-y-2">
            <Label>Allowed Domains (one per line)</Label>
            <textarea
              className="w-full min-h-[100px] p-2 border rounded-md"
              value={securitySettings.access.allowedDomains.join('\n')}
              onChange={(e) => updateAccess({
                allowedDomains: e.target.value.split('\n').filter(line => line.trim())
              })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Block Tor Traffic</Label>
              <p className="text-sm text-muted-foreground">
                Block connections from Tor network
              </p>
            </div>
            <Switch
              checked={securitySettings.access.blockTor}
              onCheckedChange={(checked) => updateAccess({ blockTor: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require VPN</Label>
              <p className="text-sm text-muted-foreground">
                Require VPN connection for access
              </p>
            </div>
            <Switch
              checked={securitySettings.access.requireVPN}
              onCheckedChange={(checked) => updateAccess({ requireVPN: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Audit Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Audit & Logging
          </CardTitle>
          <CardDescription>Configure audit logging and retention</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Audit Logging</Label>
              <p className="text-sm text-muted-foreground">
                Log all security events and user actions
              </p>
            </div>
            <Switch
              checked={securitySettings.audit.enabled}
              onCheckedChange={(checked) => updateAudit({ enabled: checked })}
            />
          </div>

          {securitySettings.audit.enabled && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Retention Period (days)</Label>
                  <Input
                    type="number"
                    value={securitySettings.audit.retentionDays}
                    onChange={(e) => updateAudit({ retentionDays: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Log Level</Label>
                  <Select
                    value={securitySettings.audit.logLevel}
                    onValueChange={(value) => updateAudit({ logLevel: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="debug">Debug</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
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
