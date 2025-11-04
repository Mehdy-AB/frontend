'use client';

import React, { useState } from 'react';
import { Save, RefreshCw, Send, Server, FileText, Zap, Database, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { useEmailConfiguration } from './lib/hooks';
import SMTPSettingsTab from './components/SMTPSettingsTab';
import TemplatesTab from './components/TemplatesTab';
import DeliveryTab from './components/DeliveryTab';
import LogsTab from './components/LogsTab';

export default function EmailConfigurationPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('smtp');
  const {
    loading,
    saving,
    testing,
    smtpSettings,
    emailTemplates,
    deliverySettings,
    emailLogs,
    emailStats,
    showPassword,
    testEmail,
    setSmtpSettings,
    setEmailTemplates,
    setDeliverySettings,
    setShowPassword,
    setTestEmail,
    handleSaveSettings,
    handleTestConnection,
    handleSendTestEmail,
    handleCreateTemplate,
    handleDeleteTemplate
  } = useEmailConfiguration();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Email Configuration</h1>
          <p className="text-muted-foreground">Configure email settings, templates, and delivery options</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={handleSaveSettings} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Email Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sent</p>
                <p className="text-2xl font-semibold">{emailStats.totalSent.toLocaleString()}</p>
              </div>
              <Send className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Delivery Rate</p>
                <p className="text-2xl font-semibold">{emailStats.deliveryRate}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today Sent</p>
                <p className="text-2xl font-semibold">{emailStats.todaySent.toLocaleString()}</p>
              </div>
              <Send className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Delivery Time</p>
                <p className="text-2xl font-semibold">{emailStats.averageDeliveryTime}s</p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="smtp" className="gap-2">
            <Server className="h-4 w-4" />
            SMTP Settings
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="delivery" className="gap-2">
            <Zap className="h-4 w-4" />
            Delivery
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <Database className="h-4 w-4" />
            Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="smtp">
          <SMTPSettingsTab
            smtpSettings={smtpSettings}
            onSmtpSettingsChange={setSmtpSettings}
            showPassword={showPassword}
            onShowPasswordChange={setShowPassword}
            testEmail={testEmail}
            onTestEmailChange={setTestEmail}
            testing={testing}
            onTestConnection={handleTestConnection}
            onSendTestEmail={handleSendTestEmail}
          />
        </TabsContent>

        <TabsContent value="templates">
          <TemplatesTab
            emailTemplates={emailTemplates}
            onCreateTemplate={handleCreateTemplate}
            onDeleteTemplate={handleDeleteTemplate}
          />
        </TabsContent>

        <TabsContent value="delivery">
          <DeliveryTab
            deliverySettings={deliverySettings}
            onDeliverySettingsChange={setDeliverySettings}
          />
        </TabsContent>

        <TabsContent value="logs">
          <LogsTab emailLogs={emailLogs} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

