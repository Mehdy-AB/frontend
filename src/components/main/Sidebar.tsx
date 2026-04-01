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
  Share2,
  User,
  FileCheck,
  Archive,
  Globe,
  ShieldCheck,
  Handshake
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '../../contexts/LanguageContext';
import { isAdmin } from '../../utils/adminUtils';
import { workflowAdminService } from '@/api/services/workflowAdminService';
import { myScopeService } from '@/api/services/myScopeService';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  children?: SidebarItem[];
}

export default function Sidebar() {
  const [expandedItems, setExpandedItems] = useState<string[]>(['files']);
  const [pendingTasksCount, setPendingTasksCount] = useState(0);
  const [showMyScope, setShowMyScope] = useState(false);
  const pathname = usePathname();
  const { t } = useLanguage();

  // Check if user is admin
  const userIsAdmin = isAdmin();

  useEffect(() => {
    const fetchTaskCount = async () => {
      try {
        const tasks = await workflowAdminService.getPendingNodes();
        setPendingTasksCount(tasks.length);
      } catch (error) {
        console.error('Failed to fetch task count', error);
      }
    };

    fetchTaskCount();
    // Poll every 30 seconds
    const interval = setInterval(fetchTaskCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Check if user has active leadership for My Scope
  useEffect(() => {
    const checkLeadership = async () => {
      try {
        const hasLeadership = await myScopeService.hasLeadership();
        setShowMyScope(hasLeadership);
      } catch (error) {
        console.error('Failed to check leadership status', error);
      }
    };
    checkLeadership();

    // Poll every 30 seconds
    const interval = setInterval(checkLeadership, 30000);

    // Listen to custom event for immediate refresh
    const handleLeadershipUpdate = () => checkLeadership();
    window.addEventListener('leadership:updated', handleLeadershipUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('leadership:updated', handleLeadershipUpdate);
    };
  }, []);

  // Base navigation items for all users
  const baseItems: SidebarItem[] = [
    {
      id: 'dashboard',
      label: t('common.dashboard'),
      icon: Home,
      href: '/',
    },
    {
      id: 'tasks',
      label: 'My Tasks',
      icon: FileCheck,
      href: '/tasks',
    },
    ...(showMyScope ? [{
      id: 'my-scope',
      label: 'My Scope',
      icon: Globe,
      href: '/my-scope',
    }] : []),
    {
      id: 'delegations',
      label: 'Delegations',
      icon: Handshake,
      href: '/delegations',
    },
    {
      id: 'myrepo',
      label: 'My Repository',
      icon: Folder,
      href: '/folders',
    },
    {
      id: 'workspaces',
      label: 'Workspaces',
      icon: Globe,
      href: '/workspaces',
    },
    {
      id: 'secured-spaces',
      label: 'Secured Spaces',
      icon: ShieldCheck,
      href: '/secured-spaces',
    },
    {
      id: 'classa',
      label: 'Unclassified Documents',
      icon: Archive,
      href: '/classa',
    },
    {
      id: 'shared',
      label: 'Shared with Me',
      icon: Share2,
      href: '/shared',
    },
    {
      id: 'favorites',
      label: t('common.favorites'),
      icon: Star,
      href: '/favorites',
    },
    {
      id: 'trash',
      label: t('common.trash'),
      icon: Trash2,
      href: '/trash',
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
            className={`flex items-center justify-between p-3 rounded-lg transition-colors group ${active
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
            style={{ paddingLeft: `${level * 16 + 16}px` }}
          >
            <div className="flex items-center gap-3 flex-1">
              <item.icon className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm font-medium truncate">{item.label}</span>
            </div>

            {item.id === 'tasks' && pendingTasksCount > 0 && (
              <Badge variant="destructive" className="ml-auto h-5 w-5 flex items-center justify-center rounded-full p-0 text-[10px]">
                {pendingTasksCount > 99 ? '99+' : pendingTasksCount}
              </Badge>
            )}

            <div className="flex items-center gap-1">
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
      <div className=" border-b">
        <div className="flex items-center ml-8 w-full">
          <img
            src="/logo.svg"
            alt="Logo"
            className="h-32 w-32"
          />
        </div>
      </div>


      {/* Navigation Items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
        {sidebarItems.map(item => renderSidebarItem(item))}
      </nav>


    </aside>
  );
}