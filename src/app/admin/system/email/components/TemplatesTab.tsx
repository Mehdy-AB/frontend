'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Copy, FileText } from 'lucide-react';
import type { EmailTemplate } from '../lib/types';
import { formatDate } from '../lib/utils';

interface TemplatesTabProps {
  emailTemplates: EmailTemplate[];
  onCreateTemplate: () => void;
  onEditTemplate?: (templateId: string) => void;
  onDeleteTemplate: (templateId: string) => void;
}

export default function TemplatesTab({
  emailTemplates,
  onCreateTemplate,
  onEditTemplate,
  onDeleteTemplate
}: TemplatesTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Email Templates</h3>
          <p className="text-sm text-muted-foreground">Manage email templates and their content</p>
        </div>
        <Button onClick={onCreateTemplate} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {emailTemplates.map((template) => (
          <Card key={template.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <h4 className="font-medium">{template.name}</h4>
                    <p className="text-sm text-muted-foreground">{template.subject}</p>
                  </div>
                </div>
                <Badge variant={template.status === 'active' ? 'default' : 'secondary'}>
                  {template.status}
                </Badge>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground mb-4">
                <div className="flex items-center justify-between">
                  <span>Type:</span>
                  <span className="font-medium">{template.type}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Usage:</span>
                  <span className="font-medium">{template.usage}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Modified:</span>
                  <span>{formatDate(template.lastModified)}</span>
                </div>
              </div>

              {template.variables.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground mb-2">Variables:</p>
                  <div className="flex flex-wrap gap-1">
                    {template.variables.map((variable) => (
                      <Badge key={variable} variant="outline" className="text-xs">
                        {variable}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditTemplate?.(template.id)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDeleteTemplate(template.id)}
                  className="gap-1"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
