'use client';

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
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
  Info,
  Table,
  Sliders,
  ListChecks,
  Tag,
  Minus,
  Code,
  Clock
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
import { CreateFormRequest, CreateFormFieldRequest, FolderResDto, FilingCategoryResponseDto, UserDto } from '@/types/api';
import { Badge } from '@/components/ui/badge';
import { folderService } from '@/api/services/folderService';
import { formService } from '@/api/services/formService';
import { notificationApiClient } from '@/api/notificationClient';
import { SearchSelect } from '@/components/main/SearchSelect';
import FolderPickerModal from '@/components/modals/FolderPickerModal';
import { userManagementService } from '@/api/services/userManagementService';
import UserAvatar from '@/components/main/UserAvatar';

interface FormDesignerProps {
  formId?: number;
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

// Non-input field types (don't have key/required/placeholder)
const NON_INPUT_TYPES = ['SECTION_HEADER', 'DIVIDER', 'HTML_CONTENT'];

const FIELD_TEMPLATES: FieldTemplate[] = [
  { type: 'TEXT', icon: <Type className="w-4 h-4" />, label: 'Text Input', description: 'Single line text' },
  { type: 'EMAIL', icon: <Mail className="w-4 h-4" />, label: 'Email', description: 'Email address' },
  { type: 'NUMBER', icon: <Hash className="w-4 h-4" />, label: 'Number', description: 'Numeric input' },
  { type: 'TEXTAREA', icon: <FileText className="w-4 h-4" />, label: 'Text Area', description: 'Multi-line text' },
  { type: 'SELECT', icon: <List className="w-4 h-4" />, label: 'Dropdown', description: 'Select from options' },
  { type: 'MULTI_SELECT', icon: <ListChecks className="w-4 h-4" />, label: 'Multi Select', description: 'Choose multiple' },
  { type: 'RADIO', icon: <Radio className="w-4 h-4" />, label: 'Radio Buttons', description: 'Single choice' },
  { type: 'CHECKBOX', icon: <CheckSquare className="w-4 h-4" />, label: 'Checkbox', description: 'Yes/No toggle' },
  { type: 'DATE', icon: <Calendar className="w-4 h-4" />, label: 'Date', description: 'Date picker' },
  { type: 'TIME', icon: <Clock className="w-4 h-4" />, label: 'Time', description: 'Time picker' },
  { type: 'DATETIME', icon: <Calendar className="w-4 h-4" />, label: 'Date & Time', description: 'Date and time' },
  { type: 'FILE_UPLOAD', icon: <Upload className="w-4 h-4" />, label: 'File Upload', description: 'File attachment' },
  { type: 'RATING', icon: <Star className="w-4 h-4" />, label: 'Rating', description: 'Star rating' },
  { type: 'SLIDER', icon: <Sliders className="w-4 h-4" />, label: 'Slider', description: 'Range slider' },
  { type: 'TABLE', icon: <Table className="w-4 h-4" />, label: 'Table', description: 'Tabular data entry' },
  { type: 'SECTION_HEADER', icon: <Tag className="w-4 h-4" />, label: 'Label', description: 'Display-only text' },
  { type: 'DIVIDER', icon: <Minus className="w-4 h-4" />, label: 'Divider', description: 'Visual separator' },
  { type: 'HTML_CONTENT', icon: <Code className="w-4 h-4" />, label: 'HTML Content', description: 'Custom HTML/Tailwind' },
];

export default function FormDesigner({ formId, initialData, initialFolderName, onSave, onCancel, saving }: FormDesignerProps) {
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
      closeAfterMaxSubmissions: false,
      createDocumentOnSubmit: true,
      autoApprove: false,
      generateDocumentOnApprovalOnly: true,
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

  // Model (FilingCategory) integration state
  const [filingCategories, setFilingCategories] = useState<FilingCategoryResponseDto[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(initialData?.filingCategoryId);
  const [selectedCategory, setSelectedCategory] = useState<FilingCategoryResponseDto | null>(null);
  const [fieldMappings, setFieldMappings] = useState<any[]>(initialData?.fieldMetadataMappings || []);

  // Default creator user state (for non-auth forms)
  const [availableUsers, setAvailableUsers] = useState<UserDto[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Load users for default creator selector
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoadingUsers(true);
        const response = await userManagementService.getUsers(0, 100);
        setAvailableUsers(response.content || []);
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setLoadingUsers(false);
      }
    };
    loadUsers();
  }, []);

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!userSearchQuery.trim()) return availableUsers;
    const q = userSearchQuery.toLowerCase();
    return availableUsers.filter(u =>
      (u.displayName || '').toLowerCase().includes(q) ||
      (u.username || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q)
    );
  }, [availableUsers, userSearchQuery]);

  // Close user dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // Load filing categories for model selector
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await notificationApiClient.getAllFilingCategories({ size: 100 }, { silent: true });
        setFilingCategories(response.content || []);

        // If editing and has a category, find it in the loaded categories
        if (initialData?.filingCategoryId && response.content) {
          const cat = response.content.find((c: FilingCategoryResponseDto) => c.id === initialData.filingCategoryId);
          if (cat) {
            setSelectedCategory(cat);
          }
        }
      } catch (error) {
        console.error('Error loading filing categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };
    loadCategories();
  }, [initialData?.filingCategoryId]);

  // Get selected category metadata definitions
  const metadataDefinitions = selectedCategory?.metadataDefinitions || [];

  // Type compatibility mapping: metadata type -> allowed form field types
  // STRING can accept any type (casting) but NUMBER/DATE/etc can only accept matching types
  // Map field types to their stored data types
  const getFieldDataType = (fieldType: string): string => {
    const ft = fieldType?.toUpperCase();
    switch (ft) {
      case 'NUMBER': case 'RATING': case 'SLIDER': return 'NUMBER';
      case 'DATE': return 'DATE';
      case 'TIME': return 'TIME';
      case 'DATETIME': return 'DATETIME';
      case 'CHECKBOX': return 'BOOLEAN';
      case 'TABLE': return 'TABLE';
      case 'MULTI_SELECT': return 'LIST';
      default: return 'TEXT';
    }
  };

  const NON_INPUT_TYPES = ['SECTION_HEADER', 'DIVIDER', 'HTML_CONTENT'];
  const NON_TEMPLATE_TYPES = ['SECTION_HEADER', 'DIVIDER', 'HTML_CONTENT', 'FILE_UPLOAD', 'IMAGE_UPLOAD'];

  const isTypeCompatible = (metadataDataType: string, formFieldType: string): boolean => {
    const metaType = metadataDataType?.toUpperCase();
    const fieldType = formFieldType?.toLowerCase();

    // Exclude non-input fields from mapping
    if (NON_INPUT_TYPES.map(t => t.toLowerCase()).includes(fieldType)) return false;

    // STRING/TEXT can accept anything (all values can be cast to string)
    if (metaType === 'STRING' || metaType === 'TEXT') {
      return true;
    }

    // NUMBER can accept: number, rating, slider
    if (metaType === 'NUMBER' || metaType === 'FLOAT') {
      return ['number', 'rating', 'slider'].includes(fieldType);
    }

    // DATE can accept: date
    if (metaType === 'DATE') {
      return fieldType === 'date';
    }

    // TIME can accept: time
    if (metaType === 'TIME') {
      return fieldType === 'time';
    }

    // DATETIME can accept: date, datetime, time
    if (metaType === 'DATETIME') {
      return ['date', 'datetime', 'time'].includes(fieldType);
    }

    // BOOLEAN can accept: checkbox, toggle, radio (yes/no)
    if (metaType === 'BOOLEAN') {
      return ['checkbox', 'toggle', 'switch'].includes(fieldType);
    }

    // LIST can accept: select, multi_select, radio, dropdown
    if (metaType === 'LIST') {
      return ['select', 'multi_select', 'radio', 'dropdown', 'text', 'textarea'].includes(fieldType);
    }

    // Default: allow if unknown type
    return true;
  };

  // Check static field type compatibility
  const isStaticTypeCompatible = (metadataDataType: string, staticFieldType: string): boolean => {
    const metaType = metadataDataType?.toUpperCase();

    // STRING accepts anything
    if (metaType === 'STRING' || metaType === 'TEXT') {
      return true;
    }

    // form_id and submission_id are numbers
    if (staticFieldType === 'form_id' || staticFieldType === 'submission_id') {
      return metaType === 'NUMBER' || metaType === 'STRING' || metaType === 'TEXT';
    }

    // creation_date is datetime
    if (staticFieldType === 'creation_date') {
      return metaType === 'DATETIME' || metaType === 'DATE' || metaType === 'STRING' || metaType === 'TEXT';
    }

    return true;
  };

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

  // Generate a simple field key from label: "Full Name" -> "full_name"
  // If duplicate exists, append _2, _3, etc.
  const generateFieldKey = (label: string, existingFields: CreateFormFieldRequest[], excludeIndex?: number): string => {
    // Convert label to snake_case key
    const baseKey = label
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '') || 'field';

    // Count existing fields with same base key (excluding current field if updating)
    const existingKeys = existingFields
      .filter((_, i) => i !== excludeIndex)
      .map(f => f.fieldKey);

    // Check if base key is available
    if (!existingKeys.includes(baseKey)) {
      return baseKey;
    }

    // Find next available number
    let counter = 2;
    while (existingKeys.includes(`${baseKey}_${counter}`)) {
      counter++;
    }

    return `${baseKey}_${counter}`;
  };

  const addField = (template: FieldTemplate) => {
    const isNonInput = NON_INPUT_TYPES.includes(template.type);
    const newField: CreateFormFieldRequest = {
      label: template.label,
      fieldKey: isNonInput ? `_layout_${Date.now()}` : generateFieldKey(template.label, fields),
      fieldType: template.type,
      placeholder: '',
      description: '',
      isRequired: false,
      orderIndex: fields.length,
      stepNumber: 1,
      width: 'full',
      allowMultipleFiles: false,
      options: ['SELECT', 'RADIO', 'MULTI_SELECT'].includes(template.type)
        ? ['Option 1', 'Option 2', 'Option 3']
        : undefined,
      config: template.type === 'TABLE' ? {
        columns: [
          { key: 'col_1', header: 'Column 1', type: 'text' },
          { key: 'col_2', header: 'Column 2', type: 'text' },
          { key: 'col_3', header: 'Column 3', type: 'text' }
        ],
        mode: 'dynamic', // 'dynamic' = user adds rows, 'fixed' = preset rows
        minRows: 1,
        maxRows: 10
      } : template.type === 'HTML_CONTENT' ? {
        html: ''
      } : undefined
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

  const [showAddFieldMenu, setShowAddFieldMenu] = useState(false);
  const [showBottomAddFieldMenu, setShowBottomAddFieldMenu] = useState(false);
  const topMenuRef = useRef<HTMLDivElement>(null);
  const bottomMenuRef = useRef<HTMLDivElement>(null);

  // Click outside to close add-field menus
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (topMenuRef.current && !topMenuRef.current.contains(e.target as Node)) {
        setShowAddFieldMenu(false);
      }
      if (bottomMenuRef.current && !bottomMenuRef.current.contains(e.target as Node)) {
        setShowBottomAddFieldMenu(false);
      }
    };
    if (showAddFieldMenu || showBottomAddFieldMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAddFieldMenu, showBottomAddFieldMenu]);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onCancel} className="hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Form Designer</h1>
            <p className="text-xs text-gray-500">
              {formData.name || 'Untitled Form'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {(['design', 'settings', 'preview'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === tab
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
            >
              <span className="flex items-center gap-2">
                {tab === 'design' && <Edit3 className="w-3.5 h-3.5" />}
                {tab === 'settings' && <Settings className="w-3.5 h-3.5" />}
                {tab === 'preview' && <Eye className="w-3.5 h-3.5" />}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </span>
            </button>
          ))}
          <div className="w-px h-6 bg-gray-200 mx-2" />
          <Button onClick={handleSave} disabled={saving || !formData.name || !formData.slug || !formData.saveToFolderId} className="bg-blue-600 hover:bg-blue-700 shadow-sm">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Form'}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'design' && (
          <div className="h-full overflow-y-auto">
            <div className="max-w-4xl mx-auto px-6 py-8">
              {/* Form Name & Description Card */}
              <Card className="mb-8 shadow-sm border-gray-200">
                <CardHeader className="pb-4">
                  <Input
                    placeholder="Form Name"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="text-2xl font-bold border-none p-0 h-auto focus-visible:ring-0 placeholder:text-gray-300"
                  />
                  <Textarea
                    placeholder="Add a description to help users understand this form..."
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-2 border-none p-0 resize-none focus-visible:ring-0 text-gray-600 placeholder:text-gray-300"
                    rows={2}
                  />
                </CardHeader>
              </Card>

              {/* Add Field Button (top) */}
              <div className="relative mb-6" ref={topMenuRef}>
                <button
                  onClick={() => setShowAddFieldMenu(!showAddFieldMenu)}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all flex items-center justify-center gap-2 group"
                >
                  <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="font-medium">Add Field</span>
                </button>
                {showAddFieldMenu && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-200 shadow-xl z-50 p-3 max-h-[400px] overflow-y-auto">
                    <div className="grid grid-cols-3 gap-2">
                      {FIELD_TEMPLATES.map((template) => (
                        <button
                          key={template.type}
                          onClick={() => { addField(template); setShowAddFieldMenu(false); }}
                          className="text-left p-3 rounded-lg border border-gray-100 hover:border-blue-400 hover:bg-blue-50 transition-all group"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 rounded-md bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                              {template.icon}
                            </div>
                            <div>
                              <span className="font-medium text-sm text-gray-900">{template.label}</span>
                              <p className="text-xs text-gray-400">{template.description}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Fields List */}
              {fields.length === 0 ? (
                <Card className="border-gray-200 shadow-sm">
                  <CardContent className="py-16 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                      <Plus className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No fields yet</h3>
                    <p className="text-gray-500 max-w-sm mx-auto">
                      Click "Add Field" above to start building your form
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div key={index}>
                      <Card
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        className={`cursor-move transition-all border-gray-200 shadow-sm hover:shadow-md ${selectedField === index
                          ? 'ring-2 ring-blue-500 border-blue-200 shadow-md'
                          : 'hover:border-gray-300'
                          }`}
                        onClick={() => {
                          if (selectedField === index) {
                            setSelectedField(null);
                            setShowFieldConfig(false);
                          } else {
                            setSelectedField(index);
                            setShowFieldConfig(true);
                          }
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="mt-1 p-1 rounded hover:bg-gray-100 cursor-grab active:cursor-grabbing">
                              <GripVertical className="w-4 h-4 text-gray-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-gray-900">{field.label}</span>
                                {field.isRequired && (
                                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Required</Badge>
                                )}
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-gray-500">{field.fieldType}</Badge>
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
                              ) : field.fieldType === 'CHECKBOX' ? (
                                <div className="mt-2 flex items-center gap-2">
                                  <input type="checkbox" disabled className="rounded" />
                                  <span className="text-sm text-gray-600">{field.label}</span>
                                </div>
                              ) : ['RADIO'].includes(field.fieldType) && field.options && field.options.length > 0 ? (
                                <div className="mt-2 space-y-1.5">
                                  {field.options.map((opt: string, optIdx: number) => (
                                    <div key={optIdx} className="flex items-center gap-2">
                                      <input type={field.fieldType === 'RADIO' ? 'radio' : 'checkbox'} disabled className="rounded" />
                                      <span className="text-sm text-gray-600">{opt || `Option ${optIdx + 1}`}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <Input placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`} disabled className="mt-2 bg-gray-50" />
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => { e.stopPropagation(); removeField(index); }}
                              className="flex-shrink-0 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Inline Field Configuration */}
                      {showFieldConfig && selectedField === index && (
                        <div className="mt-1 bg-white border border-blue-200 rounded-xl p-5 shadow-sm animate-in slide-in-from-top-2 duration-200">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                              <Settings className="w-4 h-4 text-blue-600" />
                              Field Settings
                            </h4>
                            <Button variant="ghost" size="icon" onClick={() => { setShowFieldConfig(false); setSelectedField(null); }} className="rounded-full h-7 w-7">
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                          {(() => {
                            const isNonInput = NON_INPUT_TYPES.includes(fields[selectedField].fieldType);
                            return (
                              <div className="space-y-4">
                                {/* Label — always shown */}
                                <div>
                                  <Label className="text-xs font-medium text-gray-600">Label</Label>
                                  <Input
                                    value={fields[selectedField].label}
                                    onChange={(e) => {
                                      const newLabel = e.target.value;
                                      if (!isNonInput) {
                                        const newKey = generateFieldKey(newLabel, fields, selectedField);
                                        updateField(selectedField, { label: newLabel, fieldKey: newKey });
                                      } else {
                                        updateField(selectedField, { label: newLabel });
                                      }
                                    }}
                                    className="mt-1"
                                  />
                                </div>

                                {/* Description — shown for Label/Divider/HTML too */}
                                <div>
                                  <Label className="text-xs font-medium text-gray-600">Description</Label>
                                  <Input
                                    value={fields[selectedField].description || ''}
                                    onChange={(e) => updateField(selectedField, { description: e.target.value })}
                                    placeholder="Optional description..."
                                    className="mt-1"
                                  />
                                </div>

                                {/* Field Key + Required + Placeholder — only for input fields */}
                                {!isNonInput && (
                                  <>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <div className="flex items-center justify-between">
                                          <Label className="text-xs font-medium text-gray-600">Field Key</Label>
                                          {fields[selectedField].fieldKey.startsWith('field_') && (
                                            <Button variant="ghost" size="sm" className="text-xs h-5 px-1.5 text-blue-600"
                                              onClick={() => { const newKey = generateFieldKey(fields[selectedField].label, fields, selectedField); updateField(selectedField, { fieldKey: newKey }); }}>
                                              Regenerate
                                            </Button>
                                          )}
                                        </div>
                                        <code className="mt-1 block px-3 py-2 bg-gray-50 rounded-md text-sm font-mono text-gray-700 border">
                                          {`{$${fields[selectedField].fieldKey}}`}
                                        </code>
                                        <p className="text-[10px] text-gray-400 mt-0.5">Use this in your Word template</p>
                                      </div>
                                      {['TEXT', 'EMAIL', 'NUMBER', 'PHONE', 'URL', 'TEXTAREA'].includes(fields[selectedField].fieldType) && (
                                        <div>
                                          <Label className="text-xs font-medium text-gray-600">Placeholder</Label>
                                          <Input value={fields[selectedField].placeholder || ''} onChange={(e) => updateField(selectedField, { placeholder: e.target.value })} placeholder="Enter placeholder text..." className="mt-1" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                                      <Label className="text-sm">Required Field</Label>
                                      <Switch checked={fields[selectedField].isRequired} onCheckedChange={(checked) => updateField(selectedField, { isRequired: checked })} />
                                    </div>
                                  </>
                                )}

                                {/* NUMBER min/max/step */}
                                {fields[selectedField].fieldType === 'NUMBER' && (
                                  <div className="grid grid-cols-3 gap-3 pt-2 border-t">
                                    <div>
                                      <Label className="text-xs font-medium text-gray-600">Min</Label>
                                      <Input type="number" value={fields[selectedField].minValue ?? ''} onChange={(e) => updateField(selectedField, { minValue: e.target.value ? parseFloat(e.target.value) : undefined })} placeholder="No min" className="mt-1" />
                                    </div>
                                    <div>
                                      <Label className="text-xs font-medium text-gray-600">Max</Label>
                                      <Input type="number" value={fields[selectedField].maxValue ?? ''} onChange={(e) => updateField(selectedField, { maxValue: e.target.value ? parseFloat(e.target.value) : undefined })} placeholder="No max" className="mt-1" />
                                    </div>
                                    <div>
                                      <Label className="text-xs font-medium text-gray-600">Step</Label>
                                      <Input type="number" value={(fields[selectedField].config as any)?.step ?? ''} onChange={(e) => updateField(selectedField, { config: { ...fields[selectedField].config, step: e.target.value ? parseFloat(e.target.value) : undefined } })} placeholder="1" className="mt-1" />
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                          {/* Options for RADIO, SELECT, MULTI_SELECT */}
                          {['RADIO', 'SELECT', 'MULTI_SELECT'].includes(fields[selectedField].fieldType) && (
                            <div className="mt-4 pt-4 border-t">
                              <div className="flex items-center justify-between mb-2">
                                <Label className="text-xs font-medium text-gray-600">Options</Label>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-[10px] px-2 text-blue-600"
                                    onClick={() => {
                                      const json = JSON.stringify(fields[selectedField].options || [], null, 2);
                                      navigator.clipboard.writeText(json);
                                    }}
                                  >
                                    Copy JSON
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-[10px] px-2 text-blue-600"
                                    onClick={() => {
                                      const input = prompt(
                                        'Paste a JSON array of options.\n\nExamples:\n["Option A", "Option B", "Option C"]\n\nOr with values:\n[{"label": "Option A", "value": "a"}, {"label": "Option B", "value": "b"}]'
                                      );
                                      if (input) {
                                        try {
                                          const parsed = JSON.parse(input);
                                          if (Array.isArray(parsed)) {
                                            // Normalize: accept strings or {label, value} objects
                                            const normalized = parsed.map((item: any) =>
                                              typeof item === 'string' ? item : (item.label || item.value || String(item))
                                            );
                                            updateField(selectedField, { options: normalized });
                                          } else {
                                            alert('Please provide a valid JSON array.');
                                          }
                                        } catch {
                                          alert('Invalid JSON format. Please provide a valid JSON array.');
                                        }
                                      }
                                    }}
                                  >
                                    Import JSON
                                  </Button>
                                </div>
                              </div>
                              <div className="space-y-2">
                                {(fields[selectedField].options || []).map((option: string, optIdx: number) => (
                                  <div key={optIdx} className="flex items-center gap-2">
                                    <Input value={option} onChange={(e) => { const newOptions = [...((fields[selectedField].options || []) as string[])]; newOptions[optIdx] = e.target.value; updateField(selectedField, { options: newOptions }); }} placeholder={`Option ${optIdx + 1}`} className="flex-1" />
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-red-50" onClick={() => { const newOptions = (fields[selectedField].options || []).filter((_: string, i: number) => i !== optIdx); updateField(selectedField, { options: newOptions }); }}>
                                      <X className="w-3.5 h-3.5 text-red-500" />
                                    </Button>
                                  </div>
                                ))}
                                <Button variant="outline" size="sm" onClick={() => { const newOptions = [...((fields[selectedField].options || []) as string[]), '']; updateField(selectedField, { options: newOptions }); }} className="w-full">
                                  <Plus className="w-4 h-4 mr-2" /> Add Option
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* File Upload Settings */}
                          {['FILE_UPLOAD', 'IMAGE_UPLOAD'].includes(fields[selectedField].fieldType) && (
                            <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-xs font-medium text-gray-600">Allowed File Types</Label>
                                <Input value={fields[selectedField].allowedFileTypes || ''} onChange={(e) => updateField(selectedField, { allowedFileTypes: e.target.value })} placeholder="e.g., pdf,doc,docx" className="mt-1" />
                                <p className="text-[10px] text-gray-400 mt-0.5">Comma-separated extensions</p>
                              </div>
                              <div>
                                <Label className="text-xs font-medium text-gray-600">Max File Size (MB)</Label>
                                <Input type="number" value={fields[selectedField].maxFileSizeMb || 10} onChange={(e) => updateField(selectedField, { maxFileSizeMb: parseInt(e.target.value) || 10 })} className="mt-1" />
                              </div>
                            </div>
                          )}

                          {/* Rating Settings */}
                          {fields[selectedField].fieldType === 'RATING' && (
                            <div className="mt-4 pt-4 border-t">
                              <Label className="text-xs font-medium text-gray-600">Max Stars</Label>
                              <Input type="number" value={(fields[selectedField].config as any)?.maxRating || 5} onChange={(e) => updateField(selectedField, { config: { ...fields[selectedField].config, maxRating: parseInt(e.target.value) || 5 } })} min={3} max={10} className="mt-1 w-32" />
                            </div>
                          )}

                          {/* Slider Settings */}
                          {fields[selectedField].fieldType === 'SLIDER' && (
                            <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4">
                              <div>
                                <Label className="text-xs font-medium text-gray-600">Min Value</Label>
                                <Input type="number" value={fields[selectedField].minValue ?? 0} onChange={(e) => updateField(selectedField, { minValue: parseFloat(e.target.value) || 0 })} className="mt-1" />
                              </div>
                              <div>
                                <Label className="text-xs font-medium text-gray-600">Max Value</Label>
                                <Input type="number" value={fields[selectedField].maxValue ?? 100} onChange={(e) => updateField(selectedField, { maxValue: parseFloat(e.target.value) || 100 })} className="mt-1" />
                              </div>
                              <div>
                                <Label className="text-xs font-medium text-gray-600">Step</Label>
                                <Input type="number" value={(fields[selectedField].config as any)?.step || 1} onChange={(e) => updateField(selectedField, { config: { ...fields[selectedField].config, step: parseFloat(e.target.value) || 1 } })} className="mt-1" />
                              </div>
                            </div>
                          )}

                          {/* HTML Content Editor (supports Tailwind) */}
                          {fields[selectedField].fieldType === 'HTML_CONTENT' && (
                            <div className="mt-4 pt-4 border-t space-y-2">
                              <div className="flex items-center justify-between">
                                <Label className="text-xs font-medium text-gray-600">HTML Content (Tailwind CSS supported)</Label>
                              </div>
                              <Textarea
                                value={(fields[selectedField].config as any)?.html || ''}
                                onChange={(e) => updateField(selectedField, { config: { ...fields[selectedField].config, html: e.target.value } })}
                                placeholder='<div class="flex flex-col items-center p-4">
  <h2 class="text-xl font-bold">Title</h2>
  <p class="text-gray-600">Content with Tailwind classes</p>
</div>'
                                rows={8}
                                className="mt-1 font-mono text-xs leading-relaxed"
                              />
                              <p className="text-[10px] text-blue-500">💡 You can use Tailwind CSS classes (flex, grid, p-4, text-xl, etc.)</p>
                            </div>
                          )}

                          {/* Table Configuration */}
                          {fields[selectedField].fieldType === 'TABLE' && (() => {
                            const cfg = fields[selectedField].config as any || {};
                            const columns: Array<{ key: string; header: string; type: string; options?: string[] }> = cfg.columns || [];
                            const tableMode = cfg.mode || 'dynamic';
                            const fixedRows: Array<{ cells: Record<string, { type: 'preset' | 'editable'; value?: string }> }> = cfg.fixedRows || [];

                            const updateConfig = (patch: any) => updateField(selectedField, { config: { ...cfg, ...patch } });
                            const updateColumns = (newCols: typeof columns) => updateConfig({ columns: newCols });

                            return (
                              <div className="mt-4 pt-4 border-t space-y-4">
                                {/* Table Mode */}
                                <div>
                                  <Label className="text-xs font-medium text-gray-600 mb-2 block">Table Mode</Label>
                                  <div className="grid grid-cols-2 gap-2">
                                    <button type="button" onClick={() => updateConfig({ mode: 'dynamic' })}
                                      className={`p-2.5 rounded-lg border text-center text-xs font-medium transition-all ${tableMode === 'dynamic' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                                      <div className="font-semibold">Dynamic Rows</div>
                                      <div className="text-[10px] text-gray-400 mt-0.5">User can add/remove rows</div>
                                    </button>
                                    <button type="button" onClick={() => updateConfig({ mode: 'fixed' })}
                                      className={`p-2.5 rounded-lg border text-center text-xs font-medium transition-all ${tableMode === 'fixed' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                                      <div className="font-semibold">Fixed Grid</div>
                                      <div className="text-[10px] text-gray-400 mt-0.5">Preset cells & editable cells</div>
                                    </button>
                                  </div>
                                </div>

                                {/* Columns */}
                                <div>
                                  <Label className="text-xs font-medium text-gray-600 block mb-2">Columns</Label>
                                  <div className="space-y-3">
                                    {columns.map((col, colIdx) => (
                                      <div key={colIdx} className="space-y-1.5">
                                        <div className="flex items-center gap-2">
                                          <Input value={col.header} onChange={(e) => { const c = [...columns]; c[colIdx] = { ...c[colIdx], header: e.target.value }; updateColumns(c); }} placeholder={`Column ${colIdx + 1}`} className="flex-1" />
                                          <Select value={col.type || 'text'} onValueChange={(value) => { const c = [...columns]; c[colIdx] = { ...c[colIdx], type: value }; updateColumns(c); }}>
                                            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="text">Text</SelectItem>
                                              <SelectItem value="number">Number</SelectItem>
                                              <SelectItem value="date">Date</SelectItem>
                                              <SelectItem value="time">Time</SelectItem>
                                              <SelectItem value="datetime">Date & Time</SelectItem>
                                              <SelectItem value="select">Select</SelectItem>
                                            </SelectContent>
                                          </Select>
                                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => updateColumns(columns.filter((_, i) => i !== colIdx))}>
                                            <X className="w-3.5 h-3.5 text-red-500" />
                                          </Button>
                                        </div>
                                        {/* Select column options */}
                                        {col.type === 'select' && (
                                          <div className="ml-4 pl-3 border-l-2 border-blue-200 space-y-1">
                                            <span className="text-[10px] font-medium text-blue-600">Dropdown options</span>
                                            {(col.options || []).map((opt, optIdx) => (
                                              <div key={optIdx} className="flex items-center gap-1">
                                                <Input value={opt} onChange={(e) => {
                                                  const c = [...columns];
                                                  const opts = [...(c[colIdx].options || [])];
                                                  opts[optIdx] = e.target.value;
                                                  c[colIdx] = { ...c[colIdx], options: opts };
                                                  updateColumns(c);
                                                }} placeholder={`Option ${optIdx + 1}`} className="flex-1 h-7 text-xs" />
                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                                                  const c = [...columns];
                                                  c[colIdx] = { ...c[colIdx], options: (c[colIdx].options || []).filter((_, i) => i !== optIdx) };
                                                  updateColumns(c);
                                                }}><X className="w-3 h-3 text-red-400" /></Button>
                                              </div>
                                            ))}
                                            <Button variant="ghost" size="sm" className="h-6 text-[10px] text-blue-600 w-full" onClick={() => {
                                              const c = [...columns];
                                              c[colIdx] = { ...c[colIdx], options: [...(c[colIdx].options || []), ''] };
                                              updateColumns(c);
                                            }}><Plus className="w-3 h-3 mr-1" /> Add option</Button>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                    <Button variant="outline" size="sm" onClick={() => { updateColumns([...columns, { key: `col_${Date.now()}`, header: '', type: 'text' }]); }} className="w-full">
                                      <Plus className="w-4 h-4 mr-2" /> Add Column
                                    </Button>
                                  </div>
                                </div>

                                {/* Dynamic mode: min/max rows */}
                                {tableMode === 'dynamic' && (
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-xs font-medium text-gray-600">Min Rows</Label>
                                      <Input type="number" value={cfg.minRows || 1} onChange={(e) => updateConfig({ minRows: parseInt(e.target.value) || 1 })} min={1} className="mt-1" />
                                    </div>
                                    <div>
                                      <Label className="text-xs font-medium text-gray-600">Max Rows</Label>
                                      <Input type="number" value={cfg.maxRows || 10} onChange={(e) => updateConfig({ maxRows: parseInt(e.target.value) || 10 })} min={1} className="mt-1" />
                                    </div>
                                  </div>
                                )}

                                {/* Fixed mode: grid cell editor */}
                                {tableMode === 'fixed' && columns.length > 0 && (
                                  <div>
                                    <div className="flex items-center justify-between mb-2">
                                      <Label className="text-xs font-medium text-gray-600">Grid Configuration</Label>
                                      <Button variant="outline" size="sm" className="h-6 text-[10px]" onClick={() => {
                                        const newRow: { cells: Record<string, { type: 'editable'; value?: string }> } = { cells: {} };
                                        columns.forEach(c => { newRow.cells[c.key] = { type: 'editable' }; });
                                        updateConfig({ fixedRows: [...fixedRows, newRow] });
                                      }}>
                                        <Plus className="w-3 h-3 mr-1" /> Add Row
                                      </Button>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mb-2">
                                      Click <span className="inline-block w-3 h-3 rounded bg-green-100 border border-green-300 align-middle mx-0.5" /> to toggle editable ↔ preset. Preset cells show fixed text to the user.
                                    </p>
                                    {fixedRows.length > 0 ? (
                                      <div className="border rounded-lg overflow-hidden">
                                        <table className="w-full text-xs">
                                          <thead>
                                            <tr className="bg-gray-100 border-b">
                                              <th className="p-1.5 text-left text-gray-500 font-medium w-8">#</th>
                                              {columns.map(col => (
                                                <th key={col.key} className="p-1.5 text-left text-gray-500 font-medium">{col.header || col.key}</th>
                                              ))}
                                              <th className="w-8 p-1" />
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {fixedRows.map((row, rowIdx) => (
                                              <tr key={rowIdx} className="border-b last:border-b-0">
                                                <td className="p-1.5 text-gray-400 font-mono">{rowIdx + 1}</td>
                                                {columns.map(col => {
                                                  const cell = (row.cells || {})[col.key] || { type: 'editable' };
                                                  const isPreset = cell.type === 'preset';
                                                  return (
                                                    <td key={col.key} className="p-0.5">
                                                      <div className={`flex items-center gap-1 rounded p-1 ${isPreset ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200'}`}>
                                                        <button type="button" title={isPreset ? 'Preset (click to make editable)' : 'Editable (click to make preset)'}
                                                          className={`shrink-0 w-5 h-5 rounded text-[8px] font-bold flex items-center justify-center ${isPreset ? 'bg-amber-200 text-amber-700' : 'bg-green-200 text-green-700'}`}
                                                          onClick={() => {
                                                            const newRows = [...fixedRows];
                                                            const newCells = { ...(newRows[rowIdx].cells || {}) };
                                                            newCells[col.key] = isPreset ? { type: 'editable' } : { type: 'preset', value: '' };
                                                            newRows[rowIdx] = { ...newRows[rowIdx], cells: newCells };
                                                            updateConfig({ fixedRows: newRows });
                                                          }}
                                                        >
                                                          {isPreset ? 'P' : 'E'}
                                                        </button>
                                                        {isPreset ? (
                                                          <Input
                                                            value={cell.value || ''}
                                                            onChange={(e) => {
                                                              const newRows = [...fixedRows];
                                                              const newCells = { ...(newRows[rowIdx].cells || {}) };
                                                              newCells[col.key] = { type: 'preset', value: e.target.value };
                                                              newRows[rowIdx] = { ...newRows[rowIdx], cells: newCells };
                                                              updateConfig({ fixedRows: newRows });
                                                            }}
                                                            placeholder="Fixed text..."
                                                            className="h-6 text-[10px] flex-1 border-0 bg-transparent p-0 px-1 focus-visible:ring-0"
                                                          />
                                                        ) : (
                                                          <span className="text-[10px] text-green-600 italic px-1" title={`{$${fields[selectedField].fieldKey}.row_${rowIdx}.${col.key}}`}>
                                                            user input
                                                            <code className="not-italic ml-1 text-[8px] text-gray-400 font-mono">{`{$${fields[selectedField].fieldKey}.${col.key}}`}</code>
                                                          </span>
                                                        )}
                                                      </div>
                                                    </td>
                                                  );
                                                })}
                                                <td className="p-0.5">
                                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                                                    updateConfig({ fixedRows: fixedRows.filter((_, i) => i !== rowIdx) });
                                                  }}><X className="w-3 h-3 text-red-400" /></Button>
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    ) : (
                                      <div className="text-center py-4 border-2 border-dashed rounded-lg text-gray-400 text-xs">
                                        No rows yet. Click "Add Row" to configure the grid.
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Bottom Add Field — own independent menu */}
                  <div className="relative mt-4" ref={bottomMenuRef}>
                    <button
                      onClick={() => setShowBottomAddFieldMenu(!showBottomAddFieldMenu)}
                      className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="text-sm font-medium">Add Another Field</span>
                    </button>
                    {showBottomAddFieldMenu && (
                      <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl border border-gray-200 shadow-xl z-50 p-3 max-h-[400px] overflow-y-auto">
                        <div className="grid grid-cols-3 gap-2">
                          {FIELD_TEMPLATES.map((template) => (
                            <button
                              key={template.type}
                              onClick={() => { addField(template); setShowBottomAddFieldMenu(false); }}
                              className="text-left p-3 rounded-lg border border-gray-100 hover:border-blue-400 hover:bg-blue-50 transition-all group"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="p-1.5 rounded-md bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                  {template.icon}
                                </div>
                                <div>
                                  <span className="font-medium text-sm text-gray-900">{template.label}</span>
                                  <p className="text-xs text-gray-400">{template.description}</p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="h-full overflow-y-auto">
            <div className="max-w-6xl mx-auto px-6 py-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Settings */}
                <Card className="shadow-sm border-gray-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2"><FileText className="w-4 h-4 text-blue-600" />Basic Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-xs font-medium text-gray-600">Form Name</Label>
                      <Input value={formData.name} onChange={(e) => handleNameChange(e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-600">URL Slug</Label>
                      <Input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} className="mt-1" />
                      <p className="text-[10px] text-gray-400 mt-1">Public URL: /forms/{formData.slug || 'your-form'}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-600">Category</Label>
                      <Input value={formData.category || ''} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="e.g., Contact, Survey" className="mt-1" />
                    </div>
                  </CardContent>
                </Card>

                {/* Access & Permissions */}
                <Card className="shadow-sm border-gray-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2"><Settings className="w-4 h-4 text-blue-600" />Access & Permissions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between py-2">
                      <div><Label className="text-sm">Public Form</Label><p className="text-xs text-gray-500">Anyone with the link can access</p></div>
                      <Switch checked={formData.isPublic} onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })} />
                    </div>
                    <div className="flex items-center justify-between py-2 border-t">
                      <div><Label className="text-sm">Require Authentication</Label><p className="text-xs text-gray-500">Users must be logged in</p></div>
                      <Switch checked={formData.requireAuthentication} onCheckedChange={(checked) => setFormData({ ...formData, requireAuthentication: checked })} />
                    </div>
                    {!formData.requireAuthentication && (
                      <div className="py-2 border-t">
                        <div className="mb-1.5"><Label className="text-sm">Default File Creator</Label><p className="text-xs text-gray-500">User assigned as creator/owner of uploaded attachments</p></div>
                        {(() => {
                          const selectedUser = formData.defaultCreatorUserId
                            ? availableUsers.find(u => u.id === formData.defaultCreatorUserId)
                            : null;
                          return (
                            <div className="space-y-2">
                              {selectedUser ? (
                                <div className="flex items-center gap-2 p-2 border rounded-lg bg-gray-50">
                                  <UserAvatar user={selectedUser} size="sm" />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-gray-900 truncate">{selectedUser.displayName || selectedUser.username}</div>
                                    <div className="text-xs text-gray-500 truncate">{selectedUser.email}</div>
                                  </div>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setFormData({ ...formData, defaultCreatorUserId: undefined })}>
                                    <X className="w-3.5 h-3.5 text-gray-400" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="relative" ref={userDropdownRef}>
                                  <Input
                                    placeholder="Search users by name or email..."
                                    value={userSearchQuery}
                                    onChange={(e) => {
                                      setUserSearchQuery(e.target.value);
                                      setShowUserDropdown(true);
                                    }}
                                    onFocus={() => { if (userSearchQuery || availableUsers.length > 0) setShowUserDropdown(true); }}
                                    className="text-sm"
                                  />
                                  {showUserDropdown && (
                                    <div className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                      {loadingUsers ? (
                                        <div className="px-3 py-2 text-xs text-gray-400">Loading...</div>
                                      ) : filteredUsers.length > 0 ? (
                                        filteredUsers.map((user) => (
                                          <button
                                            key={user.id}
                                            type="button"
                                            className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-blue-50 transition-colors"
                                            onClick={() => {
                                              setFormData({ ...formData, defaultCreatorUserId: user.id });
                                              setUserSearchQuery('');
                                              setShowUserDropdown(false);
                                            }}
                                          >
                                            <UserAvatar user={user} size="xs" />
                                            <div className="flex-1 min-w-0">
                                              <div className="text-sm font-medium text-gray-900 truncate">{user.displayName || user.username}</div>
                                              <div className="text-[10px] text-gray-500 truncate">{user.email}</div>
                                            </div>
                                          </button>
                                        ))
                                      ) : (
                                        <div className="px-3 py-2 text-xs text-gray-400">No users found</div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                              {!selectedUser && !formData.defaultCreatorUserId && (
                                <p className="text-[10px] text-gray-400">No user selected — form creator will be used as default</p>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                    <div className="flex items-center justify-between py-2 border-t">
                      <div><Label className="text-sm">Allow Multiple Submissions</Label><p className="text-xs text-gray-500">Users can submit multiple times</p></div>
                      <Switch checked={formData.allowMultipleSubmissions} onCheckedChange={(checked) => setFormData({ ...formData, allowMultipleSubmissions: checked })} />
                    </div>
                    <div className="flex items-center justify-between py-2 border-t">
                      <div><Label className="text-sm text-green-700">Auto-Approve Submissions</Label><p className="text-xs text-gray-500">Automatically approve all submissions</p></div>
                      <Switch checked={formData.autoApprove} onCheckedChange={(checked) => setFormData({ ...formData, autoApprove: checked })} />
                    </div>
                    {formData.createDocumentOnSubmit && (
                      <div className="flex items-center justify-between py-2 border-t">
                        <div><Label className="text-sm">Generate Document on Approval Only</Label><p className="text-xs text-gray-500">Documents created only when approved</p></div>
                        <Switch checked={formData.generateDocumentOnApprovalOnly} onCheckedChange={(checked) => setFormData({ ...formData, generateDocumentOnApprovalOnly: checked })} />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Notifications */}
                <Card className="shadow-sm border-gray-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2"><Mail className="w-4 h-4 text-blue-600" />Notifications</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between py-2">
                      <div><Label className="text-sm">Email Notifications</Label><p className="text-xs text-gray-500">Notify admin on new submission</p></div>
                      <Switch checked={formData.sendEmailNotification} onCheckedChange={(checked) => setFormData({ ...formData, sendEmailNotification: checked })} />
                    </div>
                    {formData.sendEmailNotification && (
                      <div>
                        <Label className="text-xs font-medium text-gray-600">Notification Email</Label>
                        <Input type="email" value={formData.notificationEmail || ''} onChange={(e) => setFormData({ ...formData, notificationEmail: e.target.value })} className="mt-1" />
                      </div>
                    )}
                    <div className="flex items-center justify-between py-2 border-t">
                      <div><Label className="text-sm">Confirmation Emails</Label><p className="text-xs text-gray-500">Send confirmation to submitter</p></div>
                      <Switch checked={formData.sendConfirmationEmail} onCheckedChange={(checked) => setFormData({ ...formData, sendConfirmationEmail: checked })} />
                    </div>
                  </CardContent>
                </Card>

                {/* Submission Limits & Styling */}
                <Card className="shadow-sm border-gray-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2"><Star className="w-4 h-4 text-blue-600" />Limits & Styling</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-xs font-medium text-gray-600">Maximum Submissions</Label>
                      <Input type="number" value={formData.maxSubmissions || ''} onChange={(e) => setFormData({ ...formData, maxSubmissions: parseInt(e.target.value) || undefined })} placeholder="Unlimited" className="mt-1" />
                    </div>
                    <div className="flex items-center justify-between py-2 border-t">
                      <div><Label className="text-sm">Close After Max</Label><p className="text-xs text-gray-500">Auto-close when limit reached</p></div>
                      <Switch checked={formData.closeAfterMaxSubmissions} onCheckedChange={(checked) => setFormData({ ...formData, closeAfterMaxSubmissions: checked })} />
                    </div>
                    <div className="border-t pt-4">
                      <Label className="text-xs font-medium text-gray-600">Theme Color</Label>
                      <Input type="color" value={formData.themeColor || '#3B82F6'} onChange={(e) => setFormData({ ...formData, themeColor: e.target.value })} className="mt-1 h-10" />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-600">Success Message</Label>
                      <Textarea value={formData.successMessage || ''} onChange={(e) => setFormData({ ...formData, successMessage: e.target.value })} placeholder="Thank you for your submission!" rows={2} className="mt-1" />
                    </div>
                  </CardContent>
                </Card>

                {/* Document Generation - Full Width */}
                <Card className="shadow-sm border-gray-200 lg:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      Document Generation
                    </CardTitle>
                    <CardDescription>Generate Word documents from form submissions using templates</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between py-2">
                      <div><Label className="text-sm">Create Document on Submit</Label><p className="text-xs text-gray-500">Generate a document for each submission</p></div>
                      <Switch checked={formData.createDocumentOnSubmit} onCheckedChange={(checked) => setFormData({ ...formData, createDocumentOnSubmit: checked })} />
                    </div>

                    {formData.createDocumentOnSubmit && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t">
                        {/* Left column: Folder, Template, PDF */}
                        <div className="space-y-4">
                          {/* Folder Selector */}
                          <div>
                            <Label className="text-xs font-medium text-gray-600 flex items-center gap-1.5"><Folder className="w-3.5 h-3.5" />Target Folder</Label>
                            {selectedFolder ? (
                              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg mt-1">
                                <Folder className="w-4 h-4 text-blue-600" />
                                <span className="flex-1 text-sm font-medium">{selectedFolder.name}</span>
                                <Button variant="ghost" size="sm" onClick={() => setShowFolderPicker(true)}><Edit3 className="w-3.5 h-3.5" /></Button>
                                <Button variant="ghost" size="sm" onClick={() => { setSelectedFolder(null); setFormData({ ...formData, saveToFolderId: undefined }); }}><X className="w-3.5 h-3.5" /></Button>
                              </div>
                            ) : (
                              <Button variant="outline" className="w-full justify-start mt-1" onClick={() => setShowFolderPicker(true)}>
                                <Folder className="w-4 h-4 mr-2" /> Select target folder...
                              </Button>
                            )}
                            <p className="text-[10px] text-gray-400 mt-1">Documents will be saved to this folder</p>
                          </div>

                          {/* Template Upload */}
                          <div>
                            <Label className="text-xs font-medium text-gray-600 flex items-center gap-1.5"><File className="w-3.5 h-3.5" />Word Template (Optional)</Label>
                            {formData.templateMinioKey && formData.templateFilename ? (
                              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg mt-1">
                                <FileText className="w-4 h-4 text-green-600" />
                                <span className="flex-1 text-sm font-medium">{formData.templateFilename}</span>
                                <Button variant="ghost" size="sm" onClick={() => { setFormData({ ...formData, templateMinioKey: undefined, templateFilename: undefined }); setTemplateFile(null); }}><X className="w-3.5 h-3.5" /></Button>
                              </div>
                            ) : formData.templateFilename && !formData.templateMinioKey ? (
                              <div className="mt-1">
                                <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
                                  <FileText className="w-4 h-4 text-yellow-600" />
                                  <span className="flex-1 text-sm font-medium text-yellow-800">{formData.templateFilename} (not uploaded)</span>
                                  <Button variant="ghost" size="sm" onClick={() => { setFormData({ ...formData, templateFilename: undefined }); setTemplateFile(null); }}><X className="w-3.5 h-3.5" /></Button>
                                </div>
                                <p className="text-[10px] text-yellow-700 mt-1">Please re-upload the template file</p>
                              </div>
                            ) : (
                              <div className="border-2 border-dashed rounded-lg p-4 text-center mt-1">
                                <input type="file" accept=".docx" className="hidden" id="template-upload"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file && formId) {
                                      setUploadingTemplate(true);
                                      try {
                                        const result = await formService.uploadTemplate(formId, file);
                                        setFormData({ ...formData, templateMinioKey: result.templateMinioKey, templateFilename: result.filename });
                                        setTemplateFile(file);
                                      } catch (error) { console.error('Failed to upload template:', error); alert('Failed to upload template.'); }
                                      finally { setUploadingTemplate(false); }
                                    } else if (file) {
                                      setTemplateFile(file);
                                      setFormData({ ...formData, templateFilename: file.name });
                                    }
                                  }}
                                  disabled={uploadingTemplate}
                                />
                                {uploadingTemplate ? (
                                  <div className="flex flex-col items-center py-2">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-2"></div>
                                    <p className="text-sm text-gray-600">Uploading...</p>
                                  </div>
                                ) : (
                                  <label htmlFor="template-upload" className="cursor-pointer">
                                    <Upload className="w-6 h-6 mx-auto text-gray-400 mb-1" />
                                    <p className="text-sm text-gray-600">Click to upload Word template</p>
                                    <p className="text-[10px] text-gray-400 mt-0.5">.docx files only</p>
                                  </label>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Output as PDF */}
                          <div className="flex items-center gap-2">
                            <input type="checkbox" id="outputAsPdf" checked={formData.outputAsPdf || false} onChange={(e) => setFormData({ ...formData, outputAsPdf: e.target.checked })} className="w-4 h-4 text-blue-600 rounded border-gray-300" />
                            <label htmlFor="outputAsPdf" className="text-sm font-medium text-gray-700">Output as PDF</label>
                            <span className="text-[10px] text-gray-500">(converts to PDF format)</span>
                          </div>
                        </div>

                        {/* Right column: Document Model & Mapping */}
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-xs font-semibold text-gray-900 mb-1">Document Model</h4>
                            <p className="text-[10px] text-gray-500 mb-3">Link to a document model to auto-populate metadata.</p>

                            {selectedCategory ? (
                              <div className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg bg-gray-50 mb-3">
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900 text-sm">{selectedCategory.name}</div>
                                  {selectedCategory.description && <div className="text-[10px] text-gray-500">{selectedCategory.description}</div>}
                                  <div className="text-[10px] text-gray-400 mt-0.5">{metadataDefinitions.length} metadata field{metadataDefinitions.length !== 1 ? 's' : ''}</div>
                                </div>
                                <button type="button" onClick={() => { setSelectedCategoryId(undefined); setSelectedCategory(null); setFormData({ ...formData, filingCategoryId: undefined }); setFieldMappings([]); }} className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors">
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="mb-3">
                                <SearchSelect
                                  items={filingCategories}
                                  fetchFunction={async (query: string) => { const response = await notificationApiClient.getAllFilingCategories({ size: 100, name: query }, { silent: true }); return response.content; }}
                                  onSelect={(cat: FilingCategoryResponseDto) => { setSelectedCategoryId(cat.id); setSelectedCategory(cat); setFormData({ ...formData, filingCategoryId: cat.id }); setFieldMappings([]); }}
                                  placeholder="Search document models..."
                                  displayField="name"
                                  descriptionField="description"
                                />
                              </div>
                            )}

                            {/* Field Mapping Table */}
                            {selectedCategoryId && metadataDefinitions.length > 0 && (
                              <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th className="text-left px-3 py-2 text-[10px] font-medium text-gray-600">Metadata Field</th>
                                      <th className="text-left px-3 py-2 text-[10px] font-medium text-gray-600">Type</th>
                                      <th className="text-left px-3 py-2 text-[10px] font-medium text-gray-600">Map To</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200">
                                    {metadataDefinitions.map((meta: any) => {
                                      const currentMapping = fieldMappings.find(m => m.metadataDefinitionId === meta.id);
                                      return (
                                        <tr key={meta.id} className={meta.mandatory ? 'bg-amber-50' : ''}>
                                          <td className="px-3 py-2"><span className="font-medium text-xs">{meta.key}</span>{meta.mandatory && <span className="ml-1 text-red-500">*</span>}</td>
                                          <td className="px-3 py-2 text-gray-500 text-xs">{meta.dataType}</td>
                                          <td className="px-3 py-2">
                                            <Select
                                              value={currentMapping?.isStatic ? `static:${currentMapping.staticFieldType}` : (currentMapping?.fieldKey || '_unmapped_')}
                                              onValueChange={(value) => {
                                                let newMappings = fieldMappings.filter(m => m.metadataDefinitionId !== meta.id);
                                                if (value && value !== '_unmapped_') {
                                                  if (value.startsWith('static:')) {
                                                    newMappings.push({ metadataDefinitionId: meta.id, metadataKey: meta.key, isStatic: true, staticFieldType: value.replace('static:', '') });
                                                  } else {
                                                    newMappings.push({ metadataDefinitionId: meta.id, metadataKey: meta.key, isStatic: false, fieldKey: value });
                                                  }
                                                }
                                                setFieldMappings(newMappings);
                                                setFormData({ ...formData, fieldMetadataMappings: newMappings });
                                              }}
                                            >
                                              <SelectTrigger className="h-8 text-xs">
                                                <SelectValue placeholder="-- Unmapped --" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="_unmapped_">-- Unmapped --</SelectItem>
                                                {(() => {
                                                  // Build mappable fields: expand fixed table columns, exclude dynamic tables
                                                  const mappableFields: Array<{ fieldKey: string; label: string; fieldType: string }> = [];
                                                  fields.forEach(f => {
                                                    if (NON_INPUT_TYPES.includes(f.fieldType)) return;
                                                    if (f.fieldType === 'TABLE') {
                                                      const cfg = f.config as any || {};
                                                      if (cfg.mode === 'dynamic' || !cfg.mode) return; // skip dynamic tables
                                                      const cols: Array<{ key: string; header: string; type?: string }> = cfg.columns || [];
                                                      const fixedRows = cfg.fixedRows || [];
                                                      fixedRows.forEach((row: any, ri: number) => {
                                                        cols.forEach(col => {
                                                          const cellCfg = (row.cells || {})[col.key];
                                                          if (cellCfg && cellCfg.type === 'preset') return; // skip preset cells
                                                          const colType = (col.type || 'text').toUpperCase();
                                                          const mappedType = colType === 'NUMBER' ? 'NUMBER' : colType === 'DATE' ? 'DATE' : 'TEXT';
                                                          mappableFields.push({
                                                            fieldKey: `${f.fieldKey}.row_${ri}.${col.key}`,
                                                            label: `${f.label} → Row ${ri + 1} · ${col.header || col.key}`,
                                                            fieldType: mappedType,
                                                          });
                                                        });
                                                      });
                                                      return;
                                                    }
                                                    mappableFields.push({ fieldKey: f.fieldKey, label: f.label, fieldType: f.fieldType });
                                                  });
                                                  const compatible = mappableFields.filter(f => isTypeCompatible(meta.dataType, f.fieldType));
                                                  return compatible.length > 0 ? (
                                                    <>
                                                      <SelectItem value="_label_fields_" disabled className="text-[10px] font-semibold text-gray-400 uppercase">Form Fields</SelectItem>
                                                      {compatible.map((f) => (
                                                        <SelectItem key={f.fieldKey} value={f.fieldKey}>{f.label} ({f.fieldType} → {getFieldDataType(f.fieldType)})</SelectItem>
                                                      ))}
                                                    </>
                                                  ) : null;
                                                })()}
                                                {(isStaticTypeCompatible(meta.dataType, 'form_id') || isStaticTypeCompatible(meta.dataType, 'creation_date') || isStaticTypeCompatible(meta.dataType, 'submission_id')) && (
                                                  <>
                                                    <SelectItem value="_label_static_" disabled className="text-[10px] font-semibold text-gray-400 uppercase">Static Fields</SelectItem>
                                                    {isStaticTypeCompatible(meta.dataType, 'form_id') && <SelectItem value="static:form_id">Form ID (NUMBER)</SelectItem>}
                                                    {isStaticTypeCompatible(meta.dataType, 'creation_date') && <SelectItem value="static:creation_date">Submission Date (DATETIME)</SelectItem>}
                                                    {isStaticTypeCompatible(meta.dataType, 'submission_id') && <SelectItem value="static:submission_id">Submission ID (NUMBER)</SelectItem>}
                                                  </>
                                                )}
                                              </SelectContent>
                                            </Select>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                                <div className="px-3 py-1.5 bg-gray-50 text-[10px] text-gray-500"><span className="text-red-500">*</span> Required fields must be mapped</div>
                              </div>
                            )}
                          </div>

                          {/* Template Placeholders */}
                          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-start gap-2">
                              <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-xs font-medium text-blue-800">Template Placeholders</p>
                                <p className="text-[10px] text-blue-700 mt-0.5">Your Word template <strong>must contain</strong> these placeholders:</p>
                                {fields.filter(f => !NON_TEMPLATE_TYPES.includes(f.fieldType)).length > 0 ? (
                                  <div className="mt-2 space-y-1">
                                    {fields.filter(f => !NON_TEMPLATE_TYPES.includes(f.fieldType)).map((field, idx) => {
                                      // TABLE fields: show column-level keys
                                      if (field.fieldType === 'TABLE') {
                                        const cfg = field.config as any || {};
                                        const cols: Array<{ key: string; header: string; type?: string }> = cfg.columns || [];
                                        const tableMode = cfg.mode || 'dynamic';
                                        const fixedRows = cfg.fixedRows || [];
                                        return (
                                          <div key={idx} className="space-y-0.5">
                                            <div className="text-[10px] font-medium text-gray-600 mt-1">{field.label} <span className="text-gray-400">({tableMode} table)</span></div>
                                            {tableMode === 'dynamic' ? (
                                              cols.map((col, ci) => (
                                                <div key={ci} className="flex items-center gap-2 text-[10px] pl-2">
                                                  <code className="px-1.5 py-0.5 bg-white border rounded font-mono text-blue-800">{'{$' + field.fieldKey + '.' + col.key + '}'}</code>
                                                  <span className="text-gray-500">← {col.header || col.key} <span className="text-gray-400">({col.type || 'text'})</span></span>
                                                </div>
                                              ))
                                            ) : (
                                              fixedRows.map((row: any, ri: number) => {
                                                const editableCols = cols.filter(col => {
                                                  const cellCfg = (row.cells || {})[col.key];
                                                  return !cellCfg || cellCfg.type === 'editable';
                                                });
                                                if (editableCols.length === 0) return null;
                                                return editableCols.map((col, ci) => (
                                                  <div key={`${ri}-${ci}`} className="flex items-center gap-2 text-[10px] pl-2">
                                                    <code className="px-1.5 py-0.5 bg-white border rounded font-mono text-blue-800">{'{$' + field.fieldKey + '.row_' + ri + '.' + col.key + '}'}</code>
                                                    <span className="text-gray-500">← Row {ri + 1} · {col.header || col.key} <span className="text-gray-400">({col.type || 'text'})</span></span>
                                                  </div>
                                                ));
                                              })
                                            )}
                                          </div>
                                        );
                                      }
                                      // Normal fields
                                      return (
                                        <div key={idx} className="flex items-center gap-2 text-[10px]">
                                          <code className="px-1.5 py-0.5 bg-white border rounded font-mono text-blue-800">{'{$' + field.fieldKey + '}'}</code>
                                          <span className="text-gray-500">← {field.label} <span className="text-gray-400">({getFieldDataType(field.fieldType)})</span></span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <p className="text-[10px] text-gray-500 mt-1 italic">Add input fields to your form first</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'preview' && (
          <div className="h-full overflow-y-auto bg-gray-100">
            <div className="max-w-2xl mx-auto px-6 py-8">
              <Card className="shadow-sm">
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
                          <SelectTrigger><SelectValue placeholder="Select an option" /></SelectTrigger>
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

