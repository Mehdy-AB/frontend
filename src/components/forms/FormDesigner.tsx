'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Save,
  Eye,
  Settings,
  Plus,
  Trash2,
  GripVertical,
  Type,
  Mail,
  Hash,
  Calendar,
  FileText,
  CheckSquare,
  Radio,
  List,
  Upload,
  Star,
  MapPin,
  Edit3,
  X,
  ArrowLeft,
  Folder,
  File,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CreateFormRequest, CreateFormFieldRequest, FolderResDto } from '@/types/api';
import { Badge } from '@/components/ui/badge';
import { folderService } from '@/api/services/folderService';
import { formService } from '@/api/services/formService';
import FolderPickerModal from '@/components/modals/FolderPickerModal';

interface FormDesignerProps {
  initialData?: CreateFormRequest;
  initialFolderName?: string;
  onSave: (data: CreateFormRequest) => void;
  onCancel: () => void;
  saving?: boolean;
}

interface FieldTemplate {
  type: string;
  icon: React.ReactNode;
  label: string;
  description: string;
}

const FIELD_TEMPLATES: FieldTemplate[] = [
  { type: 'TEXT', icon: <Type className="w-4 h-4" />, label: 'Text Input', description: 'Single line text' },
  { type: 'EMAIL', icon: <Mail className="w-4 h-4" />, label: 'Email', description: 'Email address' },
  { type: 'NUMBER', icon: <Hash className="w-4 h-4" />, label: 'Number', description: 'Numeric input' },
  { type: 'TEXTAREA', icon: <FileText className="w-4 h-4" />, label: 'Text Area', description: 'Multi-line text' },
  { type: 'SELECT', icon: <List className="w-4 h-4" />, label: 'Dropdown', description: 'Select from options' },
  { type: 'RADIO', icon: <Radio className="w-4 h-4" />, label: 'Radio Buttons', description: 'Single choice' },
  { type: 'CHECKBOX', icon: <CheckSquare className="w-4 h-4" />, label: 'Checkboxes', description: 'Multiple choice' },
  { type: 'DATE', icon: <Calendar className="w-4 h-4" />, label: 'Date', description: 'Date picker' },
  { type: 'FILE_UPLOAD', icon: <Upload className="w-4 h-4" />, label: 'File Upload', description: 'File attachment' },
  { type: 'RATING', icon: <Star className="w-4 h-4" />, label: 'Rating', description: 'Star rating' },
];

export default function FormDesigner({ initialData, initialFolderName, onSave, onCancel, saving }: FormDesignerProps) {
  const [activeTab, setActiveTab] = useState<'design' | 'settings' | 'preview'>('design');
  const [formData, setFormData] = useState<CreateFormRequest>(
    initialData || {
      name: '',
      slug: '',
      description: '',
      category: '',
      allowMultipleSubmissions: true,
      requireAuthentication: false,
      isPublic: true,
      showProgressBar: true,
      isMultiStep: false,
      sendEmailNotification: false,
      sendConfirmationEmail: false,
      sendConfirmationEmail: false,
      closeAfterMaxSubmissions: false,
      createDocumentOnSubmit: true,
      fields: []
    }
  );
  const [fields, setFields] = useState<CreateFormFieldRequest[]>(initialData?.fields || []);
  const [selectedField, setSelectedField] = useState<number | null>(null);
  const [showFieldConfig, setShowFieldConfig] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Document generation state
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<{ id: number; name: string } | null>(
    initialData?.saveToFolderId && initialFolderName
      ? { id: initialData.saveToFolderId, name: initialFolderName }
      : null
  );
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [uploadingTemplate, setUploadingTemplate] = useState(false);

  // Load selected folder name on mount if saveToFolderId is set
  useEffect(() => {
    const loadFolder = async () => {
      if (formData.saveToFolderId && !selectedFolder) {
        try {
          const folder = await folderService.getFolderById(formData.saveToFolderId);
          setSelectedFolder({ id: folder.id, name: folder.name });
        } catch (error) {
          console.error('Error loading folder:', error);
        }
      }
    };
    loadFolder();
  }, [formData.saveToFolderId]);

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }));
  };

  const addField = (template: FieldTemplate) => {
    const newField: CreateFormFieldRequest = {
      label: template.label,
      fieldKey: `field_${Date.now()}`,
      fieldType: template.type,
      placeholder: '',
      description: '',
      isRequired: false,
      orderIndex: fields.length,
      stepNumber: 1,
      width: 'full',
      allowMultipleFiles: false,
      options: ['SELECT', 'RADIO', 'CHECKBOX', 'MULTI_SELECT'].includes(template.type)
        ? ['Option 1', 'Option 2', 'Option 3']
        : undefined
    };
    setFields([...fields, newField]);
    setSelectedField(fields.length);
    setShowFieldConfig(true);
  };

  const updateField = (index: number, updates: Partial<CreateFormFieldRequest>) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], ...updates };
    setFields(updated);
  };

  const removeField = (index: number) => {
    const updated = fields.filter((_, i) => i !== index);
    // Reorder indices
    updated.forEach((field, i) => {
      field.orderIndex = i;
    });
    setFields(updated);
    if (selectedField === index) {
      setSelectedField(null);
      setShowFieldConfig(false);
    }
  };

  const moveField = (fromIndex: number, toIndex: number) => {
    const updated = [...fields];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    // Reorder indices
    updated.forEach((field, i) => {
      field.orderIndex = i;
    });
    setFields(updated);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    moveField(draggedIndex, index);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSave = () => {
    const dataToSave = {
      ...formData,
      fields
    };
    onSave(dataToSave);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Form Designer</h1>
            <p className="text-sm text-gray-500">
              {formData.name || 'Untitled Form'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === 'design' ? 'default' : 'outline'}
            onClick={() => setActiveTab('design')}
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Design
          </Button>
          <Button
            variant={activeTab === 'settings' ? 'default' : 'outline'}
            onClick={() => setActiveTab('settings')}
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button
            variant={activeTab === 'preview' ? 'default' : 'outline'}
            onClick={() => setActiveTab('preview')}
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handleSave} disabled={saving || !formData.name || !formData.slug || !formData.saveToFolderId}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Form'}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {activeTab === 'design' && (
          <>
            {/* Field Palette */}
            <div className="w-64 bg-white border-r overflow-y-auto p-4">
              <h3 className="font-semibold mb-4">Add Fields</h3>
              <div className="space-y-2">
                {FIELD_TEMPLATES.map((template) => (
                  <button
                    key={template.type}
                    onClick={() => addField(template)}
                    className="w-full text-left p-3 rounded-lg border hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {template.icon}
                      <span className="font-medium text-sm">{template.label}</span>
                    </div>
                    <p className="text-xs text-gray-500">{template.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-3xl mx-auto">
                <Card className="mb-6">
                  <CardHeader>
                    <Input
                      placeholder="Form Name"
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="text-2xl font-bold border-none p-0 h-auto focus-visible:ring-0"
                    />
                    <Textarea
                      placeholder="Form Description (optional)"
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="mt-2 border-none p-0 resize-none focus-visible:ring-0"
                      rows={2}
                    />
                  </CardHeader>
                </Card>

                {fields.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Plus className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No fields yet</h3>
                      <p className="text-gray-500">
                        Add fields from the left panel to start building your form
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {fields.map((field, index) => (
                      <Card
                        key={index}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        className={`cursor-move hover:shadow-md transition-shadow ${selectedField === index ? 'ring-2 ring-blue-500' : ''
                          }`}
                        onClick={() => {
                          setSelectedField(index);
                          setShowFieldConfig(true);
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <GripVertical className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{field.label}</span>
                                {field.isRequired && (
                                  <Badge variant="destructive" className="text-xs">Required</Badge>
                                )}
                                <Badge variant="outline" className="text-xs">{field.fieldType}</Badge>
                              </div>
                              {field.description && (
                                <p className="text-sm text-gray-500 mb-2">{field.description}</p>
                              )}
                              {['SELECT', 'MULTI_SELECT'].includes(field.fieldType) && field.options && field.options.length > 0 ? (
                                <Select disabled>
                                  <SelectTrigger className="mt-2">
                                    <SelectValue placeholder={field.placeholder || 'Select an option...'} />
                                  </SelectTrigger>
                                </Select>
                              ) : ['RADIO', 'CHECKBOX'].includes(field.fieldType) && field.options && field.options.length > 0 ? (
                                <div className="mt-2 space-y-2">
                                  {field.options.map((opt: string, optIdx: number) => (
                                    <div key={optIdx} className="flex items-center gap-2">
                                      <input
                                        type={field.fieldType === 'RADIO' ? 'radio' : 'checkbox'}
                                        disabled
                                        className="rounded"
                                      />
                                      <span className="text-sm">{opt || `Option ${optIdx + 1}`}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <Input
                                  placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                                  disabled
                                  className="mt-2"
                                />
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeField(index);
                              }}
                              className="flex-shrink-0"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Field Configuration Panel */}
            {showFieldConfig && selectedField !== null && (
              <div className="w-96 bg-white border-l overflow-y-auto p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Field Settings</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowFieldConfig(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label>Label</Label>
                    <Input
                      value={fields[selectedField].label}
                      onChange={(e) => updateField(selectedField, { label: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Field Key</Label>
                    <Input
                      value={fields[selectedField].fieldKey}
                      onChange={(e) => updateField(selectedField, { fieldKey: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Placeholder</Label>
                    <Input
                      value={fields[selectedField].placeholder || ''}
                      onChange={(e) => updateField(selectedField, { placeholder: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={fields[selectedField].description || ''}
                      onChange={(e) => updateField(selectedField, { description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Required</Label>
                    <Switch
                      checked={fields[selectedField].isRequired}
                      onCheckedChange={(checked) => updateField(selectedField, { isRequired: checked })}
                    />
                  </div>
                  <div>
                    <Label>Width</Label>
                    <Select
                      value={fields[selectedField].width}
                      onValueChange={(value) => updateField(selectedField, { width: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Full Width</SelectItem>
                        <SelectItem value="half">Half Width</SelectItem>
                        <SelectItem value="third">One Third</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {['TEXT', 'TEXTAREA'].includes(fields[selectedField].fieldType) && (
                    <>
                      <div>
                        <Label>Min Length</Label>
                        <Input
                          type="number"
                          value={fields[selectedField].minLength || ''}
                          onChange={(e) => updateField(selectedField, { minLength: parseInt(e.target.value) || undefined })}
                        />
                      </div>
                      <div>
                        <Label>Max Length</Label>
                        <Input
                          type="number"
                          value={fields[selectedField].maxLength || ''}
                          onChange={(e) => updateField(selectedField, { maxLength: parseInt(e.target.value) || undefined })}
                        />
                      </div>
                    </>
                  )}
                  {fields[selectedField].fieldType === 'NUMBER' && (
                    <>
                      <div>
                        <Label>Min Value</Label>
                        <Input
                          type="number"
                          value={fields[selectedField].minValue || ''}
                          onChange={(e) => updateField(selectedField, { minValue: parseFloat(e.target.value) || undefined })}
                        />
                      </div>
                      <div>
                        <Label>Max Value</Label>
                        <Input
                          type="number"
                          value={fields[selectedField].maxValue || ''}
                          onChange={(e) => updateField(selectedField, { maxValue: parseFloat(e.target.value) || undefined })}
                        />
                      </div>
                    </>
                  )}

                  {/* Options for RADIO, CHECKBOX, and SELECT fields */}
                  {['RADIO', 'CHECKBOX', 'SELECT', 'MULTI_SELECT'].includes(fields[selectedField].fieldType) && (
                    <div>
                      <Label className="mb-2 block">Options</Label>
                      <div className="space-y-2">
                        {(fields[selectedField].options || []).map((option: string, optIdx: number) => (
                          <div key={optIdx} className="flex items-center gap-2">
                            <Input
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...((fields[selectedField].options || []) as string[])];
                                newOptions[optIdx] = e.target.value;
                                updateField(selectedField, { options: newOptions });
                              }}
                              placeholder={`Option ${optIdx + 1}`}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const newOptions = (fields[selectedField].options || []).filter((_: string, i: number) => i !== optIdx);
                                updateField(selectedField, { options: newOptions });
                              }}
                            >
                              <X className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newOptions = [...((fields[selectedField].options || []) as string[]), ''];
                            updateField(selectedField, { options: newOptions });
                          }}
                          className="w-full"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Option
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* File Upload Settings */}
                  {['FILE_UPLOAD', 'IMAGE_UPLOAD'].includes(fields[selectedField].fieldType) && (
                    <>
                      <div>
                        <Label>Allowed File Types</Label>
                        <Input
                          value={fields[selectedField].allowedFileTypes || ''}
                          onChange={(e) => updateField(selectedField, { allowedFileTypes: e.target.value })}
                          placeholder="e.g., pdf,doc,docx"
                        />
                        <p className="text-xs text-gray-500 mt-1">Comma-separated file extensions</p>
                      </div>
                      <div>
                        <Label>Max File Size (MB)</Label>
                        <Input
                          type="number"
                          value={fields[selectedField].maxFileSizeMb || 10}
                          onChange={(e) => updateField(selectedField, { maxFileSizeMb: parseInt(e.target.value) || 10 })}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'settings' && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Form Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>URL Slug</Label>
                    <Input
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Public URL: /forms/{formData.slug || 'your-form'}
                    </p>
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Input
                      value={formData.category || ''}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="e.g., Contact, Survey, Registration"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Access & Permissions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Public Form</Label>
                      <p className="text-sm text-gray-500">Anyone with the link can access</p>
                    </div>
                    <Switch
                      checked={formData.isPublic}
                      onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Require Authentication</Label>
                      <p className="text-sm text-gray-500">Users must be logged in</p>
                    </div>
                    <Switch
                      checked={formData.requireAuthentication}
                      onCheckedChange={(checked) => setFormData({ ...formData, requireAuthentication: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Allow Multiple Submissions</Label>
                      <p className="text-sm text-gray-500">Users can submit multiple times</p>
                    </div>
                    <Switch
                      checked={formData.allowMultipleSubmissions}
                      onCheckedChange={(checked) => setFormData({ ...formData, allowMultipleSubmissions: checked })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-gray-500">Notify admin on new submission</p>
                    </div>
                    <Switch
                      checked={formData.sendEmailNotification}
                      onCheckedChange={(checked) => setFormData({ ...formData, sendEmailNotification: checked })}
                    />
                  </div>
                  {formData.sendEmailNotification && (
                    <div>
                      <Label>Notification Email</Label>
                      <Input
                        type="email"
                        value={formData.notificationEmail || ''}
                        onChange={(e) => setFormData({ ...formData, notificationEmail: e.target.value })}
                      />
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Confirmation Emails</Label>
                      <p className="text-sm text-gray-500">Send confirmation to submitter</p>
                    </div>
                    <Switch
                      checked={formData.sendConfirmationEmail}
                      onCheckedChange={(checked) => setFormData({ ...formData, sendConfirmationEmail: checked })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Submission Limits</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Maximum Submissions</Label>
                    <Input
                      type="number"
                      value={formData.maxSubmissions || ''}
                      onChange={(e) => setFormData({ ...formData, maxSubmissions: parseInt(e.target.value) || undefined })}
                      placeholder="Unlimited"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Close After Max</Label>
                      <p className="text-sm text-gray-500">Auto-close when limit reached</p>
                    </div>
                    <Switch
                      checked={formData.closeAfterMaxSubmissions}
                      onCheckedChange={(checked) => setFormData({ ...formData, closeAfterMaxSubmissions: checked })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Styling</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Theme Color</Label>
                    <Input
                      type="color"
                      value={formData.themeColor || '#3B82F6'}
                      onChange={(e) => setFormData({ ...formData, themeColor: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Success Message</Label>
                    <Textarea
                      value={formData.successMessage || ''}
                      onChange={(e) => setFormData({ ...formData, successMessage: e.target.value })}
                      placeholder="Thank you for your submission!"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Document Generation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Document Generation
                  </CardTitle>
                  <CardDescription>
                    Generate Word documents from form submissions using templates
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Create Document on Submit</Label>
                      <p className="text-sm text-gray-500">Generate a document for each submission</p>
                    </div>
                    <Switch
                      checked={formData.createDocumentOnSubmit}
                      onCheckedChange={(checked) => setFormData({ ...formData, createDocumentOnSubmit: checked })}
                    />
                  </div>

                  {formData.createDocumentOnSubmit && (
                    <>
                      {/* Folder Selector */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Folder className="w-4 h-4" />
                          Target Folder
                        </Label>
                        {selectedFolder ? (
                          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <Folder className="w-4 h-4 text-blue-600" />
                            <span className="flex-1 text-sm font-medium">{selectedFolder.name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowFolderPicker(true)}
                            >
                              <Edit3 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedFolder(null);
                                setFormData({ ...formData, saveToFolderId: undefined });
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => setShowFolderPicker(true)}
                          >
                            <Folder className="w-4 h-4 mr-2" />
                            Select target folder...
                          </Button>
                        )}
                        <p className="text-xs text-gray-500">Documents will be saved to this folder</p>
                      </div>

                      {/* Template Upload */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <File className="w-4 h-4" />
                          Word Template (Optional)
                        </Label>
                        {formData.templateFilename ? (
                          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <FileText className="w-4 h-4 text-green-600" />
                            <span className="flex-1 text-sm font-medium">{formData.templateFilename}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setFormData({ ...formData, templateMinioKey: undefined, templateFilename: undefined });
                                setTemplateFile(null);
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed rounded-lg p-4 text-center">
                            <input
                              type="file"
                              accept=".docx,.doc"
                              className="hidden"
                              id="template-upload"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setTemplateFile(file);
                                  // For now, just store the filename - actual upload happens on save
                                  setFormData({
                                    ...formData,
                                    templateFilename: file.name
                                  });
                                }
                              }}
                            />
                            <label htmlFor="template-upload" className="cursor-pointer">
                              <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                              <p className="text-sm text-gray-600">Click to upload Word template</p>
                              <p className="text-xs text-gray-400 mt-1">.docx or .doc files</p>
                            </label>
                          </div>
                        )}
                      </div>

                      {/* Placeholder Info */}
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-amber-800">Template Placeholders</p>
                            <p className="text-xs text-amber-700 mt-1">
                              Use {'{$fieldKey}'} in your template to insert field values.
                            </p>
                            {fields.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {fields.map((field, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs font-mono">
                                    {'{$' + field.fieldKey + '}'}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'preview' && (
          <div className="flex-1 overflow-y-auto p-6 bg-gray-100">
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>{formData.name || 'Untitled Form'}</CardTitle>
                  {formData.description && (
                    <p className="text-gray-500 mt-2">{formData.description}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={index}>
                      <Label>
                        {field.label}
                        {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      {field.description && (
                        <p className="text-sm text-gray-500 mb-2">{field.description}</p>
                      )}
                      {['TEXT', 'EMAIL', 'NUMBER', 'PHONE', 'URL'].includes(field.fieldType) && (
                        <Input placeholder={field.placeholder || ''} />
                      )}
                      {field.fieldType === 'TEXTAREA' && (
                        <Textarea placeholder={field.placeholder || ''} rows={4} />
                      )}
                      {field.fieldType === 'SELECT' && (
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="option1">Option 1</SelectItem>
                            <SelectItem value="option2">Option 2</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      {field.fieldType === 'DATE' && (
                        <Input type="date" />
                      )}
                    </div>
                  ))}
                  <Button className="w-full">Submit</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Folder Picker Modal */}
      <FolderPickerModal
        isOpen={showFolderPicker}
        onClose={() => setShowFolderPicker(false)}
        onSelect={(folderId, folderName, folderPath) => {
          setSelectedFolder({ id: folderId, name: folderName });
          setFormData({ ...formData, saveToFolderId: folderId });
          setShowFolderPicker(false);
        }}
      />
    </div>
  );
}

