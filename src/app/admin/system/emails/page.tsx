'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  RefreshCw, Plus, Send, FileText, Database, CheckCircle,
  MailOpen, BarChart3, X, Mail, Edit, Eye, Trash2, AlertTriangle,
  Paperclip, Search, File, Upload, Users, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { useEmailManagement } from './lib/hooks';
import CampaignsTab from './components/CampaignsTab';
import LogsTab from './components/LogsTab';
import { formatNumber } from './lib/utils';
import {
  emailManagementService,
  SendEmailRequest,
  EmailTemplateRequest,
  EmailTemplate
} from '@/api/services/emailManagementService';
import { userManagementService } from '@/api/services/userManagementService';
import { documentService } from '@/api/services/documentService';
import type { DocumentResponseDto, UserDto } from '@/types/api';
import { RichEmailEditor, EmailPreviewPanel } from '@/components/email';
import type { VariableDefinition } from '@/components/email/VariablePicker';

// ============================================================================
// Variable Utilities
// ============================================================================

// Auto-extract {{variable}} patterns from text (used for template save)
function autoExtractVariables(text: string): string[] {
  const matches = text.match(/\{\{([\w.]+)\}\}/g) || [];
  return [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))].sort();
}

export default function EmailManagementPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('campaigns');
  const {
    loading,
    searchQuery,
    statusFilter,
    typeFilter,
    selectedItems,
    emailStats,
    filteredCampaigns,
    filteredTemplates,
    filteredLogs,
    emailTemplates,
    handleSearch,
    handleStatusFilter,
    handleTypeFilter,
    handleSelectItem,
    handleDeleteCampaign,
    handleRefresh,
    loadTemplates,
    // Infinite scroll for logs
    loadMoreLogs,
    hasMoreLogs,
    loadingMoreLogs,
    // Infinite scroll for templates
    loadMoreTemplates,
    hasMoreTemplates,
    loadingMoreTemplates
  } = useEmailManagement();

  // Templates infinite scroll
  const templatesContainerRef = useRef<HTMLDivElement>(null);
  const handleTemplatesScroll = useCallback(() => {
    if (!templatesContainerRef.current || !loadMoreTemplates || !hasMoreTemplates || loadingMoreTemplates) return;

    const { scrollTop, scrollHeight, clientHeight } = templatesContainerRef.current;
    // Load more when user scrolls to within 100px of the bottom
    if (scrollHeight - scrollTop - clientHeight < 100) {
      loadMoreTemplates();
    }
  }, [loadMoreTemplates, hasMoreTemplates, loadingMoreTemplates]);

  useEffect(() => {
    const container = templatesContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleTemplatesScroll);
    return () => container.removeEventListener('scroll', handleTemplatesScroll);
  }, [handleTemplatesScroll]);

  // Notification state
  const [notification, setNotification] = useState<{ type: 'success' | 'error', title: string, message: string } | null>(null);

  // Send email form state
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [sendForm, setSendForm] = useState<SendEmailRequest>({
    to: [],
    subject: '',
    bodyHtml: '<p>Your message here...</p>'
  });
  const [externalEmailInput, setExternalEmailInput] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('none');

  // System user search state
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<UserDto[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [selectedSystemUsers, setSelectedSystemUsers] = useState<UserDto[]>([]);

  // External recipients state
  const [externalRecipients, setExternalRecipients] = useState<string[]>([]);

  // Shared WYSIWYG editor state (variables from backend, same as CampaignFormModal)
  const [availableVariables, setAvailableVariables] = useState<VariableDefinition[]>([]);
  const [showSendPreview, setShowSendPreview] = useState(false);
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);

  // Document attachments state
  const [selectedDocuments, setSelectedDocuments] = useState<DocumentResponseDto[]>([]);
  const [documentSearchQuery, setDocumentSearchQuery] = useState('');
  const [documentSearchResults, setDocumentSearchResults] = useState<DocumentResponseDto[]>([]);
  const [searchingDocs, setSearchingDocs] = useState(false);
  const [showDocPicker, setShowDocPicker] = useState(false);

  // Template dialog state (create/edit)
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [templateDialogMode, setTemplateDialogMode] = useState<'create' | 'edit'>('create');
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);
  const [templateForm, setTemplateForm] = useState<EmailTemplateRequest>({
    name: '',
    subject: '',
    bodyHtml: '<p>Hello {{name}},</p>\n<p>Your content here...</p>',
    variables: ['name'],
    isActive: true
  });
  const [templateSaving, setTemplateSaving] = useState(false);

  // View template dialog
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingTemplate, setViewingTemplate] = useState<EmailTemplate | null>(null);

  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);
  const [deletingTemplateName, setDeletingTemplateName] = useState<string>('');
  const [deleting, setDeleting] = useState(false);

  // Get only active templates for send email picker
  const activeTemplates = emailTemplates.filter(t => t.isActive);

  // Fetch available variables from backend on mount (same as CampaignFormModal)
  useEffect(() => {
    emailManagementService.getVariables()
      .then(setAvailableVariables)
      .catch(err => console.error('Failed to fetch variables:', err));
  }, []);

  // Auto-dismiss notification
  React.useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Search system users with debounce
  React.useEffect(() => {
    if (!userSearchQuery || userSearchQuery.length < 2) {
      setUserSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const results = await userManagementService.quickSearchUsers(userSearchQuery);
        // Filter out already selected users
        const selectedIds = new Set(selectedSystemUsers.map(u => u.id));
        setUserSearchResults(results.filter(u => !selectedIds.has(u.id)));
      } catch (error) {
        console.error('Failed to search users:', error);
        setUserSearchResults([]);
      } finally {
        setSearchingUsers(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [userSearchQuery, selectedSystemUsers]);

  // Update sendForm.to whenever recipients change
  React.useEffect(() => {
    const systemUserEmails = selectedSystemUsers.map(u => u.email).filter(Boolean) as string[];
    setSendForm(prev => ({
      ...prev,
      to: [...systemUserEmails, ...externalRecipients]
    }));
  }, [selectedSystemUsers, externalRecipients]);

  // System user handlers
  const handleSelectSystemUser = (user: UserDto) => {
    setSelectedSystemUsers(prev => [...prev, user]);
    setUserSearchQuery('');
    setUserSearchResults([]);
  };

  const handleRemoveSystemUser = (userId: string) => {
    setSelectedSystemUsers(prev => prev.filter(u => u.id !== userId));
  };

  // External recipient handlers
  const handleAddExternalRecipient = () => {
    if (!externalEmailInput.trim()) return;
    const emails = externalEmailInput.split(',').map(e => e.trim()).filter(e => e && e.includes('@'));
    const newEmails = emails.filter(e => !externalRecipients.includes(e));
    setExternalRecipients(prev => [...prev, ...newEmails]);
    setExternalEmailInput('');
  };

  const handleRemoveExternalRecipient = (email: string) => {
    setExternalRecipients(prev => prev.filter(e => e !== email));
  };


  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (templateId !== 'none') {
      const template = activeTemplates.find(t => String(t.id) === templateId);
      if (template) {
        setSendForm(prev => ({
          ...prev,
          subject: template.subject,
          bodyHtml: template.bodyHtml,
          templateId: template.id,
          variables: {}
        }));
      }
    } else {
      setSendForm(prev => ({
        ...prev,
        templateId: undefined,
        documentIds: selectedDocuments.map(d => d.documentId),
        variables: undefined
      }));
    }
  };

  const handleSendEmail = async () => {
    if (!sendForm.to?.length) {
      setNotification({ type: 'error', title: 'Error', message: 'Please add at least one recipient' });
      return;
    }
    if (!sendForm.subject || !sendForm.bodyHtml) {
      setNotification({ type: 'error', title: 'Error', message: 'Please provide subject and body' });
      return;
    }

    setSending(true);
    try {
      const response = await emailManagementService.sendEmail(sendForm);
      setNotification({
        type: 'success',
        title: 'Email Queued',
        message: `Email queued for delivery. Log ID: ${response.logId}`
      });
      setSendDialogOpen(false);
      setSendForm({ to: [], subject: '', bodyHtml: '<p>Your message here...</p>', documentIds: [] });
      setSelectedTemplateId('none');
      setSelectedDocuments([]);
      setShowSendPreview(false);
      setSelectedSystemUsers([]);
      setExternalRecipients([]);
      setUserSearchQuery('');
      handleRefresh();
    } catch (error: any) {
      setNotification({ type: 'error', title: 'Failed', message: error.message || 'Failed to send email' });
    } finally {
      setSending(false);
    }
  };

  // Document attachment handlers
  const handleSearchDocuments = useCallback(async (query: string) => {
    setDocumentSearchQuery(query);
    if (!query.trim() || query.length < 2) {
      setDocumentSearchResults([]);
      return;
    }

    setSearchingDocs(true);
    try {
      const result = await documentService.searchDocuments(query, 0, 10);
      // Filter out already selected documents
      const filtered = (result?.content || []).filter(
        doc => !selectedDocuments.some(sel => sel.documentId === doc.documentId)
      );
      setDocumentSearchResults(filtered);
    } catch (error) {
      console.error('Document search failed:', error);
      setDocumentSearchResults([]);
    } finally {
      setSearchingDocs(false);
    }
  }, [selectedDocuments]);

  const handleAddDocument = (doc: DocumentResponseDto) => {
    if (!selectedDocuments.some(d => d.documentId === doc.documentId)) {
      setSelectedDocuments(prev => [...prev, doc]);
      setSendForm(prev => ({
        ...prev,
        documentIds: [...(prev.documentIds || []), doc.documentId]
      }));
    }
    setDocumentSearchResults([]);
    setDocumentSearchQuery('');
    setShowDocPicker(false);
  };

  const handleRemoveDocument = (docId: number) => {
    setSelectedDocuments(prev => prev.filter(d => d.documentId !== docId));
    setSendForm(prev => ({
      ...prev,
      documentIds: (prev.documentIds || []).filter(id => id !== docId)
    }));
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Template CRUD handlers
  const handleCreateTemplate = () => {
    setTemplateDialogMode('create');
    setEditingTemplateId(null);
    setTemplateForm({
      name: '',
      subject: '',
      bodyHtml: '<p>Hello {{name}},</p>\n<p>Your content here...</p>',
      variables: ['name'],
      isActive: true
    });
    setTemplateDialogOpen(true);
  };

  const handleEditTemplate = async (templateId: string) => {
    try {
      const template = await emailManagementService.getTemplate(Number(templateId));
      setTemplateDialogMode('edit');
      setEditingTemplateId(template.id);
      setTemplateForm({
        name: template.name,
        subject: template.subject,
        bodyHtml: template.bodyHtml,
        variables: template.variables,
        isActive: template.isActive
      });
      setTemplateDialogOpen(true);
    } catch (error: any) {
      setNotification({ type: 'error', title: 'Error', message: 'Failed to load template' });
    }
  };

  const handleViewTemplate = async (templateId: string) => {
    try {
      const template = await emailManagementService.getTemplate(Number(templateId));
      setViewingTemplate(template);
      setViewDialogOpen(true);
    } catch (error: any) {
      setNotification({ type: 'error', title: 'Error', message: 'Failed to load template' });
    }
  };

  const handleDeleteTemplateClick = (templateId: string, templateName: string) => {
    setDeletingTemplateId(templateId);
    setDeletingTemplateName(templateName);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingTemplateId) return;
    setDeleting(true);
    try {
      await emailManagementService.deleteTemplate(Number(deletingTemplateId));
      setNotification({ type: 'success', title: 'Deleted', message: 'Template deleted successfully' });
      setDeleteDialogOpen(false);
      loadTemplates();
    } catch (error: any) {
      setNotification({ type: 'error', title: 'Error', message: error.message || 'Failed to delete template' });
    } finally {
      setDeleting(false);
      setDeletingTemplateId(null);
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.name || !templateForm.subject || !templateForm.bodyHtml) {
      setNotification({ type: 'error', title: 'Error', message: 'Please fill in all required fields' });
      return;
    }

    setTemplateSaving(true);
    try {
      // Auto-extract variables from subject + body (no manual input needed)
      const allText = templateForm.subject + ' ' + templateForm.bodyHtml;
      const extractedVars = autoExtractVariables(allText);
      const formWithVars = { ...templateForm, variables: extractedVars };

      if (templateDialogMode === 'edit' && editingTemplateId) {
        await emailManagementService.updateTemplate(editingTemplateId, formWithVars);
        setNotification({ type: 'success', title: 'Success', message: 'Template updated successfully' });
      } else {
        await emailManagementService.createTemplate(formWithVars);
        setNotification({ type: 'success', title: 'Success', message: 'Template created successfully' });
      }
      setTemplateDialogOpen(false);
      loadTemplates();
    } catch (error: any) {
      setNotification({ type: 'error', title: 'Error', message: error.message || 'Failed to save template' });
    } finally {
      setTemplateSaving(false);
    }
  };

  // Use template in send email
  const handleUseTemplate = (templateId: string) => {
    const template = emailTemplates.find(t => String(t.id) === templateId);
    if (template && template.isActive) {
      setSelectedTemplateId(templateId);
      setSendForm(prev => ({
        ...prev,
        subject: template.subject,
        bodyHtml: template.bodyHtml,
        templateId: template.id
      }));
      setSendDialogOpen(true);
    } else {
      setNotification({ type: 'error', title: 'Error', message: 'Only active templates can be used' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className={`
          fixed bottom-6 right-6 z-50 flex items-center gap-3 p-4 rounded-lg border shadow-lg animate-in slide-in-from-right-2 duration-300 max-w-md
          ${notification.type === 'success'
            ? 'bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-500/30 text-green-800 dark:text-green-200'
            : 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-500/30 text-red-800 dark:text-red-200'
          }
        `}>
          {notification.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <X className="h-5 w-5" />}
          <div className="flex-1">
            <p className="font-semibold">{notification.title}</p>
            <p className="text-sm opacity-80">{notification.message}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setNotification(null)} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Email Management</h1>
          <p className="text-muted-foreground">Manage email campaigns, templates, and delivery logs</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button className="gap-2" onClick={() => setSendDialogOpen(true)}>
            <Send className="h-4 w-4" />
            Send Email
          </Button>
        </div>
      </div>

      {/* Email Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sent</p>
                <p className="text-2xl font-semibold">{formatNumber(emailStats.totalSent)}</p>
              </div>
              <Send className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sent Rate</p>
                <p className="text-2xl font-semibold">{emailStats.sentRate}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>




        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Click Rate</p>
                <p className="text-2xl font-semibold">{emailStats.clickRate}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="campaigns" className="gap-2">
            <Send className="h-4 w-4" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <Database className="h-4 w-4" />
            Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns">
          <CampaignsTab templates={emailTemplates} />
        </TabsContent>

        <TabsContent value="templates">
          {/* Templates Tab - Inline Implementation */}
          <div className="space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search templates..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={handleStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button className="gap-2" onClick={handleCreateTemplate}>
                    <Plus className="h-4 w-4" />
                    Create Template
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Templates Grid with Infinite Scroll */}
            <div
              ref={templatesContainerRef}
              className="overflow-y-auto max-h-[600px] pr-2"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No templates found</p>
                    <Button variant="outline" className="mt-4" onClick={handleCreateTemplate}>
                      Create your first template
                    </Button>
                  </div>
                ) : (
                  filteredTemplates.map((template) => (
                    <Card key={template.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg truncate">{template.name}</CardTitle>
                            <CardDescription className="truncate">{template.subject}</CardDescription>
                          </div>
                          <Badge variant={template.status === 'active' ? 'default' : 'secondary'}>
                            {template.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 gap-1"
                            onClick={() => handleEditTemplate(template.id)}
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewTemplate(template.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteTemplateClick(template.id, template.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        {template.status === 'active' && (
                          <Button
                            variant="default"
                            size="sm"
                            className="w-full gap-2"
                            onClick={() => handleUseTemplate(template.id)}
                          >
                            <Send className="h-4 w-4" />
                            Use Template
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
              {/* Loading indicator for infinite scroll */}
              {loadingMoreTemplates && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading more...</span>
                </div>
              )}
              {!hasMoreTemplates && filteredTemplates.length > 0 && (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  All templates loaded ({filteredTemplates.length} total)
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="logs">
          <LogsTab
            logs={filteredLogs}
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            onSearch={handleSearch}
            onStatusFilter={handleStatusFilter}
            loadMoreLogs={loadMoreLogs}
            hasMoreLogs={hasMoreLogs}
            loadingMoreLogs={loadingMoreLogs}
          />
        </TabsContent>
      </Tabs>

      {/* Send Email Dialog */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Send Email
            </DialogTitle>
            <DialogDescription>
              Compose and send an email to one or more recipients
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Template Selection */}
            {activeTemplates.length > 0 && (
              <div className="space-y-2">
                <Label>Use Template (Optional)</Label>
                <Select value={selectedTemplateId} onValueChange={handleTemplateSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No template - compose manually</SelectItem>
                    {activeTemplates.map(template => (
                      <SelectItem key={template.id} value={String(template.id)}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Only active templates are shown here
                </p>
              </div>
            )}


            {/* System Users Section */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                System Users
              </Label>
              <div className="relative">
                <Input
                  placeholder="Search by name or email..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                />
                {searchingUsers && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
                {userSearchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 max-h-48 overflow-auto bg-popover border rounded-md shadow-lg">
                    {userSearchResults.map(user => (
                      <button
                        key={user.id}
                        type="button"
                        className="w-full px-3 py-2 text-left hover:bg-accent flex items-center gap-3 transition-colors"
                        onClick={() => handleSelectSystemUser(user)}
                      >
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          {user.imageUrl ? (
                            <img src={user.imageUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                          ) : (
                            <span className="text-xs font-medium text-primary">
                              {(user.firstName?.[0] || '')}{(user.lastName?.[0] || user.username?.[0] || '')}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedSystemUsers.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedSystemUsers.map(user => (
                    <Badge key={user.id} className="gap-2 pl-1 pr-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      <div className="h-5 w-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                        {(user.firstName?.[0] || '')}{(user.lastName?.[0] || '')}
                      </div>
                      <span>{user.firstName} {user.lastName}</span>
                      <button onClick={() => handleRemoveSystemUser(user.id)} className="ml-1 hover:text-red-500">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Search and select system users. Their names will be personalized in the email.
              </p>
            </div>

            {/* External Recipients Section */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                External Recipients
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter external email addresses..."
                  value={externalEmailInput}
                  onChange={(e) => setExternalEmailInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddExternalRecipient())}
                />
                <Button variant="outline" onClick={handleAddExternalRecipient}>Add</Button>
              </div>
              {externalRecipients.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {externalRecipients.map((email) => (
                    <Badge key={email} variant="secondary" className="gap-1">
                      {email}
                      <button onClick={() => handleRemoveExternalRecipient(email)} className="ml-1 hover:text-red-500">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                External emails will use generic greeting like "Hello there".
              </p>
            </div>

            {/* Recipients Summary */}
            {(selectedSystemUsers.length > 0 || externalRecipients.length > 0) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium">Total recipients:</span>
                {selectedSystemUsers.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {selectedSystemUsers.length} system user{selectedSystemUsers.length !== 1 ? 's' : ''}
                  </Badge>
                )}
                {externalRecipients.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {externalRecipients.length} external
                  </Badge>
                )}
              </div>
            )}


            <div className="space-y-2">
              <Label>Subject *</Label>
              <Input
                placeholder="Email subject..."
                value={sendForm.subject}
                onChange={(e) => setSendForm({ ...sendForm, subject: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Email Body *</Label>
              <RichEmailEditor
                value={sendForm.bodyHtml || ''}
                onChange={(html) => setSendForm({ ...sendForm, bodyHtml: html })}
                availableVariables={availableVariables}
                placeholder="Start writing your email..."
                onPreview={() => setShowSendPreview(true)}
              />
            </div>

            {/* Document Attachments */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  Attachments
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDocPicker(!showDocPicker)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Document
                </Button>
              </div>

              {/* Document Picker */}
              {showDocPicker && (
                <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search documents by name..."
                      value={documentSearchQuery}
                      onChange={(e) => handleSearchDocuments(e.target.value)}
                      className="pl-9"
                    />
                    {searchingDocs && (
                      <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>

                  {/* Search Results */}
                  {documentSearchResults.length > 0 && (
                    <div className="border rounded-md max-h-40 overflow-y-auto">
                      {documentSearchResults.map((doc) => (
                        <button
                          key={doc.documentId}
                          type="button"
                          onClick={() => handleAddDocument(doc)}
                          className="w-full flex items-center gap-3 p-2 hover:bg-accent text-left transition-colors border-b last:border-b-0"
                        >
                          <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(doc.sizeBytes)} • {doc.mimeType}
                            </p>
                          </div>
                          <Plus className="h-4 w-4 text-primary flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}

                  {documentSearchQuery.length >= 2 && documentSearchResults.length === 0 && !searchingDocs && (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      No documents found
                    </p>
                  )}
                </div>
              )}

              {/* Selected Documents */}
              {selectedDocuments.length > 0 && (
                <div className="space-y-2">
                  {selectedDocuments.map((doc) => (
                    <div
                      key={doc.documentId}
                      className="flex items-center gap-3 p-2 bg-muted/50 rounded-md border"
                    >
                      <File className="h-4 w-4 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(doc.sizeBytes)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveDocument(doc.documentId)}
                        className="h-8 w-8 p-0 hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground">
                    {selectedDocuments.length} document(s) selected • Max 20MB total
                  </p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSendEmail} disabled={sending} className="gap-2">
              {sending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {sending ? 'Sending...' : 'Send Email'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Email Preview Modal */}
      {showSendPreview && (
        <EmailPreviewPanel
          subject={sendForm.subject || ''}
          bodyHtml={sendForm.bodyHtml || ''}
          onClose={() => setShowSendPreview(false)}
          onFetchPreview={async (recipientId) => {
            return emailManagementService.previewEmail({
              subject: sendForm.subject || '',
              bodyHtml: sendForm.bodyHtml || '',
              recipientId,
            });
          }}
        />
      )}

      {/* Create/Edit Template Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {templateDialogMode === 'edit' ? 'Edit Template' : 'Create Template'}
            </DialogTitle>
            <DialogDescription>
              {templateDialogMode === 'edit'
                ? 'Update the email template details'
                : 'Create a new reusable email template'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Template Name *</Label>
                <Input
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  placeholder="e.g., Welcome Email"
                />
              </div>
              <div className="space-y-2 flex items-end gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={templateForm.isActive}
                    onCheckedChange={(checked) => setTemplateForm({ ...templateForm, isActive: checked })}
                  />
                  <Label>Active</Label>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Subject *</Label>
              <Input
                value={templateForm.subject}
                onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                placeholder="e.g., Hello {{name}}, welcome!"
              />
            </div>
            <div className="space-y-2">
              <Label>Email Body *</Label>
              <RichEmailEditor
                value={templateForm.bodyHtml}
                onChange={(html) => setTemplateForm({ ...templateForm, bodyHtml: html })}
                availableVariables={availableVariables}
                placeholder="Start writing your template..."
                onPreview={() => setShowTemplatePreview(true)}
              />
              <p className="text-xs text-muted-foreground">
                Use the variable picker in the toolbar to insert {'{{variables}}'} — they are auto-detected on save.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveTemplate} disabled={templateSaving}>
              {templateSaving ? 'Saving...' : templateDialogMode === 'edit' ? 'Update Template' : 'Create Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Preview Modal */}
      {showTemplatePreview && (
        <EmailPreviewPanel
          subject={templateForm.subject}
          bodyHtml={templateForm.bodyHtml}
          onClose={() => setShowTemplatePreview(false)}
          onFetchPreview={async (recipientId) => {
            return emailManagementService.previewEmail({
              subject: templateForm.subject,
              bodyHtml: templateForm.bodyHtml,
              recipientId,
            });
          }}
        />
      )}

      {/* View Template Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              {viewingTemplate?.name || 'Template Preview'}
            </DialogTitle>
            <DialogDescription>
              Preview of the email template
            </DialogDescription>
          </DialogHeader>
          {viewingTemplate && (
            <div className="space-y-4 py-4 overflow-y-auto flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={viewingTemplate.isActive ? 'default' : 'secondary'}>
                  {viewingTemplate.isActive ? 'Active' : 'Inactive'}
                </Badge>
                {viewingTemplate.variables.length > 0 && (
                  <span className="text-sm text-muted-foreground break-all">
                    Variables: {viewingTemplate.variables.map(v => `{{${v}}}`).join(', ')}
                  </span>
                )}
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <div className="p-3 bg-muted rounded-md break-words">{viewingTemplate.subject}</div>
              </div>
              <div className="space-y-2">
                <Label>HTML Body Preview</Label>
                <div className="border rounded-md overflow-hidden">
                  <ScrollArea className="h-[250px]">
                    <div
                      className="p-4 prose prose-sm max-w-none break-words overflow-hidden"
                      style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                      dangerouslySetInnerHTML={{ __html: viewingTemplate.bodyHtml }}
                    />
                  </ScrollArea>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Raw HTML</Label>
                <div className="border rounded-md overflow-hidden">
                  <pre className="p-3 bg-muted text-xs overflow-auto max-h-[120px] font-mono whitespace-pre-wrap break-all">
                    {viewingTemplate.bodyHtml}
                  </pre>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
            {viewingTemplate?.isActive && (
              <Button onClick={() => {
                setViewDialogOpen(false);
                handleUseTemplate(String(viewingTemplate.id));
              }}>
                Use Template
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete Template
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>"{deletingTemplateName}"</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
