'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Mail, FolderOpen, Paperclip, Save, Loader2,
  Check, Shield, ChevronRight, Settings2, Info,
  ToggleLeft, ToggleRight, Upload, ArrowRight,
  Search, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNotification } from '@/contexts/NotificationContext';
import {
  emailCaptureService,
  UserEmailCaptureSettingsData,
  AttachmentDestination,
} from '@/api/services/emailCaptureService';
import { filingCategoryService } from '@/api/services/filingCategoryService';
import { FilingCategoryResponseDto } from '@/types/api';
import FolderPickerModal from '@/components/modals/FolderPickerModal';
import EmailCaptureDialog from '@/components/modals/EmailCaptureDialog';

const DESTINATIONS: { value: AttachmentDestination; label: string; desc: string }[] = [
  { value: 'SAME_FOLDER', label: 'Same folder as email', desc: 'Attachments stored alongside the email document' },
  { value: 'SUBFOLDER', label: 'Auto-created sub-folder', desc: 'A "_attachments" sub-folder is created automatically' }
];

export default function EmailCaptureSettingsTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [showCaptureDialog, setShowCaptureDialog] = useState(false);
  const { addNotification } = useNotification();
  const hasLoadedRef = useRef(false);

  // Settings form state
  const [settings, setSettings] = useState<UserEmailCaptureSettingsData>({
    defaultFolderId: undefined,
    defaultWorkspaceId: undefined,
    defaultContentType: 'EMAIL',
    defaultFilingCategoryId: undefined,
    autoExtractAttachments: true,
    attachmentDestination: 'SAME_FOLDER',
    notifyOnCapture: true,
    preferHtmlBody: true,
  });
  const [folderName, setFolderName] = useState<string>('');

  // Model state for settings
  const [availableModels, setAvailableModels] = useState<FilingCategoryResponseDto[]>([]);
  const [selectedModelName, setSelectedModelName] = useState<string>('');
  const [modelSearch, setModelSearch] = useState('');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const modelDropdownRef = useRef<HTMLDivElement>(null);

  // Load settings and models
  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    loadData();
  }, []);

  // Handle clicking outside model dropdown
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target as Node)) {
        setIsModelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [data, modelsRes] = await Promise.all([
        emailCaptureService.getSettings(),
        filingCategoryService.getAllFilingCategories({ size: 100 })
      ]);

      setSettings({
        defaultFolderId: data.defaultFolderId ?? undefined,
        defaultWorkspaceId: data.defaultWorkspaceId ?? undefined,
        defaultContentType: data.defaultContentType || 'EMAIL',
        defaultFilingCategoryId: data.defaultFilingCategoryId ?? undefined,
        autoExtractAttachments: data.autoExtractAttachments ?? true,
        attachmentDestination: data.attachmentDestination || 'SAME_FOLDER',
        notifyOnCapture: data.notifyOnCapture ?? true,
        preferHtmlBody: data.preferHtmlBody ?? true,
      });
      setFolderName(data.defaultFolderName || '');
      setSelectedModelName(data.defaultFilingCategoryName || '');
      setAvailableModels(modelsRes.content || []);
    } catch {
      // No settings exist yet — use defaults
    } finally {
      setLoading(false);
    }
  };

  const filteredModels = availableModels.filter(m =>
    m.name.toLowerCase().includes(modelSearch.toLowerCase())
  );

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaved(false);
      await emailCaptureService.updateSettings(settings);
      setSaved(true);
      addNotification({ type: 'success', title: 'Settings Saved', message: 'Your email capture preferences have been updated.' });
      setTimeout(() => setSaved(false), 2000);
    } catch (error: any) {
      addNotification({ type: 'error', title: 'Error', message: error?.message || 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleFolderSelect = (folderId: number, name: string, path: string) => {
    setSettings(prev => ({ ...prev, defaultFolderId: folderId }));
    setFolderName(name);
    setShowFolderPicker(false);
  };

  const handleModelSelect = (model: FilingCategoryResponseDto) => {
    setSettings(prev => ({ ...prev, defaultFilingCategoryId: model.id }));
    setSelectedModelName(model.name);
    setModelSearch('');
    setIsModelDropdownOpen(false);
  };

  const clearModel = () => {
    setSettings(prev => ({ ...prev, defaultFilingCategoryId: undefined }));
    setSelectedModelName('');
    setModelSearch('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading email capture settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 settings-section-enter">

      {/* ── Capture Email Action Card ── */}
      <Card className="rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-150 border-primary/20 overflow-hidden bg-gradient-to-r from-primary/5 via-primary/3 to-transparent">
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Capture Email</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Upload an .eml or .msg file to archive it as a governed document
                  {folderName && <span> in <strong>{folderName}</strong></span>}.
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowCaptureDialog(true)}
              className="gap-2 rounded-xl px-5 min-w-[160px] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
              size="lg"
            >
              <Upload className="h-4 w-4" />
              Capture Email
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Default Capture Folder ── */}
      <Card className="rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-150 border-border/50 overflow-hidden">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="flex items-center gap-2.5 text-lg font-semibold">
            <FolderOpen className="h-5 w-5 text-primary/80" />
            Default Capture Folder
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Emails will be captured to this folder by default. You can override this per capture.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-2">
          <button
            onClick={() => setShowFolderPicker(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border/60 hover:bg-muted/30 hover:border-primary/30 transition-all text-left group"
          >
            <div className="p-2 rounded-lg bg-primary/5 group-hover:bg-primary/10 transition-colors">
              <FolderOpen className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              {folderName ? (
                <>
                  <p className="text-sm font-medium text-foreground truncate">{folderName}</p>
                  <p className="text-xs text-muted-foreground">Click to change</p>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">No folder selected</p>
                  <p className="text-xs text-muted-foreground">Click to choose a default folder</p>
                </>
              )}
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </button>
        </CardContent>
      </Card>

      {/* ── Default Document Model ── */}
      <Card className="rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-150 border-border/50 overflow-hidden">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="flex items-center gap-2.5 text-lg font-semibold">
            <FolderOpen className="h-5 w-5 text-primary/80" />
            Default Document Model
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Select a default filing category (model) for captured emails. The model defines metadata fields that get auto-populated from email headers.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-2">
          {selectedModelName ? (
            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">{selectedModelName}</span>
              </div>
              <button onClick={clearModel} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          ) : (
            <div ref={modelDropdownRef} className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  value={modelSearch}
                  onChange={(e) => { setModelSearch(e.target.value); setIsModelDropdownOpen(true); }}
                  onFocus={() => setIsModelDropdownOpen(true)}
                  placeholder="Search models..."
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-border/60 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-primary/30 transition-colors"
                />
              </div>
              {isModelDropdownOpen && (
                <div className="absolute z-50 w-full mt-1.5 bg-popover border border-border rounded-xl shadow-lg max-h-56 overflow-y-auto">
                  {filteredModels.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-muted-foreground">No models found</p>
                  ) : (
                    filteredModels.map(model => (
                      <button
                        key={model.id}
                        onClick={() => handleModelSelect(model)}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors flex items-center gap-2.5"
                      >
                        <FolderOpen className="h-3.5 w-3.5 text-primary/50 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{model.name}</p>
                          {model.description && (
                            <p className="text-[11px] text-muted-foreground truncate">{model.description}</p>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Email Preferences ── */}
      <Card className="rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-150 border-border/50 overflow-hidden">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="flex items-center gap-2.5 text-lg font-semibold">
            <Mail className="h-5 w-5 text-primary/80" />
            Email Preferences
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Configure how emails are displayed and notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-2 space-y-5">

          {/* Prefer HTML */}
          <ToggleRow
            label="Prefer HTML Body"
            description="When viewing emails, show the rich HTML version by default instead of plain text."
            checked={settings.preferHtmlBody ?? true}
            onChange={(v) => setSettings(prev => ({ ...prev, preferHtmlBody: v }))}
          />

          {/* Notify on capture */}
          <ToggleRow
            label="Capture Notifications"
            description="Receive a notification each time an email is successfully captured."
            checked={settings.notifyOnCapture ?? true}
            onChange={(v) => setSettings(prev => ({ ...prev, notifyOnCapture: v }))}
          />
        </CardContent>
      </Card>

      {/* ── Attachment Handling ── */}
      <Card className="rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-150 border-border/50 overflow-hidden">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="flex items-center gap-2.5 text-lg font-semibold">
            <Paperclip className="h-5 w-5 text-primary/80" />
            Attachment Handling
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Configure how attachments are extracted from emails.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-2 space-y-5">

          {/* Auto extract toggle */}
          <ToggleRow
            label="Automatically Extract Attachments"
            description="Extract attachments from emails and store them as independent governed documents."
            checked={settings.autoExtractAttachments ?? true}
            onChange={(v) => setSettings(prev => ({ ...prev, autoExtractAttachments: v }))}
          />

          {/* Destination */}
          {settings.autoExtractAttachments && (
            <div className="space-y-2 pl-1">
              <Label className="text-sm font-medium text-foreground">Attachment Storage Location</Label>
              <div className="space-y-2">
                {DESTINATIONS.map(dest => (
                  <label
                    key={dest.value}
                    className={`flex items-start gap-3 px-3.5 py-3 rounded-xl cursor-pointer transition-all ${
                      settings.attachmentDestination === dest.value
                        ? 'bg-primary/5 border border-primary/20 shadow-sm'
                        : 'hover:bg-muted/30 border border-transparent'
                    }`}
                  >
                    <input
                      type="radio"
                      name="attDest"
                      value={dest.value}
                      checked={settings.attachmentDestination === dest.value}
                      onChange={() => setSettings(prev => ({ ...prev, attachmentDestination: dest.value }))}
                      className="mt-0.5 text-primary focus:ring-primary/20"
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">{dest.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{dest.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Governance Info ── */}
      <Card className="rounded-2xl shadow-sm border-border/50 overflow-hidden bg-muted/20">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/5">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">Enterprise Governance</h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Email capture is governed by workspace-level policies set by your administrator. These include
                maximum attachment sizes, duplicate detection rules, and blocked file extensions. Your personal
                preferences work within these policy boundaries.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Save Button ── */}
      <div className="flex justify-end pt-2 pb-4">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="gap-2 rounded-xl min-w-[160px] transition-all duration-150 hover:-translate-y-0.5"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : saved ? (
            <>
              <Check className="h-4 w-4" />
              Saved!
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Preferences
            </>
          )}
        </Button>
      </div>

      {/* Folder Picker */}
      {showFolderPicker && (
        <FolderPickerModal
          isOpen={showFolderPicker}
          onClose={() => setShowFolderPicker(false)}
          onSelect={handleFolderSelect}
        />
      )}

      {/* Email Capture Dialog — uses saved settings as defaults */}
      <EmailCaptureDialog
        isOpen={showCaptureDialog}
        onClose={() => setShowCaptureDialog(false)}
        folderId={settings.defaultFolderId}
        folderName={folderName}
        defaultModelId={settings.defaultFilingCategoryId}
        onSuccess={() => {
          setShowCaptureDialog(false);
        }}
      />
    </div>
  );
}

// ── Toggle Row Helper ──
function ToggleRow({ label, description, checked, onChange }: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div
      className="flex items-center justify-between gap-4 px-3.5 py-3 rounded-xl hover:bg-muted/20 transition-colors cursor-pointer"
      onClick={() => onChange(!checked)}
    >
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
          checked ? 'bg-primary' : 'bg-muted-foreground/30'
        }`}
        onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`} />
      </button>
    </div>
  );
}
