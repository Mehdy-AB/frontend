'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Cog,
  Settings,
  Users,
  FileText,
  Workflow,
  Tag,
  Database,
  BarChart3,
  Mail,
  Key,
  Palette,
  AtSign,
  Server,
  MessageSquare,
  Bell,
  Globe,
  Folder,
  Lock,
  FolderTree,
  Shield,
  Stamp,
  Share,
  Trash2,
  PenTool,
  CheckSquare,
  Clock,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/ui/dropdown-menu';

interface MenuItem {
  label: string;
  href: string;
  description?: string;
  Icon?: any;
}

interface Section {
  id: string;
  label: string;
  Icon?: any;
  items: MenuItem[];
}

/**
 * Edit / extend this data structure to add/remove sections & links.
 * Each MenuItem can include a description that will appear under the link.
 */
const SECTIONS: Section[] = [
  {
    id: 'system',
    label: 'System',
    Icon: Settings,
    items: [
      {
        label: 'DMS Settings',
        href: '/administration/system/dms-settings',
        description: 'Configure DMS defaults and global system preferences.',
        Icon: Settings,
      },
      {
        label: 'Customization',
        href: '/administration/system/customization',
        description: 'Theme, branding and UI customization options.',
        Icon: Palette,
      },
      {
        label: 'Email Customisation',
        href: '/administration/system/email',
        description: 'Templates, SMTP settings and email behavior.',
        Icon: Mail,
      },
      {
        label: 'License',
        href: '/administration/system/license',
        description: 'View and manage your application license.',
        Icon: Key,
      },
      {
        label: 'Emails',
        href: '/administration/system/emails',
        description: 'General email settings for notifications and templates.',
        Icon: AtSign,
      },
      {
        label: 'Transactions',
        href: '/administration/system/transactions',
        description: 'Review system transactions and their metrics.',
        Icon: BarChart3,
      },
    ],
  },
  {
    id: 'users',
    label: 'Users',
    Icon: Users,
    items: [
      { label: 'Users', href: '/admin/users', description: 'List and manage user accounts.', Icon: Users },
      { label: 'Groups', href: '/admin/groups', description: 'Organize users into groups.', Icon: FolderTree },
      { label: 'Roles', href: '/admin/roles', description: 'Role-based permissions and access control.', Icon: Shield },
      { label: 'LDAP Servers', href: '/admin/users/ldap-servers', description: 'Configure LDAP/AD servers.', Icon: Server },
      { label: 'Alias', href: '/admin/users/alias', description: 'Manage address aliases.', Icon: MessageSquare },
      { label: 'Notifications', href: '/admin/users/notifications', description: 'User notification rules.', Icon: Bell },
      { label: 'Extranet', href: '/admin/users/extranet', description: 'Public/external user settings.', Icon: Globe },
    ],
  },
  {
    id: 'documents',
    label: 'Documents',
    Icon: FileText,
    items: [
      { label: 'Models documents', href: '/admin/documents/filing-categories', description: 'Categorize documents for filing.', Icon: Folder },
      { label: 'Secured Spaces', href: '/admin/documents/secured-spaces', description: 'Manage access to secure repositories.', Icon: Lock },
      { label: 'Links', href: '/admin/documents/linking', description: 'Manage shared links and external references.', Icon: Share },
      { label: 'Tags', href: '/admin/documents/tags', description: 'Tag management.', Icon: Tag },
      { label: 'Stamps', href: '/admin/documents/stamps', description: 'Manage document stamps and templates.', Icon: Stamp },
      { label: 'Digital Signature', href: '/admin/documents/digital-signature', description: 'Configure digital signing workflows.', Icon: PenTool },
    ],
  },
  {
    id: 'workflow',
    label: 'Workflow',
    Icon: Workflow,
    items: [
      { label: 'Designer', href: '/admin/workflow/designer', description: 'Design and edit workflows.', Icon: Workflow },
      { label: 'Task List', href: '/admin/workflow/tasks', description: 'View and manage workflow tasks.', Icon: CheckSquare },
      { label: 'Working Hours', href: '/admin/workflow/working-hours', description: 'Business hours used for SLA calculations.', Icon: Clock },
    ],
  },
];

export default function AdminDropdown() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  // selected tab id: default to first section
  const [selectedId, setSelectedId] = useState<string>(SECTIONS[0].id);

  const selectedSection = SECTIONS.find((s) => s.id === selectedId) ?? SECTIONS[0];

  const handleNavigate = (href: string) => {
    setOpen(false);
    // small delay so menu can close smoothly before route change (optional)
    router.push(href);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 px-2" aria-label="Admin Menu">
          <Cog className="h-4 w-4" />
          <span className="text-sm font-medium hidden sm:inline">Admin</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[920px] p-0 rounded-lg shadow-lg overflow-hidden border"
      >
        <div className="flex min-h-[320px]">
          {/* Left tabs column */}
          <aside className="w-48 bg-gray-50 border-r py-3">
            <div className="px-3 pb-2 border-b">
              <div className="flex items-center gap-2 text-sm font-medium px-1">
                <Cog className="h-4 w-4" />
                <span>Administration</span>
              </div>
            </div>

            <nav
              role="tablist"
              aria-orientation="vertical"
              className="mt-2 space-y-1 px-2"
            >
              {SECTIONS.map((section) => {
                const active = section.id === selectedId;
                return (
                  <button
                    key={section.id}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setSelectedId(section.id)}
                    className={`w-full cur flex items-center gap-2 text-sm px-3 py-2 rounded-md text-left
                      ${active ? 'bg-white text-slate-900 font-semibold shadow-sm' : 'text-slate-600 hover:bg-white hover:shadow-sm'}`}
                  >
                    {section.Icon && <section.Icon className="h-4 w-4 opacity-90" />}
                    <span className="truncate">{section.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Right content column */}
          <div className="flex-1 p-5 bg-white">
            <header className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedSection.Icon && <selectedSection.Icon className="h-5 w-5 text-slate-700" />}
                <h3 className="text-lg font-semibold">{selectedSection.label}</h3>
              </div>
              <div className="text-sm text-slate-500">Quick links</div>
            </header>

            <div className="grid grid-cols-2 gap-6">
              {selectedSection.items.map((item) => (
                <div key={item.href} className="rounded-md p-2 hover:bg-slate-50">
                  <button
                    onClick={() => handleNavigate(item.href)}
                    className="flex items-start cursor-pointer gap-3 w-full text-left"
                  >
                    {item.Icon && <item.Icon className="h-5 w-5 mt-1 text-slate-600" />}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-900">{item.label}</span>
                      </div>
                      {item.description && (
                        <p className="mt-1 text-xs text-slate-500">{item.description}</p>
                      )}
                    </div>
                  </button>
                </div>
              ))}
            </div>

            {/* Footer small help text */}
            <div className="mt-6 border-t pt-3 text-xs text-slate-500">
              Click a link to go to that admin page. Use the left tabs to switch sections.
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
