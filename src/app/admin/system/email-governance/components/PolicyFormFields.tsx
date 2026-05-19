'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Shield, Paperclip, RefreshCw, Scale, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { EmailCapturePolicyDto } from '../lib/types';

interface PolicyFormFieldsProps {
  policy: Partial<EmailCapturePolicyDto>;
  onChange: (updates: Partial<EmailCapturePolicyDto>) => void;
  disabled?: boolean;
}

function SwitchRow({ label, description, checked, onCheckedChange, disabled, infoTooltip }: {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
  infoTooltip?: string;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="space-y-0.5 flex-1 mr-4">
        <div className="flex items-center gap-1.5">
          <Label className="text-sm font-medium">{label}</Label>
          {infoTooltip && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">
                <p>{infoTooltip}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
  );
}

export default function PolicyFormFields({ policy, onChange, disabled }: PolicyFormFieldsProps) {
  const update = (key: string, value: any) => onChange({ [key]: value });

  return (
    <div className="space-y-6">
      {/* ── Card 1: Security & HTML ── */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4 text-red-500" />
            Security & HTML
          </CardTitle>
          <CardDescription>Controls how email content is sanitized and protected</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <SwitchRow
            label="Enforce HTML Sanitization"
            description="Strip dangerous HTML tags (script, iframe, object, embed) from email body"
            checked={policy.htmlSanitizationRequired ?? true}
            onCheckedChange={(v) => update('htmlSanitizationRequired', v)}
            disabled={disabled}
            infoTooltip="When enabled, all captured emails have their HTML body sanitized to prevent XSS attacks."
          />
          <Separator />
          <SwitchRow
            label="Block Dangerous Attachments"
            description="Reject files with risky extensions (.exe, .bat, .cmd, .js, .vbs, etc.)"
            checked={policy.dangerousAttachmentsBlocked ?? true}
            onCheckedChange={(v) => update('dangerousAttachmentsBlocked', v)}
            disabled={disabled}
          />
          <Separator />
          <SwitchRow
            label="Malware Scan Required"
            description="Require antivirus scan before archiving (ClamAV integration)"
            checked={policy.malwareScanRequired ?? true}
            onCheckedChange={(v) => update('malwareScanRequired', v)}
            disabled={disabled}
            infoTooltip="Requires ClamAV or compatible antivirus integration. Enable only if antivirus is configured."
          />
          <Separator />
          <SwitchRow
            label="Preserve Original Email File"
            description="Keep the raw .eml/.msg file unmodified alongside the parsed version"
            checked={policy.preserveOriginal ?? true}
            onCheckedChange={(v) => update('preserveOriginal', v)}
            disabled={disabled}
          />
          <Separator />
          <div className="space-y-2 pt-1">
            <Label className="text-sm font-medium">Blocked File Extensions</Label>
            <p className="text-xs text-muted-foreground">Comma-separated list of blocked attachment extensions</p>
            <textarea
              className="w-full min-h-[80px] p-2.5 text-sm border rounded-lg bg-background resize-y focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              value={policy.blockedExtensions ?? ''}
              onChange={(e) => update('blockedExtensions', e.target.value)}
              disabled={disabled}
              placeholder="exe,bat,cmd,scr,js,vbs,wsf,ps1,msi,dll"
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Card 2: Attachments & Routing ── */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Paperclip className="h-4 w-4 text-blue-500" />
            Attachments & Routing
          </CardTitle>
          <CardDescription>How attachments are extracted and organized</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <SwitchRow
            label="Enable Attachment Extraction"
            description="Extract attachments as separate documents linked to the parent email"
            checked={policy.attachmentExtractionEnabled ?? true}
            onCheckedChange={(v) => update('attachmentExtractionEnabled', v)}
            disabled={disabled}
            infoTooltip="Master switch: when disabled, no attachments are extracted regardless of user settings."
          />
          <Separator />
          <SwitchRow
            label="Default: Subfolder for Attachments"
            description="When the user doesn't specify a destination, use a subfolder instead of same folder"
            checked={policy.attachmentSubfolderEnabled ?? false}
            onCheckedChange={(v) => update('attachmentSubfolderEnabled', v)}
            disabled={disabled}
          />
          <Separator />
          <div className="flex items-center justify-between py-1">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Attachment Destination</Label>
              <p className="text-xs text-muted-foreground">Default folder strategy for extracted attachments</p>
            </div>
            <Select
              value={policy.attachmentDestination ?? 'SAME_FOLDER'}
              onValueChange={(v) => update('attachmentDestination', v)}
              disabled={disabled}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SAME_FOLDER">Same Folder</SelectItem>
                <SelectItem value="SUBFOLDER">Subfolder</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <SwitchRow
            label="Auto-Start Workflow"
            description="Automatically trigger a workflow when an email is captured"
            checked={policy.workflowAutoStartEnabled ?? false}
            onCheckedChange={(v) => update('workflowAutoStartEnabled', v)}
            disabled={disabled}
          />
        </CardContent>
      </Card>

      {/* ── Card 3: Sync & Limits ── */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <RefreshCw className="h-4 w-4 text-green-500" />
            Sync & Limits
          </CardTitle>
          <CardDescription>Mailbox synchronization governance and resource limits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <SwitchRow
            label="Allow User Mailbox Sync"
            description="Users can connect their own mailboxes for automatic email capture"
            checked={policy.userMailboxSyncAllowed ?? true}
            onCheckedChange={(v) => update('userMailboxSyncAllowed', v)}
            disabled={disabled}
          />
          <Separator />
          <SwitchRow
            label="Allow Full Mailbox Sync"
            description="Users can trigger a one-shot fetch of ALL emails (entire mailbox history)"
            checked={policy.fullMailboxSyncAllowed ?? false}
            onCheckedChange={(v) => update('fullMailboxSyncAllowed', v)}
            disabled={disabled}
            infoTooltip="When disabled, users can only fetch by date range (e.g., last 30 days). Full sync is blocked."
          />
          <Separator />
          <SwitchRow
            label="Require Admin Approval"
            description="Workspace/shared mailbox connections need admin approval before sync starts"
            checked={policy.requireAdminApprovalForSync ?? false}
            onCheckedChange={(v) => update('requireAdminApprovalForSync', v)}
            disabled={disabled}
          />
          <Separator />

          <div className="grid grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <Label className="text-sm">Max Mailboxes Per User</Label>
              <Input
                type="number" min={1} max={50}
                value={policy.maxMailboxesPerUser ?? 3}
                onChange={(e) => update('maxMailboxesPerUser', parseInt(e.target.value) || 3)}
                disabled={disabled}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Max Emails Per Sync Batch</Label>
              <Input
                type="number" min={10} max={1000}
                value={policy.maxEmailsPerSync ?? 100}
                onChange={(e) => update('maxEmailsPerSync', parseInt(e.target.value) || 100)}
                disabled={disabled}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Max Attachment Size (MB)</Label>
              <Input
                type="number" min={1} max={500}
                value={Math.round((policy.maxAttachmentSizeBytes ?? 25 * 1024 * 1024) / (1024 * 1024))}
                onChange={(e) => update('maxAttachmentSizeBytes', (parseInt(e.target.value) || 25) * 1024 * 1024)}
                disabled={disabled}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Max Email Total Size (MB)</Label>
              <Input
                type="number" min={1} max={1000}
                value={Math.round((policy.maxEmailTotalSizeBytes ?? 150 * 1024 * 1024) / (1024 * 1024))}
                onChange={(e) => update('maxEmailTotalSizeBytes', (parseInt(e.target.value) || 150) * 1024 * 1024)}
                disabled={disabled}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-2 pt-1">
            <Label className="text-sm font-medium">Allowed Providers</Label>
            <p className="text-xs text-muted-foreground">Comma-separated list of allowed email providers</p>
            <Input
              value={policy.allowedProviders ?? 'MICROSOFT_365_IMAP,GMAIL_IMAP,GENERIC_IMAP'}
              onChange={(e) => update('allowedProviders', e.target.value)}
              disabled={disabled}
              placeholder="MICROSOFT_365_IMAP,GMAIL_IMAP,GENERIC_IMAP"
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between py-1">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Duplicate Handling</Label>
              <p className="text-xs text-muted-foreground">What happens when a duplicate email (same Message-ID) is ingested</p>
            </div>
            <Select
              value={policy.duplicateHandling ?? 'REJECT'}
              onValueChange={(v) => update('duplicateHandling', v)}
              disabled={disabled}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="REJECT">Reject</SelectItem>
                <SelectItem value="ALLOW">Allow</SelectItem>
                <SelectItem value="VERSION">New Version</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* ── Card 4: Compliance & Audit ── */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Scale className="h-4 w-4 text-purple-500" />
            Compliance & Audit
          </CardTitle>
          <CardDescription>Legal compliance, immutability, and audit trail settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <SwitchRow
            label="Content Immutability"
            description="Email content cannot be modified after capture (blocks rename, version upload, move)"
            checked={policy.contentImmutable ?? true}
            onCheckedChange={(v) => update('contentImmutable', v)}
            disabled={disabled}
            infoTooltip="When enabled, archived emails become read-only. Users cannot rename, upload new versions, or move them."
          />
          <Separator />
          <SwitchRow
            label="Audit Email Capture Events"
            description="Log every email capture to the audit trail"
            checked={policy.auditCaptureEvent ?? true}
            onCheckedChange={(v) => update('auditCaptureEvent', v)}
            disabled={disabled}
          />
          <Separator />
          <SwitchRow
            label="Audit Metadata Edits"
            description="Log every metadata change on archived emails"
            checked={policy.metadataEditsAudited ?? true}
            onCheckedChange={(v) => update('metadataEditsAudited', v)}
            disabled={disabled}
          />
          <Separator />
          <SwitchRow
            label="Records Declaration Enabled"
            description="Allow users to declare archived emails as formal records (for legal/regulatory compliance)"
            checked={policy.recordsDeclarationEnabled ?? false}
            onCheckedChange={(v) => update('recordsDeclarationEnabled', v)}
            disabled={disabled}
          />
        </CardContent>
      </Card>
    </div>
  );
}
