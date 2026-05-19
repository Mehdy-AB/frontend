'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Mail, FolderOpen, Paperclip, Save, Loader2,
  Check, Shield, Settings2,
  Upload, Search, X, FileText, Wifi, WifiOff, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
import MailboxSyncSection from './MailboxSyncSection';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';

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
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
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

  // Model state
  const [availableModels, setAvailableModels] = useState<FilingCategoryResponseDto[]>([]);
  const [selectedModelName, setSelectedModelName] = useState<string>('');
  const [modelSearch, setModelSearch] = useState('');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const modelDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    loadData();
  }, []);

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
      setTimeout(() => { setSaved(false); setShowSettingsDialog(false); }, 1200);
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
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-3" />
          <p className="text-sm text-gray-400 font-medium">Loading email capture settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ═══════════ HEADER — matches Workspace page exactly ═══════════ */}
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-gray-100">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                <Mail className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Email Capture</h1>
                <p className="text-gray-500 text-sm font-medium">Automated mailbox sync and manual email archival</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Stats counters */}
            <div className="flex gap-3">
              {folderName && (
                <div className="flex flex-col items-center px-4 py-2 bg-white rounded-2xl border border-gray-100 shadow-sm min-w-[80px]">
                  <FolderOpen className="h-4 w-4 text-blue-500 mb-0.5" />
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider truncate max-w-[100px]">{folderName}</span>
                </div>
              )}
              {selectedModelName && (
                <div className="flex flex-col items-center px-4 py-2 bg-white rounded-2xl border border-gray-100 shadow-sm min-w-[80px]">
                  <FileText className="h-4 w-4 text-indigo-500 mb-0.5" />
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider truncate max-w-[100px]">{selectedModelName}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Bar — tabs-style, matches Workspace page */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Info pills */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg text-xs font-medium text-gray-500">
              <Paperclip className="h-3.5 w-3.5" />
              {settings.autoExtractAttachments ? 'Auto-extract ON' : 'No extraction'}
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg text-xs font-medium text-gray-500">
              <Mail className="h-3.5 w-3.5" />
              {settings.preferHtmlBody ? 'HTML body' : 'Plain text'}
            </div>
            {settings.notifyOnCapture && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-lg text-xs font-medium text-emerald-600">
                <Zap className="h-3.5 w-3.5" />
                Notifications
              </div>
            )}
          </div>

          {/* Action buttons — gradient style like Workspace page */}
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm"
              onClick={() => setShowSettingsDialog(true)}
              className="h-10 px-4 border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors rounded-xl">
              <Settings2 className="h-4 w-4 mr-2" />Settings
            </Button>
            <Button
              onClick={() => setShowCaptureDialog(true)}
              className="h-10 px-6 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-300 rounded-xl border-0">
              <Upload className="h-4 w-4 mr-2" />Capture Email
            </Button>
          </div>
        </div>
      </div>

      {/* ═══════════ MAILBOX CONNECTIONS ═══════════ */}
      <MailboxSyncSection
        defaultFolderId={settings.defaultFolderId}
        defaultFolderName={folderName}
        defaultModelId={settings.defaultFilingCategoryId ?? undefined}
        defaultModelName={selectedModelName}
        defaultAttachmentDest={settings.attachmentDestination}
        defaultAutoExtract={settings.autoExtractAttachments}
        availableModels={availableModels}
      />

      {/* Governance footer */}
      <div className="flex items-start gap-3 px-5 py-4 rounded-2xl bg-gray-50 border border-gray-100">
        <div className="h-8 w-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
          <Shield className="h-4 w-4 text-gray-400" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-700">Enterprise Governance</h4>
          <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
            Email capture is governed by workspace-level policies. Maximum attachment sizes, duplicate
            detection rules, and blocked file extensions are enforced by your administrator.
          </p>
        </div>
      </div>

      {/* ═══════════ SETTINGS DIALOG ═══════════ */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Settings2 className="h-4 w-4 text-white" />
              </div>
              Default Configuration
            </DialogTitle>
            <DialogDescription>
              These defaults apply to new mailbox connections and manual captures unless overridden.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Default Folder */}
            <div>
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-1.5 mb-2">
                <FolderOpen className="h-4 w-4 text-blue-500/60" /> Default Folder
              </Label>
              <button
                onClick={() => setShowFolderPicker(true)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-blue-300 transition-all text-left group"
              >
                <div className="p-1.5 rounded-lg bg-blue-50 group-hover:bg-blue-100 transition-colors">
                  <FolderOpen className="h-3.5 w-3.5 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  {folderName ? (
                    <>
                      <p className="text-sm font-medium text-gray-900 truncate">{folderName}</p>
                      <p className="text-xs text-gray-400">Click to change</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-gray-500">No folder selected</p>
                      <p className="text-xs text-gray-400">Click to choose</p>
                    </>
                  )}
                </div>
              </button>
            </div>

            {/* Default Model */}
            <div>
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-1.5 mb-2">
                <FileText className="h-4 w-4 text-blue-500/60" /> Default Document Model
              </Label>
              {selectedModelName ? (
                <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-blue-50 border border-blue-200">
                  <div className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-blue-500" />
                    <span className="text-sm font-medium text-gray-900">{selectedModelName}</span>
                  </div>
                  <button onClick={clearModel} className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors">
                    <X className="h-3.5 w-3.5 text-gray-500" />
                  </button>
                </div>
              ) : (
                <div ref={modelDropdownRef} className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      value={modelSearch}
                      onChange={(e) => { setModelSearch(e.target.value); setIsModelDropdownOpen(true); }}
                      onFocus={() => setIsModelDropdownOpen(true)}
                      placeholder="Search models..."
                      className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-gray-200 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-blue-300 transition-colors"
                    />
                  </div>
                  {isModelDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
                      {filteredModels.length === 0 ? (
                        <p className="px-4 py-3 text-sm text-gray-500">No models found</p>
                      ) : (
                        filteredModels.map(model => (
                          <button
                            key={model.id}
                            onClick={() => handleModelSelect(model)}
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2.5"
                          >
                            <FileText className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-gray-900">{model.name}</p>
                              {model.description && (
                                <p className="text-[11px] text-gray-500 truncate">{model.description}</p>
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Attachment Handling */}
            <div className="space-y-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-blue-500/60" />
                <Label className="text-sm font-medium text-gray-700">Attachment Handling</Label>
              </div>
              <ToggleRow
                label="Automatically Extract Attachments"
                description="Extract attachments from emails and store them as governed documents."
                checked={settings.autoExtractAttachments ?? true}
                onChange={(v) => setSettings(prev => ({ ...prev, autoExtractAttachments: v }))}
              />
              {settings.autoExtractAttachments && (
                <div className="space-y-2 pl-1 pt-1">
                  {DESTINATIONS.map(dest => (
                    <label
                      key={dest.value}
                      className={`flex items-start gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer transition-all ${settings.attachmentDestination === dest.value
                          ? 'bg-blue-50 border border-blue-200 shadow-sm'
                          : 'hover:bg-white border border-transparent'
                        }`}
                    >
                      <input
                        type="radio" name="attDest" value={dest.value}
                        checked={settings.attachmentDestination === dest.value}
                        onChange={() => setSettings(prev => ({ ...prev, attachmentDestination: dest.value }))}
                        className="mt-0.5 text-blue-500 focus:ring-blue-500/20"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{dest.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{dest.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Email Preferences */}
            <div className="space-y-1">
              <ToggleRow
                label="Prefer HTML Body"
                description="Show the rich HTML version by default when viewing emails."
                checked={settings.preferHtmlBody ?? true}
                onChange={(v) => setSettings(prev => ({ ...prev, preferHtmlBody: v }))}
              />
              <ToggleRow
                label="Capture Notifications"
                description="Receive a notification each time an email is successfully captured."
                checked={settings.notifyOnCapture ?? true}
                onChange={(v) => setSettings(prev => ({ ...prev, notifyOnCapture: v }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettingsDialog(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}
              className="gap-2 rounded-xl min-w-[120px] bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border-0">
              {saving ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
              ) : saved ? (
                <><Check className="h-4 w-4" /> Saved!</>
              ) : (
                <><Save className="h-4 w-4" /> Save</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modals */}
      {showFolderPicker && (
        <FolderPickerModal
          isOpen={showFolderPicker}
          onClose={() => setShowFolderPicker(false)}
          onSelect={handleFolderSelect}
        />
      )}

      <EmailCaptureDialog
        isOpen={showCaptureDialog}
        onClose={() => setShowCaptureDialog(false)}
        folderId={settings.defaultFolderId}
        folderName={folderName}
        defaultModelId={settings.defaultFilingCategoryId ?? undefined}
        onSuccess={() => setShowCaptureDialog(false)}
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
      className="flex items-center justify-between gap-4 px-3.5 py-3 rounded-xl hover:bg-white transition-colors cursor-pointer"
      onClick={() => onChange(!checked)}
    >
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-blue-500' : 'bg-gray-300'
          }`}
        onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'
          }`} />
      </button>
    </div>
  );
}
