'use client';

import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import * as LucideIcons from 'lucide-react';

interface IconPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectIcon: (iconName: string, IconComponent: React.ComponentType<any>) => void;
}

// Curated list of popular lucide-react icons (deduplicated)
const POPULAR_ICONS = Array.from(new Set([
  'Check', 'X', 'CheckCircle', 'XCircle', 'AlertCircle', 'Info', 'AlertTriangle',
  'Star', 'Heart', 'Shield', 'Lock', 'Unlock', 'Key', 'Mail', 'Phone',
  'MapPin', 'Calendar', 'Clock', 'User', 'Users', 'Settings',
  'FileText', 'Folder', 'Image', 'Video', 'Music', 'Download', 'Upload',
  'Pencil', 'Trash2', 'Plus', 'Minus', 'Search', 'Filter', 'ArrowRight',
  'ArrowLeft', 'ArrowUp', 'ArrowDown', 'ChevronRight', 'ChevronLeft',
  'ChevronUp', 'ChevronDown', 'Home', 'Menu', 'MoreVertical', 'MoreHorizontal',
  'Bell', 'Bookmark', 'Tag', 'Link', 'ExternalLink', 'Copy', 'Share',
  'Save', 'Printer', 'Eye', 'EyeOff', 'RefreshCw', 'RotateCw', 'Zap',
  'Target', 'Award', 'Trophy', 'Gift', 'CreditCard', 'ShoppingCart',
  'Building', 'Globe', 'Wifi', 'WifiOff', 'Battery', 'BatteryCharging',
  'Camera', 'Mic', 'Volume2', 'VolumeX', 'Play', 'Pause', 'Square',
  'SkipForward', 'SkipBack', 'Repeat', 'Shuffle', 'ThumbsUp', 'ThumbsDown',
  'MessageSquare', 'Send', 'Inbox', 'Archive', 'Flag', 'BookOpen',
  'GraduationCap', 'Briefcase', 'Coffee', 'Smile', 'Frown', 'Meh',
  'Sun', 'Moon', 'Cloud', 'CloudRain', 'CloudSnow', 'Wind', 'Droplet',
  'Flame', 'Sparkles', 'Rocket', 'Plane', 'Car', 'Bike', 'Ship',
  'Activity', 'TrendingUp', 'TrendingDown', 'BarChart', 'PieChart',
  'DollarSign', 'Database', 'Server', 'HardDrive', 'Cpu', 'Monitor',
  'Smartphone', 'Tablet', 'Keyboard', 'Headphones',
  'Scissors', 'PenTool', 'Paintbrush', 'Palette', 'Eraser', 'Ruler',
  'Grid', 'Layout', 'Columns', 'Rows', 'Maximize', 'Minimize',
  'Circle', 'Triangle', 'Hexagon', 'Octagon', 'Diamond', 'Crosshair',
  'Focus', 'CheckSquare', 'CircleDot',
  'Radio', 'ToggleLeft', 'ToggleRight',
  'Thermometer', 'Droplets', 'FlaskConical',
  'Microscope', 'Stethoscope', 'HeartPulse',
  'Scan', 'ScanLine', 'QrCode',
  'Fingerprint', 'ShieldCheck', 'ShieldAlert', 'ShieldOff',
  'KeyRound', 'LockKeyhole',
]));

export function IconPicker({ open, onOpenChange, onSelectIcon }: IconPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredIcons = POPULAR_ICONS.filter((iconName) =>
    iconName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleIconSelect = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName];
    if (IconComponent) {
      onSelectIcon(iconName, IconComponent);
      onOpenChange(false);
      setSearchQuery('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Select Icon</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search icons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="h-[500px] overflow-y-auto border rounded-lg p-2">
            <div className="grid grid-cols-8 gap-2">
              {filteredIcons.map((iconName) => {
                const IconComponent = (LucideIcons as any)[iconName];
                if (!IconComponent) return null;

                return (
                  <Button
                    key={iconName}
                    variant="outline"
                    size="sm"
                    className="h-16 flex flex-col items-center justify-center gap-1 hover:bg-blue-50 hover:border-blue-300"
                    onClick={() => handleIconSelect(iconName)}
                    title={iconName}
                  >
                    <IconComponent className="w-6 h-6" />
                    <span className="text-[10px] text-gray-500 truncate w-full text-center">
                      {iconName}
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

