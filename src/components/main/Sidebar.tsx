// components/Sidebar.tsx (Updated Version)
'use client';

import { 
  Home, 
  Tag, 
  Users, 
  Trash2, 
  Folder,
  FolderTree,
  Settings,
  Star,
  Clock,
  ChevronDown,
  ChevronRight,
  Plus,
  Share2,
  User
} from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '../../contexts/LanguageContext';
import { isAdmin } from '../../utils/adminUtils';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  count?: number;
  children?: SidebarItem[];
}

export default function Sidebar() {
  const [expandedItems, setExpandedItems] = useState<string[]>(['files']);
  const pathname = usePathname();
  const { t } = useLanguage();
  
  // Check if user is admin
  const userIsAdmin = isAdmin();

  // Base navigation items for all users
  const baseItems: SidebarItem[] = [
    {
      id: 'dashboard',
      label: t('common.dashboard'),
      icon: Home,
      href: '/',
    },
    {
      id: 'myrepo',
      label: 'My Repository',
      icon: Folder,
      href: '/folders',
      count: 12,
    },
    {
      id: 'shared',
      label: 'Shared with Me',
      icon: Share2,
      href: '/shared',
      count: 8,
    },
    {
      id: 'favorites',
      label: t('common.favorites'),
      icon: Star,
      href: '/favorites',
      count: 8,
    },
    {
      id: 'trash',
      label: t('common.trash'),
      icon: Trash2,
      href: '/trash',
      count: 4,
    },
  ];

  // Admin items are now accessible through the admin dropdown, so we only show base items
  const sidebarItems = baseItems;

  const toggleExpand = (itemId: string) => {
    setExpandedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  const renderSidebarItem = (item: SidebarItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);
    const active = isActive(item.href);

    return (
      <div key={item.id}>
        <Link href={item.href}>
      <div
        className={`flex items-center justify-between p-3 rounded-lg transition-colors group ${
          active
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
        }`}
        style={{ paddingLeft: `${level * 16 + 16}px` }}
      >
            <div className="flex items-center gap-3 flex-1">
              <item.icon className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm font-medium truncate">{item.label}</span>
            </div>
            
            <div className="flex items-center gap-1">
              {item.count !== undefined && (
                <Badge variant={active ? 'default' : 'secondary'} className="text-xs h-5 min-w-[20px] px-1.5">
                  {item.count}
                </Badge>
              )}
              {hasChildren && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleExpand(item.id);
                  }}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </Link>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {item.children!.map(child => renderSidebarItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="w-64 bg-card border-r h-full flex flex-col">
      {/* Logo Section */}
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <div className=" flex items-center justify-center">
            <img 
              src="/logo.svg" 
              alt="Logo" 
              className="h-16 w-16"
            />
          </div>
          <div>
            <h1 className="text-xl font-semibold">DATAVEX</h1>
            <p className="text-xs text-muted-foreground"> Fast. Secure. Reliable DMS.</p>
          </div>
        </div>
      </div>

      {/* New Document Button */}
      <div className="p-4 border-b">
        <Button className="w-full justify-start gap-2">
          <Plus className="h-4 w-4" />
          New Document
        </Button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
        {sidebarItems.map(item => renderSidebarItem(item))}
      </nav>

      {/* Storage Info */}
      <div className="p-4 border-t">
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Storage</span>
            <span>65% used</span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5">
            <div className="bg-primary rounded-full h-1.5" style={{ width: '65%' }}></div>
          </div>
          <p className="text-xs text-muted-foreground">12.4 GB of 19 GB used</p>
        </div>
      </div>
    </aside>
  );
}