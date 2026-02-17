'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Gauge, Move, RotateCw, Maximize2, Palette, FileText } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CanvasSettings } from '@/types/stamp-editor';

interface StampSettingsPanelProps {
  settings: CanvasSettings;
  onChange: (settings: CanvasSettings) => void;
}

const POSITION_OPTIONS = [
  { value: 'Center', label: 'Center' },
  { value: 'Top-Left', label: 'Top Left' },
  { value: 'Top-Right', label: 'Top Right' },
  { value: 'Bottom-Left', label: 'Bottom Left' },
  { value: 'Bottom-Right', label: 'Bottom Right' },
  { value: 'Custom', label: 'Custom' },
];

const BORDER_STYLES = [
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' },
  { value: 'double', label: 'Double' },
];

const PAGE_PLACEMENT_OPTIONS = [
  { value: 'all', label: 'All Pages' },
  { value: 'first', label: 'First Page Only' },
  { value: 'last', label: 'Last Page Only' },
  { value: 'custom', label: 'Custom Pages' },
];

export function StampSettingsPanel({ settings, onChange }: StampSettingsPanelProps) {
  const updateSetting = <K extends keyof CanvasSettings>(key: K, value: CanvasSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  // Local string state for width/height so users can type freely (commit on blur/Enter)
  const [localWidth, setLocalWidth] = useState(String(settings.width));
  const [localHeight, setLocalHeight] = useState(String(settings.height));

  // Sync local state when parent settings change (e.g. from import or auto-resize)
  useEffect(() => { setLocalWidth(String(settings.width)); }, [settings.width]);
  useEffect(() => { setLocalHeight(String(settings.height)); }, [settings.height]);

  const commitWidth = () => {
    const v = parseInt(localWidth) || 50;
    const clamped = Math.max(50, Math.min(2000, v));
    setLocalWidth(String(clamped));
    updateSetting('width', clamped);
  };
  const commitHeight = () => {
    const v = parseInt(localHeight) || 50;
    const clamped = Math.max(50, Math.min(2000, v));
    setLocalHeight(String(clamped));
    updateSetting('height', clamped);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Stamp Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 stamp-settings-scroll">
          {/* Opacity */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Gauge className="w-4 h-4" />
              Opacity: {Math.round(settings.opacity * 100)}%
            </Label>
            <Slider
              value={[settings.opacity]}
              onValueChange={([value]) => updateSetting('opacity', value)}
              min={0.1}
              max={1}
              step={0.05}
            />
          </div>

          <Separator />

          {/* Page Placement */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4" />
              Page Placement
            </Label>
            <Select
              value={settings.pagePlacement || 'all'}
              onValueChange={(value: 'all' | 'first' | 'last' | 'custom') => updateSetting('pagePlacement', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_PLACEMENT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Position */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Move className="w-4 h-4" />
              Default Position
            </Label>
            <Select
              value={settings.defaultPosition}
              onValueChange={(value: CanvasSettings['defaultPosition']) => updateSetting('defaultPosition', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POSITION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Size */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <Maximize2 className="w-4 h-4" />
              Size
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Width (px)</Label>
                <Input
                  type="number"
                  min={50}
                  max={2000}
                  value={localWidth}
                  onChange={(e) => setLocalWidth(e.target.value)}
                  onBlur={commitWidth}
                  onKeyDown={(e) => e.key === 'Enter' && commitWidth()}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Height (px)</Label>
                <Input
                  type="number"
                  min={50}
                  max={2000}
                  value={localHeight}
                  onChange={(e) => setLocalHeight(e.target.value)}
                  onBlur={commitHeight}
                  onKeyDown={(e) => e.key === 'Enter' && commitHeight()}
                  className="mt-1"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Type a value and press Enter or click away to apply (50–2000px).
            </p>
          </div>

          <Separator />

          {/* Rotation */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <RotateCw className="w-4 h-4" />
              Rotation: {settings.rotation}°
            </Label>
            <div className="flex items-center gap-2">
              <Slider
                value={[settings.rotation]}
                onValueChange={([value]) => updateSetting('rotation', value)}
                min={-180}
                max={180}
                step={1}
                className="flex-1"
              />
              <Input
                type="number"
                value={settings.rotation}
                onChange={(e) => updateSetting('rotation', parseInt(e.target.value) || 0)}
                className="w-20"
                min={-180}
                max={180}
              />
            </div>
          </div>

          <Separator />

          {/* Background */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Palette className="w-4 h-4" />
              Background
            </Label>
            {/* Transparent toggle */}
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs text-muted-foreground">Transparent</Label>
              <Switch
                checked={settings.backgroundColor === 'transparent'}
                onCheckedChange={(checked) => {
                  updateSetting('backgroundColor', checked ? 'transparent' : '#FFFFFF');
                }}
              />
            </div>
            {settings.backgroundColor !== 'transparent' && (
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={settings.backgroundColor || '#FFFFFF'}
                  onChange={(e) => updateSetting('backgroundColor', e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={settings.backgroundColor || '#FFFFFF'}
                  onChange={(e) => updateSetting('backgroundColor', e.target.value)}
                  placeholder="#FFFFFF"
                  className="flex-1"
                />
              </div>
            )}
          </div>

          <Separator />

          {/* Border */}
          <div className="space-y-4">
            <Label>Border</Label>

            <div>
              <Label className="text-xs text-muted-foreground mb-2">Border Style</Label>
              <Select
                value={settings.borderStyle || 'solid'}
                onValueChange={(value: 'solid' | 'dashed' | 'dotted' | 'double') => updateSetting('borderStyle', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BORDER_STYLES.map((style) => (
                    <SelectItem key={style.value} value={style.value}>
                      {style.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-2">Border Width</Label>
              <div className="flex items-center gap-2">
                <Slider
                  value={[settings.borderWidth || 0]}
                  onValueChange={([value]) => updateSetting('borderWidth', value)}
                  min={0}
                  max={10}
                  step={1}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={settings.borderWidth || 0}
                  onChange={(e) => {
                    const v = Math.max(0, Math.min(10, parseInt(e.target.value) || 0));
                    updateSetting('borderWidth', v);
                  }}
                  className="w-16 h-8 text-xs"
                  min={0}
                  max={10}
                />
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-2">Border Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={settings.borderColor || '#000000'}
                  onChange={(e) => updateSetting('borderColor', e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={settings.borderColor || '#000000'}
                  onChange={(e) => updateSetting('borderColor', e.target.value)}
                  placeholder="#000000"
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-2">Border Radius: {settings.borderRadius || 0}px</Label>
              <Slider
                value={[settings.borderRadius || 0]}
                onValueChange={([value]) => updateSetting('borderRadius', value)}
                min={0}
                max={50}
                step={1}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

