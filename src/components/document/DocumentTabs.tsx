'use client';

import { Settings, Database, Tag, History, Workflow } from 'lucide-react';
import { DocumentTab } from '../../types/documentView';

interface DocumentTabsProps {
  activeTab: DocumentTab;
  onTabChange: (tab: DocumentTab) => void;
}

export default function DocumentTabs({ activeTab, onTabChange }: DocumentTabsProps) {
  const tabs = [
    {
      id: 'config' as DocumentTab,
      label: 'Config',
      icon: Settings
    },
    {
      id: 'workflows' as DocumentTab,
      label: 'Workflow',
      icon: Workflow
    },
    {
      id: 'metadata' as DocumentTab,
      label: 'Metadata',
      icon: Tag
    },
    {
      id: 'activity' as DocumentTab,
      label: 'Activity',
      icon: History
    }
  ];

  return (
    <div className="border-b border-ui">
      <div className="flex">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-neutral-text-light hover:text-neutral-text-dark'
              }`}
            >
              <Icon className="h-4 w-4 inline mr-2" />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
