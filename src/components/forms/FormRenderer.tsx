'use client';

import React, { useState, useRef, useCallback } from 'react';
import { FormResponse, FormFieldResponse } from '@/types/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  AlertCircle,
  Loader2,
  Upload,
  X,
  FileText,
  CheckCircle,
  Star,
  Plus,
  Trash2,
  GripVertical,
  CloudUpload,
} from 'lucide-react';
import { formService } from '@/api/services/formService';

interface FormRendererProps {
  form: FormResponse;
  onSubmit: (data: Record<string, any>) => void;
  submitting?: boolean;
}

export default function FormRenderer({ form, onSubmit, submitting }: FormRendererProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, any>>({});
  const [dragOverField, setDragOverField] = useState<string | null>(null);

  const fields = [...form.fields].sort((a, b) => a.orderIndex - b.orderIndex);
  const maxStep = form.isMultiStep ? Math.max(...fields.map(f => f.stepNumber), 1) : 1;
  const currentFields = form.isMultiStep
    ? fields.filter(f => f.stepNumber === currentStep)
    : fields;

  const progress = form.isMultiStep
    ? (currentStep / maxStep) * 100
    : 0;

  // ─── Validation ───────────────────────────────────────────────────
  const validateField = (field: FormFieldResponse, value: any): string | null => {
    if (field.isRequired && (!value || (typeof value === 'string' && value.trim() === '') || (Array.isArray(value) && value.length === 0))) {
      return `${field.label} is required`;
    }

    if (value && typeof value === 'string') {
      if (field.minLength && value.length < field.minLength) {
        return `Must be at least ${field.minLength} characters`;
      }
      if (field.maxLength && value.length > field.maxLength) {
        return `Must not exceed ${field.maxLength} characters`;
      }
      if (field.fieldType === 'EMAIL' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'Please enter a valid email address';
      }
      if (field.fieldType === 'URL' && !/^https?:\/\/.+/.test(value)) {
        return 'Please enter a valid URL (starting with http:// or https://)';
      }
      if (field.fieldType === 'NUMBER') {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) return 'Please enter a valid number';
        if (field.minValue != null && numValue < field.minValue) return `Value must be at least ${field.minValue}`;
        if (field.maxValue != null && numValue > field.maxValue) return `Value must not exceed ${field.maxValue}`;
      }
      if (field.pattern) {
        const regex = new RegExp(field.pattern);
        if (!regex.test(value)) return field.validationMessage || 'Invalid format';
      }
    }
    return null;
  };

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;
    currentFields.forEach(field => {
      if (['SECTION_HEADER', 'DIVIDER', 'HTML_CONTENT'].includes(field.fieldType)) return;
      const error = validateField(field, formData[field.fieldKey]);
      if (error) { newErrors[field.fieldKey] = error; isValid = false; }
    });
    setErrors(newErrors);
    return isValid;
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep(prev => Math.min(maxStep, prev + 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.values(uploadingFiles).some(u => u)) {
      alert('Please wait for all files to finish uploading');
      return;
    }
    if (validateStep()) onSubmit(formData);
  };

  const handleFieldChange = (fieldKey: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldKey]: value }));
    if (errors[fieldKey]) {
      setErrors(prev => { const n = { ...prev }; delete n[fieldKey]; return n; });
    }
  };

  // ─── File Upload Handler ──────────────────────────────────────────
  const handleFileUpload = async (field: FormFieldResponse, file: File) => {
    const maxSize = (field.maxFileSizeMb || 10) * 1024 * 1024;
    if (file.size > maxSize) {
      setErrors(prev => ({ ...prev, [field.fieldKey]: `File size must not exceed ${field.maxFileSizeMb || 10}MB` }));
      return;
    }
    if (field.allowedFileTypes) {
      const allowed = field.allowedFileTypes.split(',').map(t => t.trim().toLowerCase());
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext && !allowed.includes(ext)) {
        setErrors(prev => ({ ...prev, [field.fieldKey]: `Only ${field.allowedFileTypes} files are allowed` }));
        return;
      }
    }
    setUploadingFiles(prev => ({ ...prev, [field.fieldKey]: true }));
    try {
      const response = await formService.uploadFormFile(file, field.fieldKey);
      setUploadedFiles(prev => ({ ...prev, [field.fieldKey]: { fileName: response.fileName, fileUrl: response.fileUrl, fileSize: response.fileSize, contentType: response.contentType } }));
      handleFieldChange(field.fieldKey, response.fileUrl);
      setErrors(prev => { const n = { ...prev }; delete n[field.fieldKey]; return n; });
    } catch (err: any) {
      setErrors(prev => ({ ...prev, [field.fieldKey]: err.message || 'Failed to upload file' }));
    } finally {
      setUploadingFiles(prev => ({ ...prev, [field.fieldKey]: false }));
    }
  };

  // ─── Field Width Classes ──────────────────────────────────────────
  const widthClass = (w: string) => {
    switch (w) {
      case 'half': return 'md:col-span-1';
      case 'third': return 'md:col-span-1';
      case 'quarter': return 'md:col-span-1';
      default: return 'md:col-span-2';
    }
  };

  // ─── Field Wrapper ────────────────────────────────────────────────
  const fieldWrapper = (field: FormFieldResponse, content: React.ReactNode, isLayout = false) => (
    <div key={field.id} className={`${widthClass(field.width)} ${isLayout ? '' : 'group'}`}>
      <div className={`space-y-1.5 ${isLayout ? '' : 'transition-all duration-200'}`}>
        {!isLayout && (
          <>
            <Label htmlFor={field.fieldKey} className="text-sm font-medium text-foreground">
              {field.label}
              {field.isRequired && <span className="text-red-500 ml-0.5">*</span>}
            </Label>
            {field.description && (
              <p className="text-xs text-muted-foreground leading-relaxed">{field.description}</p>
            )}
          </>
        )}
        {content}
        {errors[field.fieldKey] && (
          <p className="text-xs text-red-500 flex items-center gap-1 animate-in slide-in-from-top-1 duration-200">
            <AlertCircle className="w-3 h-3 flex-shrink-0" />
            {errors[field.fieldKey]}
          </p>
        )}
      </div>
    </div>
  );

  // ─── Render Individual Fields ─────────────────────────────────────
  const renderField = (field: FormFieldResponse) => {
    const value = formData[field.fieldKey];
    const error = errors[field.fieldKey];
    const inputCls = `transition-all duration-200 ${error ? 'border-red-400 focus:ring-red-200' : 'focus:ring-blue-100'}`;

    switch (field.fieldType) {
      // ── Text Inputs ──
      case 'TEXT':
      case 'PHONE':
      case 'URL':
        return fieldWrapper(field,
          <Input
            id={field.fieldKey}
            type={field.fieldType === 'PHONE' ? 'tel' : field.fieldType === 'URL' ? 'url' : 'text'}
            value={value || ''}
            onChange={e => handleFieldChange(field.fieldKey, e.target.value)}
            placeholder={field.placeholder || ''}
            className={inputCls}
          />
        );

      case 'EMAIL':
        return fieldWrapper(field,
          <Input
            id={field.fieldKey}
            type="email"
            value={value || ''}
            onChange={e => handleFieldChange(field.fieldKey, e.target.value)}
            placeholder={field.placeholder || 'email@example.com'}
            className={inputCls}
          />
        );

      case 'NUMBER':
        return fieldWrapper(field,
          <Input
            id={field.fieldKey}
            type="number"
            value={value || ''}
            onChange={e => handleFieldChange(field.fieldKey, e.target.value)}
            placeholder={field.placeholder || ''}
            min={field.minValue ?? undefined}
            max={field.maxValue ?? undefined}
            className={inputCls}
          />
        );

      // ── Text Areas ──
      case 'TEXTAREA':
        return fieldWrapper(field,
          <Textarea
            id={field.fieldKey}
            value={value || ''}
            onChange={e => handleFieldChange(field.fieldKey, e.target.value)}
            placeholder={field.placeholder || ''}
            rows={4}
            className={`resize-y ${inputCls}`}
          />
        );

      case 'RICH_TEXT':
        return fieldWrapper(field,
          <Textarea
            id={field.fieldKey}
            value={value || ''}
            onChange={e => handleFieldChange(field.fieldKey, e.target.value)}
            placeholder={field.placeholder || 'Enter formatted text...'}
            rows={6}
            className={`resize-y font-serif ${inputCls}`}
          />
        );

      // ── Select ──
      case 'SELECT': {
        const options = field.options?.items || field.options?.choices || [];
        return fieldWrapper(field,
          <Select value={value || ''} onValueChange={val => handleFieldChange(field.fieldKey, val)}>
            <SelectTrigger className={inputCls}>
              <SelectValue placeholder={field.placeholder || 'Select an option'} />
            </SelectTrigger>
            <SelectContent>
              {Array.isArray(options) && options.map((opt: any, idx: number) => (
                <SelectItem key={idx} value={opt.value || String(opt)}>
                  {opt.label || String(opt)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }

      // ── Multi Select ──
      case 'MULTI_SELECT': {
        const msOptions = field.options?.items || field.options?.choices || [];
        const selected: string[] = value || [];
        return fieldWrapper(field,
          <div className={`border rounded-lg p-3 space-y-2 ${error ? 'border-red-400' : 'border-input'}`}>
            {Array.isArray(msOptions) && msOptions.map((opt: any, idx: number) => {
              const optVal = opt.value || String(opt);
              const optLabel = opt.label || String(opt);
              return (
                <div key={idx} className="flex items-center space-x-2.5 py-1">
                  <Checkbox
                    id={`${field.fieldKey}-ms-${idx}`}
                    checked={selected.includes(optVal)}
                    onCheckedChange={(checked) => {
                      const updated = checked
                        ? [...selected, optVal]
                        : selected.filter(v => v !== optVal);
                      handleFieldChange(field.fieldKey, updated);
                    }}
                  />
                  <Label htmlFor={`${field.fieldKey}-ms-${idx}`} className="font-normal text-sm cursor-pointer">
                    {optLabel}
                  </Label>
                </div>
              );
            })}
            {selected.length > 0 && (
              <p className="text-xs text-muted-foreground pt-1 border-t">
                {selected.length} selected
              </p>
            )}
          </div>
        );
      }

      // ── Radio ──
      case 'RADIO': {
        const radioOptions = field.options?.items || field.options?.choices || [];
        return fieldWrapper(field,
          <RadioGroup value={value || ''} onValueChange={val => handleFieldChange(field.fieldKey, val)} className="space-y-2">
            {Array.isArray(radioOptions) && radioOptions.map((opt: any, idx: number) => (
              <div key={idx} className="flex items-center space-x-2.5 py-1">
                <RadioGroupItem value={opt.value || String(opt)} id={`${field.fieldKey}-${idx}`} />
                <Label htmlFor={`${field.fieldKey}-${idx}`} className="font-normal text-sm cursor-pointer">
                  {opt.label || String(opt)}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );
      }

      // ── Checkbox (single boolean) ──
      case 'CHECKBOX': {
        return fieldWrapper(field,
          <div className="flex items-center space-x-2.5 py-1">
            <Checkbox
              id={field.fieldKey}
              checked={value === true || value === 'true'}
              onCheckedChange={(checked) => {
                handleFieldChange(field.fieldKey, !!checked);
              }}
            />
            <Label htmlFor={field.fieldKey} className="font-normal text-sm cursor-pointer">
              {field.description || field.label}
            </Label>
          </div>
        );
      }

      // ── Date / Time ──
      case 'DATE':
        return fieldWrapper(field,
          <Input id={field.fieldKey} type="date" value={value || ''} onChange={e => handleFieldChange(field.fieldKey, e.target.value)} className={inputCls} />
        );

      case 'TIME':
        return fieldWrapper(field,
          <Input id={field.fieldKey} type="time" value={value || ''} onChange={e => handleFieldChange(field.fieldKey, e.target.value)} className={inputCls} />
        );

      case 'DATETIME':
        return fieldWrapper(field,
          <Input id={field.fieldKey} type="datetime-local" value={value || ''} onChange={e => handleFieldChange(field.fieldKey, e.target.value)} className={inputCls} />
        );

      // ── File Upload ──
      case 'FILE_UPLOAD':
      case 'IMAGE_UPLOAD': {
        const uploaded = uploadedFiles[field.fieldKey];
        const isUploading = uploadingFiles[field.fieldKey];
        const isDragOver = dragOverField === field.fieldKey;

        return fieldWrapper(field,
          <div className="space-y-2">
            {!uploaded ? (
              <div
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer
                  ${isDragOver ? 'border-blue-400 bg-blue-50/50 scale-[1.01]' : error ? 'border-red-300 bg-red-50/30' : 'border-muted-foreground/25 hover:border-blue-300 hover:bg-blue-50/30'}`}
                onDragOver={(e) => { e.preventDefault(); setDragOverField(field.fieldKey); }}
                onDragLeave={() => setDragOverField(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverField(null);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFileUpload(field, file);
                }}
                onClick={() => document.getElementById(`file-${field.fieldKey}`)?.click()}
              >
                <input
                  id={`file-${field.fieldKey}`}
                  type="file"
                  className="hidden"
                  accept={field.allowedFileTypes ? field.allowedFileTypes.split(',').map(t => `.${t.trim()}`).join(',') : undefined}
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(field, file);
                  }}
                />
                {isUploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    <p className="text-sm text-blue-600 font-medium">Uploading...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                      <CloudUpload className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Drop file here or <span className="text-blue-600">browse</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {field.allowedFileTypes ? `${field.allowedFileTypes.toUpperCase()}` : 'Any file type'}
                        {field.maxFileSizeMb ? ` · Max ${field.maxFileSizeMb}MB` : ''}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-emerald-900 truncate">{uploaded.fileName}</p>
                  <p className="text-xs text-emerald-600">
                    {(parseInt(uploaded.fileSize) / 1024).toFixed(1)} KB · Uploaded
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-emerald-600 hover:text-red-500 hover:bg-red-50"
                  onClick={() => {
                    setUploadedFiles(prev => { const n = { ...prev }; delete n[field.fieldKey]; return n; });
                    handleFieldChange(field.fieldKey, null);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        );
      }

      // ── Rating ──
      case 'RATING': {
        const maxStars = (field.config as any)?.maxRating || 5;
        const currentRating = value || 0;
        return fieldWrapper(field,
          <div className="flex items-center gap-1">
            {Array.from({ length: maxStars }, (_, i) => (
              <button
                key={i}
                type="button"
                className="p-0.5 transition-all duration-150 hover:scale-125 focus:outline-none"
                onClick={() => handleFieldChange(field.fieldKey, i + 1)}
              >
                <Star
                  className={`w-7 h-7 transition-colors ${i < currentRating
                    ? 'fill-amber-400 text-amber-400'
                    : 'fill-none text-gray-300 hover:text-amber-300'
                    }`}
                />
              </button>
            ))}
            {currentRating > 0 && (
              <span className="ml-2 text-sm text-muted-foreground">{currentRating}/{maxStars}</span>
            )}
          </div>
        );
      }

      // ── Slider ──
      case 'SLIDER': {
        const min = field.minValue ?? 0;
        const max = field.maxValue ?? 100;
        const step = (field.config as any)?.step || 1;
        const sliderValue = value ?? min;
        const pct = ((sliderValue - min) / (max - min)) * 100;
        return fieldWrapper(field,
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <input
                type="range"
                id={field.fieldKey}
                min={min}
                max={max}
                step={step}
                value={sliderValue}
                onChange={e => handleFieldChange(field.fieldKey, parseFloat(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-blue-500"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${pct}%, #e5e7eb ${pct}%, #e5e7eb 100%)`
                }}
              />
              <span className="text-sm font-semibold text-foreground min-w-[3rem] text-right tabular-nums">
                {sliderValue}
              </span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{min}</span>
              <span>{max}</span>
            </div>
          </div>
        );
      }

      // ── Table ──
      case 'TABLE': {
        const columns: Array<{ key: string; label: string; header?: string; type?: string; options?: string[] }> =
          (field.config as any)?.columns || [
            { key: 'col1', label: 'Column 1' },
            { key: 'col2', label: 'Column 2' },
          ];
        const tableMode = (field.config as any)?.mode || 'dynamic';
        const fixedRowsCfg: Array<{ cells: Record<string, { type: 'preset' | 'editable'; value?: string }> }> =
          (field.config as any)?.fixedRows || [];

        // Helper to render a cell input based on column type
        const renderCellInput = (cellValue: string, onChange: (v: string) => void, col: typeof columns[0], placeholder?: string) => {
          if (col.type === 'select' && col.options && col.options.length > 0) {
            return (
              <Select value={cellValue || ''} onValueChange={onChange}>
                <SelectTrigger className="h-8 text-sm border-transparent hover:border-input focus:border-input bg-transparent">
                  <SelectValue placeholder={placeholder || col.header || col.label} />
                </SelectTrigger>
                <SelectContent>
                  {col.options.map((opt, i) => (
                    <SelectItem key={i} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          }
          return (
            <Input
              value={cellValue}
              onChange={e => onChange(e.target.value)}
              type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : col.type === 'time' ? 'time' : col.type === 'datetime' ? 'datetime-local' : 'text'}
              placeholder={placeholder || col.header || col.label}
              className="h-8 text-sm border-transparent hover:border-input focus:border-input bg-transparent"
            />
          );
        };

        // ── Fixed grid mode ──
        if (tableMode === 'fixed' && fixedRowsCfg.length > 0) {
          const fixedData: Record<string, Record<string, string>> = value || {};

          const updateFixedCell = (rowIdx: number, colKey: string, cellValue: string) => {
            const updated = { ...fixedData };
            const rowKey = `row_${rowIdx}`;
            updated[rowKey] = { ...(updated[rowKey] || {}), [colKey]: cellValue };
            handleFieldChange(field.fieldKey, updated);
          };

          return fieldWrapper(field,
            <div className="border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      {columns.map((col) => (
                        <th key={col.key} className="text-left p-2.5 font-medium text-xs uppercase tracking-wider text-muted-foreground">
                          {col.header || col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {fixedRowsCfg.map((row, rowIdx) => {
                      const rowKey = `row_${rowIdx}`;
                      return (
                        <tr key={rowIdx} className="border-b last:border-b-0 transition-colors hover:bg-muted/20">
                          {columns.map((col) => {
                            const cellCfg = (row.cells || {})[col.key] || { type: 'editable' };
                            const isPreset = cellCfg.type === 'preset';
                            const cellValue = isPreset ? (cellCfg.value || '') : ((fixedData[rowKey] || {})[col.key] || '');

                            return (
                              <td key={col.key} className="p-1.5">
                                {isPreset ? (
                                  <span className="block px-3 py-1.5 text-sm text-foreground bg-muted/30 rounded">
                                    {cellCfg.value || '—'}
                                  </span>
                                ) : (
                                  renderCellInput(
                                    (fixedData[rowKey] || {})[col.key] || '',
                                    (v) => updateFixedCell(rowIdx, col.key, v),
                                    col
                                  )
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        }

        // ── Dynamic rows mode (default) ──
        const dynamicRows: Array<Record<string, string>> = value || [{}];
        const addRow = () => handleFieldChange(field.fieldKey, [...dynamicRows, {}]);
        const removeRow = (idx: number) => {
          const updated = dynamicRows.filter((_: any, i: number) => i !== idx);
          handleFieldChange(field.fieldKey, updated.length > 0 ? updated : [{}]);
        };
        const updateDynamicCell = (rowIdx: number, colKey: string, cellValue: string) => {
          const updated = [...dynamicRows];
          updated[rowIdx] = { ...updated[rowIdx], [colKey]: cellValue };
          handleFieldChange(field.fieldKey, updated);
        };

        return fieldWrapper(field,
          <div className="space-y-2">
            <div className="border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      {columns.map((col) => (
                        <th key={col.key} className="text-left p-2.5 font-medium text-xs uppercase tracking-wider text-muted-foreground">
                          {col.header || col.label}
                        </th>
                      ))}
                      <th className="w-10 p-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {dynamicRows.map((row: any, rowIdx: number) => (
                      <tr key={rowIdx} className="border-b last:border-b-0 hover:bg-muted/20 transition-colors">
                        {columns.map((col) => (
                          <td key={col.key} className="p-1.5">
                            {renderCellInput(
                              row[col.key] || '',
                              (v) => updateDynamicCell(rowIdx, col.key, v),
                              col
                            )}
                          </td>
                        ))}
                        <td className="p-1.5">
                          {dynamicRows.length > 1 && (
                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-500" onClick={() => removeRow(rowIdx)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addRow} className="w-full gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Add Row
            </Button>
          </div>
        );
      }

      // ── Layout: Label ──
      case 'SECTION_HEADER':
        return fieldWrapper(field,
          <div className="py-1">
            <span className="text-sm font-medium text-foreground">{field.label}</span>
            {field.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{field.description}</p>
            )}
          </div>,
          true
        );

      // ── Layout: Divider ──
      case 'DIVIDER':
        return fieldWrapper(field,
          <div className="py-3">
            <Separator />
          </div>,
          true
        );

      // ── Layout: HTML Content (Tailwind supported via iframe) ──
      case 'HTML_CONTENT': {
        const htmlContent = (field.config as any)?.html || field.description || '';
        if (!htmlContent) return null;
        // Render in an iframe with Tailwind CDN so user's Tailwind classes work
        const iframeDoc = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script src="https://cdn.tailwindcss.com"><\/script>
<style>body{margin:0;font-family:system-ui,-apple-system,sans-serif;}</style>
</head><body>${htmlContent}</body>
<script>
  function sendHeight(){
    const h = document.documentElement.scrollHeight;
    window.parent.postMessage({type:'iframeHeight',fieldKey:'${field.fieldKey}',height:h},'*');
  }
  window.addEventListener('load', ()=>{ setTimeout(sendHeight, 100); setTimeout(sendHeight, 500); });
  new MutationObserver(sendHeight).observe(document.body,{childList:true,subtree:true});
<\/script></html>`;
        return fieldWrapper(field,
          <iframe
            key={field.fieldKey}
            srcDoc={iframeDoc}
            sandbox="allow-scripts allow-same-origin"
            className="w-full border-0 rounded-lg overflow-hidden"
            style={{ minHeight: '40px' }}
            onLoad={(e) => {
              const iframe = e.target as HTMLIFrameElement;
              const handler = (ev: MessageEvent) => {
                if (ev.data?.type === 'iframeHeight' && ev.data?.fieldKey === field.fieldKey) {
                  iframe.style.height = ev.data.height + 'px';
                }
              };
              window.addEventListener('message', handler);
              // Cleanup on unmount via a one-time setup
              iframe.dataset.listenerSet = 'true';
            }}
          />,
          true
        );
      }

      // ── Signature (placeholder) ──
      case 'SIGNATURE':
        return fieldWrapper(field,
          <div className={`border-2 border-dashed rounded-xl p-8 text-center ${error ? 'border-red-300' : 'border-muted-foreground/25'}`}>
            <p className="text-sm text-muted-foreground">Signature capture not yet available</p>
          </div>
        );

      // ── Location (placeholder) ──
      case 'LOCATION':
        return fieldWrapper(field,
          <Input
            id={field.fieldKey}
            type="text"
            value={value || ''}
            onChange={e => handleFieldChange(field.fieldKey, e.target.value)}
            placeholder={field.placeholder || 'Enter location or coordinates'}
            className={inputCls}
          />
        );

      default:
        return fieldWrapper(field,
          <Input
            id={field.fieldKey}
            type="text"
            value={value || ''}
            onChange={e => handleFieldChange(field.fieldKey, e.target.value)}
            placeholder={field.placeholder || ''}
            className={inputCls}
          />
        );
    }
  };

  // ─── Main Render ──────────────────────────────────────────────────
  const themeColor = form.themeColor || '#3b82f6';

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="shadow-xl border-0 overflow-hidden">
        {/* Theme Color Top Bar */}
        <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${themeColor}, ${themeColor}88)` }} />

        <CardHeader className="pb-4 pt-8 px-8">
          <CardTitle className="text-2xl font-bold tracking-tight">{form.name}</CardTitle>
          {form.description && (
            <p className="text-muted-foreground mt-2 leading-relaxed">{form.description}</p>
          )}

          {/* Progress bar for multi-step */}
          {form.isMultiStep && (
            <div className="mt-5 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Step {currentStep} of {maxStep}</span>
                <span className="font-medium" style={{ color: themeColor }}>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </CardHeader>

        <CardContent className="px-8 pb-8">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              {currentFields.map(field => renderField(field))}
            </div>

            {/* Navigation / Submit */}
            <div className="mt-10 flex items-center justify-between gap-4 pt-6 border-t">
              {form.isMultiStep && currentStep > 1 ? (
                <Button type="button" variant="outline" onClick={handleBack} className="px-6">
                  ← Back
                </Button>
              ) : (
                <div />
              )}

              {form.isMultiStep && currentStep < maxStep ? (
                <Button type="button" onClick={handleNext} className="px-8" style={{ backgroundColor: themeColor }}>
                  Next →
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={submitting}
                  className="px-8 min-w-36 font-semibold shadow-lg hover:shadow-xl transition-shadow"
                  style={{ backgroundColor: themeColor }}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit'
                  )}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Branding */}
      <div className="text-center mt-6 text-xs text-muted-foreground/60">
        Powered by AebDMS
      </div>
    </div>
  );
}
