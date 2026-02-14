/**
 * Custom hooks for Email Configuration module
 * Connected to real backend API
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { emailSettingsService, SecureType, EmailSettingsResponse } from '@/api/services/emailSettingsService';
import type {
  SMTPSettings,
  EmailTemplate,
  DeliverySettings,
  EmailLog,
  EmailStats
} from './types';
import {
  mockEmailTemplates,
  mockDeliverySettings,
  mockEmailLogs,
  mockEmailStats
} from './mockData';

// Convert backend response to frontend SMTPSettings format
function backendToFrontend(data: EmailSettingsResponse | null): SMTPSettings {
  if (!data) {
    return {
      enabled: false,
      host: '',
      port: 587,
      secure: false,
      username: '',
      password: '',
      fromName: '',
      fromEmail: '',
      replyTo: '',
      timeout: 30,
      retries: 3,
      connectionPool: true,
      maxConnections: 5,
      rateLimit: 100
    };
  }

  return {
    enabled: data.isActive,
    host: data.host,
    port: data.port,
    secure: data.secureType === 'SSL',
    username: data.username || '',
    password: '', // Password is never returned from backend
    fromName: data.fromName || '',
    fromEmail: data.fromEmail,
    replyTo: data.replyTo || '',
    // These are not stored in backend, use defaults
    timeout: 30,
    retries: 3,
    connectionPool: true,
    maxConnections: 5,
    rateLimit: 100
  };
}

// Convert frontend SMTPSettings to backend request format
function frontendToBackend(settings: SMTPSettings, password?: string): any {
  let secureType: SecureType = 'TLS';
  if (settings.secure) {
    secureType = 'SSL';
  }

  const request: any = {
    host: settings.host,
    port: settings.port,
    secureType,
    username: settings.username || null,
    fromEmail: settings.fromEmail,
    fromName: settings.fromName || null,
    replyTo: settings.replyTo || null,
    isActive: settings.enabled
  };

  // Only include password if provided (non-empty)
  if (password && password.trim()) {
    request.password = password;
  }

  return request;
}

export interface NotificationState {
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}

export function useEmailConfiguration() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [smtpSettings, setSmtpSettings] = useState<SMTPSettings>(backendToFrontend(null));
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>(mockEmailTemplates);
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings>(mockDeliverySettings);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>(mockEmailLogs);
  const [emailStats, setEmailStats] = useState<EmailStats>(mockEmailStats);
  const [showPassword, setShowPassword] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [notification, setNotification] = useState<NotificationState | null>(null);
  const [passwordInput, setPasswordInput] = useState('');

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await emailSettingsService.getSettings();
      setSmtpSettings(backendToFrontend(data));
    } catch (error: any) {
      console.error('Error loading email settings:', error);
      const errorMessage = error.data?.message || error.message || 'Failed to load email settings';
      const statusInfo = error.status ? ` (Status: ${error.status})` : '';
      setNotification({
        type: 'error',
        title: 'Error Loading Settings',
        message: `${errorMessage}${statusInfo}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setNotification(null);
    try {
      // Use password from settings if available
      const passwordToSave = smtpSettings.password || passwordInput;
      const request = frontendToBackend(smtpSettings, passwordToSave);
      await emailSettingsService.updateSettings(request);

      // Clear password from state after save for security
      setSmtpSettings(prev => ({ ...prev, password: '' }));
      setPasswordInput(''); // Also clear this if used
      setNotification({
        type: 'success',
        title: 'Settings Saved',
        message: 'Email configuration has been saved successfully.'
      });
    } catch (error: any) {
      console.error('Error saving email settings:', error);
      const errorMessage = error.data?.message || error.message || 'Failed to save email settings';
      const statusInfo = error.status ? ` (Status: ${error.status})` : '';
      setNotification({
        type: 'error',
        title: 'Save Failed',
        message: `${errorMessage}${statusInfo}`
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    // Note: test connection uses the test email endpoint
    if (!testEmail.trim()) {
      setNotification({
        type: 'error',
        title: 'Missing Email',
        message: 'Please enter a test email address first.'
      });
      return;
    }
    await handleSendTestEmail();
  };

  const handleSendTestEmail = async () => {
    if (!testEmail.trim()) {
      setNotification({
        type: 'error',
        title: 'Missing Email',
        message: 'Please enter a test email address.'
      });
      return;
    }

    setTesting(true);
    setNotification(null);
    try {
      const result = await emailSettingsService.sendTestEmail(testEmail);
      if (result.success) {
        setNotification({
          type: 'success',
          title: 'Test Email Sent',
          message: result.message
        });
      } else {
        setNotification({
          type: 'error',
          title: 'Test Email Failed',
          message: result.message
        });
      }
    } catch (error: any) {
      console.error('Error sending test email:', error);
      setNotification({
        type: 'error',
        title: 'Test Email Failed',
        message: error.response?.data?.message || error.message || 'Failed to send test email'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleCreateTemplate = () => {
    const newTemplate: EmailTemplate = {
      id: Date.now().toString(),
      name: 'New Template',
      subject: 'New Email Template',
      type: 'custom',
      status: 'draft',
      lastModified: new Date().toISOString(),
      usage: 0,
      variables: []
    };
    setEmailTemplates(prev => [...prev, newTemplate]);
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      setEmailTemplates(prev => prev.filter(template => template.id !== templateId));
    }
  };

  const clearNotification = useCallback(() => {
    setNotification(null);
  }, []);

  // Update password handler for the form
  const handlePasswordChange = (password: string) => {
    setPasswordInput(password);
    setSmtpSettings(prev => ({ ...prev, password }));
  };

  return {
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
    notification,
    setSmtpSettings,
    setEmailTemplates,
    setDeliverySettings,
    setEmailLogs,
    setEmailStats,
    setShowPassword,
    setTestEmail,
    handleSaveSettings,
    handleTestConnection,
    handleSendTestEmail,
    handleCreateTemplate,
    handleDeleteTemplate,
    clearNotification,
    handlePasswordChange,
    loadSettings
  };
}
