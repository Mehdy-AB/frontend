'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, RefreshCw, Send, Server, CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { useAdminPagePermissions } from '@/hooks/useAdminPagePermissions';
import { useEmailConfiguration } from './lib/hooks';
import SMTPSettingsTab from './components/SMTPSettingsTab';

export default function EmailConfigurationPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { canView, canUpdate } = useAdminPagePermissions();
  const {
    loading,
    saving,
    testing,
    smtpSettings,
    showPassword,
    testEmail,
    notification,
    setSmtpSettings,
    setShowPassword,
    setTestEmail,
    handleSaveSettings,
    handleTestConnection,
    handleSendTestEmail,
    clearNotification,
    loadSettings
  } = useEmailConfiguration();

  useEffect(() => {
    if (!canView) {
      router.push('/');
    }
  }, [canView, router]);

  // Auto-dismiss notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        clearNotification();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification, clearNotification]);

  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-destructive text-lg">You don't have permission to view this page</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading email settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`
            fixed bottom-6 right-6 z-50 flex items-center gap-3 p-4 rounded-lg border shadow-lg animate-in slide-in-from-right-2 duration-300 max-w-md
            ${notification.type === 'success'
              ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
              : notification.type === 'error'
                ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
                : 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
            }
          `}
        >
          {notification.type === 'success' && <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />}
          {notification.type === 'error' && <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />}
          {notification.type === 'info' && <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />}
          <div className="flex-1">
            <p className="font-semibold">{notification.title}</p>
            <p className="text-sm opacity-90">{notification.message}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearNotification}
            className="h-8 w-8 p-0 hover:bg-transparent opacity-60 hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Email Configuration</h1>
          <p className="text-muted-foreground">Configure SMTP settings and test your email configuration</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={loadSettings} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleSaveSettings}
                disabled={saving || !canUpdate}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </TooltipTrigger>
            {!canUpdate && (
              <TooltipContent>
                <p>You don't have permission to update email settings</p>
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </div>

      {/* Status Card */}
      <Card className="border-l-4 border-l-primary">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Server className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">SMTP Configuration</p>
                <p className="text-sm text-muted-foreground">
                  {smtpSettings.enabled
                    ? `Configured: ${smtpSettings.host}:${smtpSettings.port}`
                    : 'Not configured - Email sending is disabled'}
                </p>
              </div>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${smtpSettings.enabled
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}>
              {smtpSettings.enabled ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Active
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
                  Inactive
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SMTP Settings Form */}
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
    </div>
  );
}
