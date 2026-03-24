'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FileType,
  Check,
  X,
  Search,
  Filter,
  Save,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  ScanLine,
  FileText,
  Image,
  Mail,
  Archive,
  Cog,
  Video,
  Database,
  BookOpen,
  Printer,
  Type
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/useNotifications';
import { fileTypeService, AllowedFileTypeDto } from '@/api/services/fileTypeService';

interface FileTypesTabProps {
  canUpdate?: boolean;
}

const TIER_LABELS: Record<number, { label: string; description: string; color: string }> = {
  1: { label: 'Tier 1 — Core ECM Formats', description: 'Full support: preview, indexing, OCR', color: 'text-green-400' },
  2: { label: 'Tier 2 — Specialized Formats', description: 'Preview allowed, limited processing', color: 'text-yellow-400' },
  3: { label: 'Tier 3 — Storage Only', description: 'No preview, minimal indexing', color: 'text-orange-400' },
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  DOCUMENT: <FileText className="h-4 w-4" />,
  IMAGE: <Image className="h-4 w-4" />,
  EMAIL: <Mail className="h-4 w-4" />,
  ARCHIVE: <Archive className="h-4 w-4" />,
  CAD: <Cog className="h-4 w-4" />,
  MEDIA: <Video className="h-4 w-4" />,
  DATA: <Database className="h-4 w-4" />,
  EBOOK: <BookOpen className="h-4 w-4" />,
  POSTSCRIPT: <Printer className="h-4 w-4" />,
  RICH_TEXT: <Type className="h-4 w-4" />,
};

export default function FileTypesTab({ canUpdate = true }: FileTypesTabProps) {
  const [fileTypes, setFileTypes] = useState<AllowedFileTypeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTiers, setExpandedTiers] = useState<Set<number>>(new Set([1, 2, 3]));
  const [pendingChanges, setPendingChanges] = useState<Map<number, boolean>>(new Map());
  const { showSuccess, showError } = useNotifications();

  const loadFileTypes = useCallback(async () => {
    try {
      setLoading(true);
      const types = await fileTypeService.getAllFileTypes();
      setFileTypes(types);
    } catch (error) {
      console.error('Failed to load file types:', error);
      showError('Failed to load', 'Could not load file types');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFileTypes();
  }, [loadFileTypes]);

  const toggleTier = (tier: number) => {
    setExpandedTiers(prev => {
      const next = new Set(prev);
      if (next.has(tier)) next.delete(tier);
      else next.add(tier);
      return next;
    });
  };

  const toggleFileType = (id: number, currentAllowed: boolean) => {
    if (!canUpdate) return;
    setPendingChanges(prev => {
      const next = new Map(prev);
      const original = fileTypes.find(ft => ft.id === id)?.allowed ?? false;
      const newValue = !currentAllowed;
      if (newValue === original) {
        next.delete(id);
      } else {
        next.set(id, newValue);
      }
      return next;
    });
  };

  const getEffectiveAllowed = (ft: AllowedFileTypeDto): boolean => {
    return pendingChanges.has(ft.id) ? pendingChanges.get(ft.id)! : ft.allowed;
  };

  const toggleAllInTier = (tier: number, enable: boolean) => {
    if (!canUpdate) return;
    const tierTypes = fileTypes.filter(ft => ft.tier === tier);
    setPendingChanges(prev => {
      const next = new Map(prev);
      tierTypes.forEach(ft => {
        if (ft.allowed !== enable) {
          next.set(ft.id, enable);
        } else {
          next.delete(ft.id);
        }
      });
      return next;
    });
  };

  const handleSave = async () => {
    if (pendingChanges.size === 0) return;

    try {
      setSaving(true);
      const updates = Array.from(pendingChanges.entries()).map(([id, allowed]) => ({
        id,
        allowed,
      }));
      await fileTypeService.updateFileTypes(updates);

      // Apply changes locally
      setFileTypes(prev =>
        prev.map(ft =>
          pendingChanges.has(ft.id)
            ? { ...ft, allowed: pendingChanges.get(ft.id)! }
            : ft
        )
      );
      setPendingChanges(new Map());
      showSuccess('Saved', `Updated ${updates.length} file type(s)`);
    } catch (error) {
      console.error('Failed to save file types:', error);
      showError('Save failed', 'Could not update file types');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setPendingChanges(new Map());
  };

  // Group by tier, then by category
  const getGroupedTypes = () => {
    const filtered = fileTypes.filter(ft => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        ft.label.toLowerCase().includes(q) ||
        ft.mimeType.toLowerCase().includes(q) ||
        ft.extensions.toLowerCase().includes(q) ||
        ft.category.toLowerCase().includes(q)
      );
    });

    const grouped: Record<number, Record<string, AllowedFileTypeDto[]>> = {};
    filtered.forEach(ft => {
      if (!grouped[ft.tier]) grouped[ft.tier] = {};
      if (!grouped[ft.tier][ft.category]) grouped[ft.tier][ft.category] = [];
      grouped[ft.tier][ft.category].push(ft);
    });
    return grouped;
  };

  const grouped = getGroupedTypes();
  const totalEnabled = fileTypes.filter(ft => getEffectiveAllowed(ft)).length;
  const totalTypes = fileTypes.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Allowed File Types</h3>
          <p className="text-sm text-muted-foreground">
            {totalEnabled} of {totalTypes} types enabled for upload
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pendingChanges.size > 0 && (
            <>
              <span className="text-sm text-yellow-500">
                {pendingChanges.size} unsaved change{pendingChanges.size !== 1 ? 's' : ''}
              </span>
              <Button variant="outline" size="sm" onClick={handleDiscard}>
                Discard
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1">
                <Save className="h-3.5 w-3.5" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by name, MIME type, or extension..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* Tiers */}
      <div className="space-y-4">
        {[1, 2, 3].map(tier => {
          const tierInfo = TIER_LABELS[tier];
          const tierCategories = grouped[tier];
          if (!tierCategories) return null;

          const tierTypes = fileTypes.filter(ft => ft.tier === tier);
          const tierEnabled = tierTypes.filter(ft => getEffectiveAllowed(ft)).length;
          const isExpanded = expandedTiers.has(tier);

          return (
            <div key={tier} className="border border-border rounded-lg overflow-hidden">
              {/* Tier Header */}
              <button
                onClick={() => toggleTier(tier)}
                className="w-full flex items-center justify-between p-4 bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div className="text-left">
                    <span className={`font-medium ${tierInfo.color}`}>{tierInfo.label}</span>
                    <p className="text-xs text-muted-foreground">{tierInfo.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {tierEnabled}/{tierTypes.length} enabled
                  </span>
                  {canUpdate && (
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => toggleAllInTier(tier, true)}
                      >
                        All On
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => toggleAllInTier(tier, false)}
                      >
                        All Off
                      </Button>
                    </div>
                  )}
                </div>
              </button>

              {/* Tier Content */}
              {isExpanded && (
                <div className="divide-y divide-border">
                  {Object.entries(tierCategories)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([category, types]) => (
                      <div key={category}>
                        {/* Category Header */}
                        <div className="px-4 py-2 bg-muted/30 flex items-center gap-2">
                          {CATEGORY_ICONS[category] || <FileType className="h-4 w-4" />}
                          <span className="text-sm font-medium capitalize">
                            {category.replace('_', ' ').toLowerCase()}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({types.filter(ft => getEffectiveAllowed(ft)).length}/{types.length})
                          </span>
                        </div>

                        {/* File Type Rows */}
                        <div className="divide-y divide-border/50">
                          {types.map(ft => {
                            const isAllowed = getEffectiveAllowed(ft);
                            const hasChange = pendingChanges.has(ft.id);

                            return (
                              <div
                                key={ft.id}
                                className={`flex items-center justify-between px-4 py-2.5 hover:bg-accent/30 transition-colors ${
                                  hasChange ? 'bg-yellow-500/5' : ''
                                }`}
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium truncate">{ft.label}</span>
                                    {ft.previewSupported && (
                                      <span className="flex-shrink-0" role="img" aria-label="Preview supported">
                                        <Eye className="h-3 w-3 text-blue-400" />
                                      </span>
                                    )}
                                    {ft.ocrSupported && (
                                      <span className="flex-shrink-0" role="img" aria-label="OCR supported">
                                        <ScanLine className="h-3 w-3 text-purple-400" />
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <code className="text-xs text-muted-foreground">{ft.mimeType}</code>
                                    <span className="text-xs text-muted-foreground/60">{ft.extensions}</span>
                                  </div>
                                </div>

                                {/* Toggle */}
                                <button
                                  onClick={() => toggleFileType(ft.id, isAllowed)}
                                  disabled={!canUpdate}
                                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                                    isAllowed ? 'bg-green-500' : 'bg-muted-foreground/30'
                                  } ${!canUpdate ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                  <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                      isAllowed ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                  />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
