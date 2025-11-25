// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { FileText, Folder, Users, Download, Clock, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '../contexts/LanguageContext';
import { workflowService } from '@/api/services/workflowService';
import { WorkflowStepInstanceResponse } from '@/types/api';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/dateFormatter';

export default function Dashboard() {
  const { t } = useLanguage();
  const router = useRouter();
  const [pendingSteps, setPendingSteps] = useState<WorkflowStepInstanceResponse[]>([]);
  const [loadingSteps, setLoadingSteps] = useState(true);
  
  useEffect(() => {
    const fetchPendingSteps = async () => {
      try {
        setLoadingSteps(true);
        const steps = await workflowService.getPendingSteps();
        setPendingSteps(steps);
      } catch (error) {
        console.error('Error fetching pending steps:', error);
      } finally {
        setLoadingSteps(false);
      }
    };

    fetchPendingSteps();
  }, []);
  
  const stats = [
    { label: t('dashboard.totalDocuments'), value: '1,247', icon: FileText, change: '+12%' },
    { label: t('common.folders'), value: '89', icon: Folder, change: '+5%' },
    { label: t('dashboard.teamMembers'), value: '24', icon: Users, change: '+2%' },
    { label: t('dashboard.downloads'), value: '3,458', icon: Download, change: '+18%' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-semibold">{t('dashboard.welcome')}</h1>
        <p className="text-muted-foreground">{t('dashboard.whatsHappening')}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-semibold mt-1">{stat.value}</p>
                  <Badge variant="outline" className="mt-1 text-green-600 border-green-200">
                    {stat.change} {t('dashboard.fromLastMonth')}
                  </Badge>
                </div>
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pending Workflow Steps */}
      {pendingSteps.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                Pending Workflow Steps ({pendingSteps.length})
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/admin/workflow/instances')}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingSteps.slice(0, 5).map((step) => (
                <div
                  key={step.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => step.documentId && router.push(`/documents/${step.documentId}`)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{step.workflowStep.name}</span>
                      {step.isOverdue && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Overdue
                        </Badge>
                      )}
                    </div>
                    {step.workflowStep.description && (
                      <p className="text-sm text-muted-foreground mb-1">
                        {step.workflowStep.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {step.assignedToUser && (
                        <span>Assigned to: {step.assignedToUser.displayName || step.assignedToUser.username}</span>
                      )}
                      {step.dueDate && (
                        <span>Due: {formatDate(step.dueDate)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (step.documentId) {
                          router.push(`/documents/${step.documentId}`);
                        }
                      }}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      View Document
                    </Button>
                  </div>
                </div>
              ))}
              {pendingSteps.length > 5 && (
                <div className="text-center pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/admin/workflow/instances')}
                  >
                    View {pendingSteps.length - 5} more pending steps
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Documents */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.recentDocuments')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            {t('dashboard.noRecentDocuments')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}