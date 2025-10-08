// app/page.tsx
'use client';

import { FileText, Folder, Users, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '../contexts/LanguageContext';

export default function Dashboard() {
  const { t } = useLanguage();
  
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