'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Mail, Upload, X, Paperclip, User, Users, Clock, Tag,
  ChevronRight, Shield, AlertTriangle, Check, Loader2,
  FolderOpen, Archive, FileText, ChevronDown, Search, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { useNotifications } from '@/hooks/useNotifications';
import {
  emailCaptureService,
  EmailCapturePreviewResponse,
  EmailCaptureResponse,
  AttachmentDestination,
  AttachmentPreview,
  MetadataValueDto
} from '@/api/services/emailCaptureService';
import { filingCategoryService } from '@/api/services/filingCategoryService';
import { documentService } from '@/api/services/documentService';
import { FilingCategoryResponseDto, TagResponseDto } from '@/types/api';
import FolderPickerModal from './FolderPickerModal';

interface EmailCaptureDialogProps {
  isOpen: boolean;
  onClose: () => void;
  folderId?: number;
  folderName?: string;
  defaultModelId?: number | null;
  onSuccess?: (response: EmailCaptureResponse) => void;
}

type CaptureStep = 'upload' | 'preview' | 'capturing' | 'complete';

const ATTACHMENT_DESTINATIONS: { value: AttachmentDestination; label: string; description: string }[] = [
  { value: 'SAME_FOLDER', label: 'Same folder as email', description: 'Store attachments alongside the .eml document' },
  { value: 'SUBFOLDER', label: 'Auto-created sub-folder', description: 'Create a "_attachments" sub-folder' }
];

const formatBytes = (bytes: number): string => {
  if (!bytes || bytes === 0) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

/**
 * Map of metadata field keys to email preview data.
 * Used for auto-populating model fields from parsed email headers.
 */
const EMAIL_METADATA_MAP: Record<string, (preview: EmailCapturePreviewResponse) => string> = {
  'sender': (p) => p.fromAddress || '',
  'from': (p) => p.fromAddress || '',
  'from_address': (p) => p.fromAddress || '',
  'recipients': (p) => p.toAddresses?.join(', ') || '',
  'to': (p) => p.toAddresses?.join(', ') || '',
  'to_address': (p) => p.toAddresses?.join(', ') || '',
  'cc': (p) => p.ccAddresses?.join(', ') || '',
  'subject': (p) => p.subject || '',
  'email_subject': (p) => p.subject || '',
  'sent date': (p) => p.sentAt || '',
  'sent_date': (p) => p.sentAt || '',
  'sent_at': (p) => p.sentAt || '',
  'received date': (p) => p.receivedAt || '',
  'received_date': (p) => p.receivedAt || '',
  'received_at': (p) => p.receivedAt || '',
  'importance': (p) => p.importance || 'Normal',
  'priority': (p) => p.importance || 'Normal',
  'format': (p) => p.originalFormat?.toUpperCase() || '',
  'email_format': (p) => p.originalFormat?.toUpperCase() || '',
  'attachment count': (p) => String(p.attachmentCount || 0),
  'attachment_count': (p) => String(p.attachmentCount || 0),
};

export default function EmailCaptureDialog({
  isOpen, onClose, folderId, folderName, defaultModelId, onSuccess
}: EmailCaptureDialogProps) {
  // Step state
  const [step, setStep] = useState<CaptureStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<EmailCapturePreviewResponse | null>(null);
  const [parsing, setParsing] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [result, setResult] = useState<EmailCaptureResponse | null>(null);

  // Capture options
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(folderId || null);
  const [selectedFolderName, setSelectedFolderName] = useState<string>(folderName || '');
  const [extractAttachments, setExtractAttachments] = useState(true);
  const [attachmentDestination, setAttachmentDestination] = useState<AttachmentDestination>('SAME_FOLDER');
  const [showFolderPicker, setShowFolderPicker] = useState(false);

  // Model (Filing Category)
  const [availableModels, setAvailableModels] = useState<FilingCategoryResponseDto[]>([]);
  const [selectedModel, setSelectedModel] = useState<FilingCategoryResponseDto | null>(null);
  const [modelSearch, setModelSearch] = useState('');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [modelMetadata, setModelMetadata] = useState<MetadataValueDto[]>([]);

  // Tags
  const [availableTags, setAvailableTags] = useState<TagResponseDto[]>([]);
  const [selectedTags, setSelectedTags] = useState<TagResponseDto[]>([]);
  const [tagSearch, setTagSearch] = useState('');
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const tagDropdownRef = useRef<HTMLDivElement>(null);
  const { showSuccess, showError } = useNotifications();

  // Reset state AND load models/tags when dialog opens — single effect to avoid race conditions
  useEffect(() => {
    if (!isOpen) return;

    // Step 1: Reset everything synchronously
    setStep('upload');
    setFile(null);
    setPreview(null);
    setResult(null);
    setParsing(false);
    setCapturing(false);
    setSelectedFolderId(folderId || null);
    setSelectedFolderName(folderName || '');
    setExtractAttachments(true);
    setAttachmentDestination('SAME_FOLDER');
    setSelectedModel(null);
    setModelSearch('');
    setModelMetadata([]);
    setSelectedTags([]);
    setTagSearch('');

    // Step 2: Load models and tags, then auto-select default model
    const loadData = async () => {
      try {
        const [modelsRes, tagsRes] = await Promise.all([
          filingCategoryService.getAllFilingCategories({ size: 100 }),
          documentService.getAvailableTags()
        ]);
        setAvailableModels(modelsRes.content || []);
        setAvailableTags(Array.isArray(tagsRes) ? tagsRes : []);

        // Auto-select default model AFTER reset — no race condition
        if (defaultModelId && modelsRes.content) {
          const defaultModel = modelsRes.content.find((m: FilingCategoryResponseDto) => m.id === defaultModelId);
          if (defaultModel) {
            setSelectedModel(defaultModel);
            setModelSearch('');
            setIsModelDropdownOpen(false);
            // Initialize empty metadata (will be auto-populated when email is previewed)
            const meta = (defaultModel.metadataDefinitions || []).map((def: any) => ({
              id: def.id,
              value: ''
            }));
            setModelMetadata(meta);
          }
        }
      } catch (err) {
        console.error('Failed to load models/tags:', err);
      }
    };
    loadData();
  }, [isOpen, folderId, folderName, defaultModelId]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target as Node)) {
        setIsModelDropdownOpen(false);
      }
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target as Node)) {
        setIsTagDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ── File handling ──
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
  };

  const handleFileSelect = async (selectedFile: File) => {
    const name = selectedFile.name.toLowerCase();
    if (!name.endsWith('.eml') && !name.endsWith('.msg')) {
      showError('Unsupported File', 'Only .eml and .msg email files are accepted.');
      return;
    }

    setFile(selectedFile);
    setParsing(true);
    setStep('preview');

    try {
      const previewData = await emailCaptureService.preview(selectedFile);
      setPreview(previewData);

      // Auto-populate model metadata if a model is already selected
      if (selectedModel) {
        autoPopulateMetadata(selectedModel, previewData);
      }
    } catch (err: any) {
      showError('Parsing Failed', err?.message || 'Failed to parse email file');
      setStep('upload');
      setFile(null);
    } finally {
      setParsing(false);
    }
  };

  // ── Model handling ──
  const handleModelSelect = (model: FilingCategoryResponseDto) => {
    setSelectedModel(model);
    setModelSearch('');
    setIsModelDropdownOpen(false);

    // Initialize metadata fields from model definitions
    if (preview) {
      autoPopulateMetadata(model, preview);
    } else {
      // No preview yet — initialize empty metadata
      const meta = (model.metadataDefinitions || []).map((def: any) => ({
        id: def.id,
        value: ''
      }));
      setModelMetadata(meta);
    }
  };

  const autoPopulateMetadata = (model: FilingCategoryResponseDto, emailPreview: EmailCapturePreviewResponse) => {
    const meta = (model.metadataDefinitions || []).map((def: any) => {
      const key = def.key?.toLowerCase().trim() || '';
      const mapper = EMAIL_METADATA_MAP[key];
      return {
        id: def.id,
        value: mapper ? mapper(emailPreview) : ''
      };
    });
    setModelMetadata(meta);
  };

  const clearModel = () => {
    setSelectedModel(null);
    setModelMetadata([]);
    setModelSearch('');
  };

  const updateMetadataValue = (defId: number, value: string) => {
    setModelMetadata(prev =>
      prev.map(m => m.id === defId ? { ...m, value } : m)
    );
  };

  // ── Tag handling ──
  const handleTagSelect = (tag: TagResponseDto) => {
    if (!selectedTags.some(t => t.id === tag.id)) {
      setSelectedTags(prev => [...prev, tag]);
    }
    setTagSearch('');
    setIsTagDropdownOpen(false);
  };

  const handleTagRemove = (tagId: number) => {
    setSelectedTags(prev => prev.filter(t => t.id !== tagId));
  };

  // ── Capture ──
  const handleCapture = async () => {
    if (!file || !selectedFolderId) {
      showError('Missing Info', 'Please select a destination folder.');
      return;
    }

    // Client-side validation: Ensure all mandatory metadata fields are filled
    if (selectedModel && selectedModel.metadataDefinitions) {
      const missingFields = selectedModel.metadataDefinitions
        .filter((def: any) => def.mandatory)
        .filter((def: any) => {
          const metaVal = modelMetadata.find(m => m.id === def.id);
          return !metaVal || !metaVal.value || metaVal.value.trim() === '';
        })
        .map((def: any) => def.key);

      if (missingFields.length > 0) {
        showError('Required Metadata Missing', `Please fill in the following required fields for the "${selectedModel.name}" model: ${missingFields.join(', ')}`);
        return;
      }
    }

    setCapturing(true);
    setStep('capturing');

    try {
      // Only send metadata entries that have actual values (filter out empty auto-populated fields)
      const filteredMetadata = selectedModel
        ? modelMetadata.filter(m => m.value && m.value.trim() !== '')
        : undefined;

      const response = await emailCaptureService.capture(file, selectedFolderId, {
        extractAttachments,
        attachmentDestination,
        filingCategoryId: selectedModel?.id,
        metadata: filteredMetadata && filteredMetadata.length > 0 ? filteredMetadata : undefined,
        tagIds: selectedTags.length > 0 ? selectedTags.map(t => t.id) : undefined,
      });
      setResult(response);
      setStep('complete');
      showSuccess('Email Captured', `"${response.subject}" archived successfully with ${response.attachmentCount} attachment(s).`);
      onSuccess?.(response);
    } catch (err: any) {
      showError('Capture Failed', err?.message || 'Failed to capture email');
      setStep('preview');
    } finally {
      setCapturing(false);
    }
  };

  // ── Folder picked callback ──
  const handleFolderSelect = (id: number, name: string, path: string) => {
    setSelectedFolderId(id);
    setSelectedFolderName(name);
    setShowFolderPicker(false);
  };

  // ── Filtered models/tags (client-side, same as MetadataTab) ──
  const filteredModels = availableModels.filter(m =>
    m.name.toLowerCase().includes(modelSearch.toLowerCase())
  );
  const filteredTags = availableTags.filter(t =>
    t.name.toLowerCase().includes(tagSearch.toLowerCase()) &&
    !selectedTags.some(st => st.id === t.id)
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !capturing) onClose(); }}>
      <DialogContent showCloseButton={false} className="sm:max-w-2xl p-0 gap-0 rounded-2xl overflow-hidden max-h-[85vh] flex flex-col">

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-foreground m-0 p-0 text-left">Email Capture</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {step === 'upload' && 'Upload an email file to archive'}
                {step === 'preview' && (parsing ? 'Parsing email...' : 'Review and configure capture')}
                {step === 'capturing' && 'Archiving email...'}
                {step === 'complete' && 'Email archived successfully'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
            disabled={capturing}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── STEP INDICATOR ── */}
        <div className="px-6 py-3 border-b border-border/20 bg-muted/20">
          <div className="flex items-center gap-2">
            {['Upload', 'Review & Configure', 'Archive'].map((label, i) => {
              const currentIndex = step === 'upload' ? 0 : step === 'preview' ? 1 : 2;
              const isActive = i === currentIndex;
              const isComplete = i < currentIndex;

              return (
                <div key={label} className="flex items-center gap-2">
                  {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/40" />}
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                    isActive ? 'bg-primary/10 text-primary' :
                    isComplete ? 'bg-emerald-500/10 text-emerald-600' :
                    'text-muted-foreground/60'
                  }`}>
                    {isComplete ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isActive ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/20 text-muted-foreground/60'
                      }`}>{i + 1}</span>
                    )}
                    {label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="flex-1 overflow-y-auto">

          {/* STEP 1: Upload */}
          {step === 'upload' && (
            <div className="p-6">
              <div
                className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 cursor-pointer ${
                  dragActive
                    ? 'border-primary bg-primary/5 scale-[1.01]'
                    : 'border-border/50 hover:border-primary/40 hover:bg-muted/30'
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".eml,.msg"
                  className="hidden"
                  onChange={handleFileInput}
                />
                <div className="flex flex-col items-center gap-3">
                  <div className={`p-4 rounded-2xl transition-colors ${
                    dragActive ? 'bg-primary/15' : 'bg-muted/50'
                  }`}>
                    <Upload className={`h-8 w-8 ${dragActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Drop your email file here or <span className="text-primary">browse</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Supports .eml (RFC 2822) and .msg (Outlook) formats
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick info */}
              <div className="mt-6 grid grid-cols-3 gap-3">
                {[
                  { icon: Shield, label: 'Policy Enforced', desc: 'Size & duplicate checks' },
                  { icon: Archive, label: 'Immutable Archive', desc: 'Content preserved as-is' },
                  { icon: Paperclip, label: 'Auto Extract', desc: 'Attachments as documents' },
                ].map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/30 border border-border/30">
                    <Icon className="h-4 w-4 text-primary/70 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-foreground">{label}</p>
                      <p className="text-[10px] text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Preview & Configure */}
          {step === 'preview' && (
            <div className="p-6 space-y-5">
              {parsing ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                  <p className="text-sm text-muted-foreground">Parsing email headers...</p>
                </div>
              ) : preview && (
                <>
                  {/* Email Preview Card */}
                  <div className="rounded-xl border border-border/40 overflow-hidden bg-card">
                    <div className="px-4 py-3 bg-gradient-to-r from-primary/5 to-transparent border-b border-border/30">
                      <div className="flex items-start gap-2.5">
                        <Mail className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <h3 className="text-sm font-semibold text-foreground truncate">
                          {preview.subject || '(No Subject)'}
                        </h3>
                      </div>
                    </div>
                    <div className="p-4 space-y-2">
                      <InfoRow icon={User} label="From" value={preview.fromAddress} />
                      <InfoRow icon={Users} label="To" value={preview.toAddresses?.join(', ') || '—'} />
                      {preview.ccAddresses?.length > 0 && (
                        <InfoRow icon={Users} label="CC" value={preview.ccAddresses.join(', ')} />
                      )}
                      <InfoRow icon={Clock} label="Sent" value={preview.sentAt ? new Date(preview.sentAt).toLocaleString() : '—'} />
                      <div className="flex items-center gap-4 pt-1.5 border-t border-border/20 mt-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted text-muted-foreground text-[10px] font-medium rounded-full">
                          {preview.originalFormat.toUpperCase()}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{formatBytes(preview.totalSizeBytes)}</span>
                        {preview.importance && preview.importance !== 'NORMAL' && (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full ${
                            preview.importance === 'HIGH' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'
                          }`}>
                            <AlertTriangle className="h-2.5 w-2.5" />
                            {preview.importance}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Attachments */}
                    {preview.attachmentCount > 0 && (
                      <div className="px-4 py-3 bg-muted/30 border-t border-border/20">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Paperclip className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs font-medium text-muted-foreground">
                            {preview.attachmentCount} attachment{preview.attachmentCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {preview.attachments?.map((att: AttachmentPreview, i: number) => (
                            <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-card border border-border/30 rounded-md text-[10px] text-foreground">
                              <FileText className="h-2.5 w-2.5 text-muted-foreground" />
                              <span className="truncate max-w-[140px]">{att.filename}</span>
                              <span className="text-muted-foreground">{formatBytes(att.sizeBytes)}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Body preview */}
                    {preview.bodyPreview && (
                      <div className="px-4 py-3 border-t border-border/20">
                        <p className="text-xs text-muted-foreground line-clamp-3 italic">
                          {preview.bodyPreview}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* ── Configuration ── */}
                  <div className="space-y-4">

                    {/* Destination folder */}
                    <div className="rounded-xl border border-border/40 p-4">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                        Destination Folder
                      </label>
                      <button
                        onClick={() => setShowFolderPicker(true)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors text-left"
                      >
                        <FolderOpen className="h-4 w-4 text-primary/70" />
                        <span className={`flex-1 text-sm ${selectedFolderName ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {selectedFolderName || 'Select a folder...'}
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </div>

                    {/* Model (Filing Category) — Searchable */}
                    <div className="rounded-xl border border-border/40 p-4">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                        Document Model
                      </label>
                      {selectedModel ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-primary/5 border border-primary/20">
                            <div className="flex items-center gap-2">
                              <FolderOpen className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium text-foreground">{selectedModel.name}</span>
                            </div>
                            <button onClick={clearModel} className="p-1 hover:bg-muted rounded transition-colors">
                              <X className="h-3 w-3 text-muted-foreground" />
                            </button>
                          </div>

                          {/* Metadata fields from model */}
                          {selectedModel.metadataDefinitions && selectedModel.metadataDefinitions.length > 0 && (
                            <div className="space-y-2 pl-1">
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                                Metadata Fields {preview && <span className="text-emerald-600">(auto-populated from email)</span>}
                              </p>
                              {selectedModel.metadataDefinitions.map((def: any) => {
                                const metaVal = modelMetadata.find(m => m.id === def.id);
                                return (
                                  <div key={def.id} className="flex items-center gap-2">
                                    <label className="text-xs text-muted-foreground w-28 flex-shrink-0 truncate" title={def.key}>
                                      {def.key}
                                      {def.mandatory && <span className="text-destructive ml-0.5">*</span>}
                                    </label>
                                    <Input
                                      value={metaVal?.value || ''}
                                      onChange={(e) => updateMetadataValue(def.id, e.target.value)}
                                      placeholder={def.key}
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div ref={modelDropdownRef} className="relative">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <input
                              value={modelSearch}
                              onChange={(e) => { setModelSearch(e.target.value); setIsModelDropdownOpen(true); }}
                              onFocus={() => setIsModelDropdownOpen(true)}
                              placeholder="Search models..."
                              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-border/50 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary/30"
                            />
                          </div>
                          {isModelDropdownOpen && (
                            <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                              {filteredModels.length === 0 ? (
                                <p className="px-3 py-2 text-xs text-muted-foreground">No models found</p>
                              ) : (
                                filteredModels.map(model => (
                                  <button
                                    key={model.id}
                                    onClick={() => handleModelSelect(model)}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors flex items-center gap-2"
                                  >
                                    <FolderOpen className="h-3.5 w-3.5 text-primary/50 flex-shrink-0" />
                                    <div className="min-w-0">
                                      <p className="truncate font-medium text-foreground">{model.name}</p>
                                      {model.description && (
                                        <p className="text-[10px] text-muted-foreground truncate">{model.description}</p>
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

                    {/* Tags — Searchable multi-select */}
                    <div className="rounded-xl border border-border/40 p-4">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                        Tags
                      </label>
                      {/* Selected tags */}
                      {selectedTags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {selectedTags.map(tag => (
                            <span key={tag.id}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border"
                              style={{
                                backgroundColor: tag.color ? `${tag.color}15` : undefined,
                                borderColor: tag.color || 'var(--border)',
                                color: tag.color || 'var(--foreground)'
                              }}
                            >
                              <Tag className="h-2.5 w-2.5" />
                              {tag.name}
                              <button onClick={() => handleTagRemove(tag.id)} className="ml-0.5 hover:opacity-70">
                                <X className="h-2.5 w-2.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      <div ref={tagDropdownRef} className="relative">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <input
                            value={tagSearch}
                            onChange={(e) => { setTagSearch(e.target.value); setIsTagDropdownOpen(true); }}
                            onFocus={() => setIsTagDropdownOpen(true)}
                            placeholder="Search tags..."
                            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border/50 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary/30"
                          />
                        </div>
                        {isTagDropdownOpen && (
                          <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-36 overflow-y-auto">
                            {filteredTags.length === 0 ? (
                              <p className="px-3 py-2 text-xs text-muted-foreground">No tags found</p>
                            ) : (
                              filteredTags.map(tag => (
                                <button
                                  key={tag.id}
                                  onClick={() => handleTagSelect(tag)}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors flex items-center gap-2"
                                >
                                  <div className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: tag.color || '#888' }}
                                  />
                                  <span className="truncate text-foreground">{tag.name}</span>
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Attachment handling */}
                    {preview.attachmentCount > 0 && (
                      <div className="rounded-xl border border-border/40 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Attachment Handling
                          </label>
                          <label className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity">
                            <span className="text-sm font-medium text-foreground">Extract as documents</span>
                            <Switch
                              checked={extractAttachments}
                              onCheckedChange={setExtractAttachments}
                              className="scale-90"
                            />
                          </label>
                        </div>
                        {extractAttachments && (
                          <div className="space-y-1.5">
                            {ATTACHMENT_DESTINATIONS.map(dest => (
                              <label
                                key={dest.value}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all ${
                                  attachmentDestination === dest.value
                                    ? 'bg-primary/5 border border-primary/20'
                                    : 'hover:bg-muted/30 border border-transparent'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="attachmentDest"
                                  value={dest.value}
                                  checked={attachmentDestination === dest.value}
                                  onChange={(e) => setAttachmentDestination(e.target.value as AttachmentDestination)}
                                  className="text-primary focus:ring-primary/20"
                                />
                                <div>
                                  <p className="text-xs font-medium text-foreground">{dest.label}</p>
                                  <p className="text-[10px] text-muted-foreground">{dest.description}</p>
                                </div>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* STEP 3: Capturing */}
          {step === 'capturing' && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                <div className="relative p-5 rounded-full bg-primary/10">
                  <Archive className="h-8 w-8 text-primary animate-pulse" />
                </div>
              </div>
              <p className="text-sm font-medium text-foreground mt-6">Archiving email...</p>
              <p className="text-xs text-muted-foreground mt-1">Parsing, enforcing policies, extracting attachments</p>
            </div>
          )}

          {/* STEP 4: Complete */}
          {step === 'complete' && result && (
            <div className="p-6 space-y-5">
              <div className="flex flex-col items-center text-center py-6">
                <div className="p-4 rounded-full bg-emerald-500/10 mb-4">
                  <Check className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Email Archived Successfully</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Your email has been captured and stored as a governed document.
                </p>
              </div>

              <div className="rounded-xl border border-border/40 divide-y divide-border/20 overflow-hidden">
                <SummaryRow label="Document" value={result.subject || '(No Subject)'} />
                <SummaryRow label="Document ID" value={`#${result.documentId}`} />
                <SummaryRow label="Folder" value={result.folderPath || selectedFolderName} />
                {selectedModel && <SummaryRow label="Model" value={selectedModel.name} />}
                {selectedTags.length > 0 && <SummaryRow label="Tags" value={selectedTags.map(t => t.name).join(', ')} />}
                <SummaryRow label="Attachments" value={`${result.attachmentCount} extracted`} />
              </div>
            </div>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div className="px-6 py-4 border-t border-border/40 bg-muted/20 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {file && step !== 'upload' && (
              <span className="flex items-center gap-1.5">
                <FileText className="h-3 w-3" />
                {file.name} ({formatBytes(file.size)})
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {step === 'preview' && !parsing && (
              <>
                <Button variant="outline" onClick={() => { setStep('upload'); setFile(null); setPreview(null); }}>
                  Back
                </Button>
                <Button onClick={handleCapture} disabled={!selectedFolderId}>
                  <Archive className="h-4 w-4 mr-1.5" />
                  Capture & Archive
                </Button>
              </>
            )}
            {step === 'complete' && (
              <Button onClick={onClose}>
                Done
              </Button>
            )}
            {step === 'upload' && (
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      </DialogContent>

      {/* Folder Picker Modal */}
      {showFolderPicker && (
        <FolderPickerModal
          isOpen={showFolderPicker}
          onClose={() => setShowFolderPicker(false)}
          onSelect={handleFolderSelect}
        />
      )}
    </Dialog>
  );
}

// ── Helper components ──

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 text-xs">
      <Icon className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
      <span className="text-muted-foreground w-10 flex-shrink-0">{label}:</span>
      <span className="text-foreground truncate">{value}</span>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}
