'use client';

import React, { useState } from 'react';
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
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Loader2, Upload, X, FileText, CheckCircle } from 'lucide-react';
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

  const fields = form.fields.sort((a, b) => a.orderIndex - b.orderIndex);
  const maxStep = form.isMultiStep ? Math.max(...fields.map(f => f.stepNumber)) : 1;
  const currentFields = form.isMultiStep
    ? fields.filter(f => f.stepNumber === currentStep)
    : fields;

  const progress = form.isMultiStep
    ? (currentStep / maxStep) * 100
    : (Object.keys(formData).length / fields.length) * 100;

  const validateField = (field: FormFieldResponse, value: any): string | null => {
    if (field.isRequired && (!value || value.toString().trim() === '')) {
      return `${field.label} is required`;
    }

    if (value) {
      const strValue = value.toString();

      if (field.minLength && strValue.length < field.minLength) {
        return `${field.label} must be at least ${field.minLength} characters`;
      }

      if (field.maxLength && strValue.length > field.maxLength) {
        return `${field.label} must not exceed ${field.maxLength} characters`;
      }

      if (field.fieldType === 'EMAIL' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strValue)) {
        return 'Please enter a valid email address';
      }

      if (field.fieldType === 'NUMBER') {
        const numValue = parseFloat(strValue);
        if (field.minValue !== undefined && field.minValue !== null && numValue < field.minValue) {
          return `Value must be at least ${field.minValue}`;
        }
        if (field.maxValue !== undefined && field.maxValue !== null && numValue > field.maxValue) {
          return `Value must not exceed ${field.maxValue}`;
        }
      }

      if (field.pattern) {
        const regex = new RegExp(field.pattern);
        if (!regex.test(strValue)) {
          return field.validationMessage || 'Invalid format';
        }
      }
    }

    return null;
  };

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    currentFields.forEach(field => {
      const error = validateField(field, formData[field.fieldKey]);
      if (error) {
        newErrors[field.fieldKey] = error;
        isValid = false;
      }
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

    // Check if any files are still uploading
    const stillUploading = Object.values(uploadingFiles).some(uploading => uploading);
    if (stillUploading) {
      alert('Please wait for all files to finish uploading');
      return;
    }

    if (validateStep()) {
      onSubmit(formData);
    }
  };

  const handleFieldChange = (fieldKey: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldKey]: value }));
    // Clear error when user starts typing
    if (errors[fieldKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldKey];
        return newErrors;
      });
    }
  };

  const renderField = (field: FormFieldResponse) => {
    const value = formData[field.fieldKey];
    const error = errors[field.fieldKey];

    const fieldWrapper = (content: React.ReactNode) => (
      <div key={field.id} className={`
        ${field.width === 'half' ? 'md:col-span-1' : ''}
        ${field.width === 'third' ? 'md:col-span-1' : ''}
        ${field.width === 'full' ? 'md:col-span-2' : ''}
      `}>
        <div className="space-y-2">
          <Label htmlFor={field.fieldKey}>
            {field.label}
            {field.isRequired && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {field.description && (
            <p className="text-sm text-gray-500">{field.description}</p>
          )}
          {content}
          {error && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {error}
            </p>
          )}
        </div>
      </div>
    );

    switch (field.fieldType) {
      case 'TEXT':
      case 'PHONE':
      case 'URL':
        return fieldWrapper(
          <Input
            id={field.fieldKey}
            type="text"
            value={value || ''}
            onChange={(e) => handleFieldChange(field.fieldKey, e.target.value)}
            placeholder={field.placeholder || ''}
            className={error ? 'border-red-500' : ''}
          />
        );

      case 'EMAIL':
        return fieldWrapper(
          <Input
            id={field.fieldKey}
            type="email"
            value={value || ''}
            onChange={(e) => handleFieldChange(field.fieldKey, e.target.value)}
            placeholder={field.placeholder || ''}
            className={error ? 'border-red-500' : ''}
          />
        );

      case 'NUMBER':
        return fieldWrapper(
          <Input
            id={field.fieldKey}
            type="number"
            value={value || ''}
            onChange={(e) => handleFieldChange(field.fieldKey, e.target.value)}
            placeholder={field.placeholder || ''}
            min={field.minValue}
            max={field.maxValue}
            className={error ? 'border-red-500' : ''}
          />
        );

      case 'TEXTAREA':
        return fieldWrapper(
          <Textarea
            id={field.fieldKey}
            value={value || ''}
            onChange={(e) => handleFieldChange(field.fieldKey, e.target.value)}
            placeholder={field.placeholder || ''}
            rows={4}
            className={error ? 'border-red-500' : ''}
          />
        );

      case 'SELECT':
        const options = field.options?.items || field.options?.choices || [];
        return fieldWrapper(
          <Select
            value={value || ''}
            onValueChange={(val) => handleFieldChange(field.fieldKey, val)}
          >
            <SelectTrigger className={error ? 'border-red-500' : ''}>
              <SelectValue placeholder={field.placeholder || 'Select an option'} />
            </SelectTrigger>
            <SelectContent>
              {Array.isArray(options) && options.map((option: any, idx: number) => (
                <SelectItem key={idx} value={option.value || option}>
                  {option.label || option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'RADIO':
        const radioOptions = field.options?.items || field.options?.choices || [];
        return fieldWrapper(
          <RadioGroup
            value={value || ''}
            onValueChange={(val) => handleFieldChange(field.fieldKey, val)}
          >
            {Array.isArray(radioOptions) && radioOptions.map((option: any, idx: number) => (
              <div key={idx} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value || option} id={`${field.fieldKey}-${idx}`} />
                <Label htmlFor={`${field.fieldKey}-${idx}`} className="font-normal">
                  {option.label || option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'CHECKBOX':
        const checkboxOptions = field.options?.items || field.options?.choices || [];
        return fieldWrapper(
          <div className="space-y-2">
            {Array.isArray(checkboxOptions) && checkboxOptions.map((option: any, idx: number) => (
              <div key={idx} className="flex items-center space-x-2">
                <Checkbox
                  id={`${field.fieldKey}-${idx}`}
                  checked={(value || []).includes(option.value || option)}
                  onCheckedChange={(checked) => {
                    const current = value || [];
                    const optionValue = option.value || option;
                    const updated = checked
                      ? [...current, optionValue]
                      : current.filter((v: any) => v !== optionValue);
                    handleFieldChange(field.fieldKey, updated);
                  }}
                />
                <Label htmlFor={`${field.fieldKey}-${idx}`} className="font-normal">
                  {option.label || option}
                </Label>
              </div>
            ))}
          </div>
        );

      case 'DATE':
        return fieldWrapper(
          <Input
            id={field.fieldKey}
            type="date"
            value={value || ''}
            onChange={(e) => handleFieldChange(field.fieldKey, e.target.value)}
            className={error ? 'border-red-500' : ''}
          />
        );

      case 'TIME':
        return fieldWrapper(
          <Input
            id={field.fieldKey}
            type="time"
            value={value || ''}
            onChange={(e) => handleFieldChange(field.fieldKey, e.target.value)}
            className={error ? 'border-red-500' : ''}
          />
        );

      case 'DATETIME':
        return fieldWrapper(
          <Input
            id={field.fieldKey}
            type="datetime-local"
            value={value || ''}
            onChange={(e) => handleFieldChange(field.fieldKey, e.target.value)}
            className={error ? 'border-red-500' : ''}
          />
        );

      case 'FILE_UPLOAD':
      case 'IMAGE_UPLOAD':
        const uploadedFile = uploadedFiles[field.fieldKey];
        const isUploading = uploadingFiles[field.fieldKey];

        return fieldWrapper(
          <div className="space-y-2">
            {!uploadedFile ? (
              <div className="relative">
                <Input
                  id={field.fieldKey}
                  type="file"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Validate file size
                      const maxSize = (field.maxFileSizeMb || 10) * 1024 * 1024;
                      if (file.size > maxSize) {
                        setErrors(prev => ({
                          ...prev,
                          [field.fieldKey]: `File size must not exceed ${field.maxFileSizeMb || 10}MB`
                        }));
                        return;
                      }

                      // Validate file type if specified
                      if (field.allowedFileTypes) {
                        const allowedTypes = field.allowedFileTypes.split(',').map(t => t.trim());
                        const fileExtension = file.name.split('.').pop()?.toLowerCase();
                        if (fileExtension && !allowedTypes.includes(fileExtension)) {
                          setErrors(prev => ({
                            ...prev,
                            [field.fieldKey]: `Only ${field.allowedFileTypes} files are allowed`
                          }));
                          return;
                        }
                      }

                      // Upload to MinIO
                      setUploadingFiles(prev => ({ ...prev, [field.fieldKey]: true }));
                      try {
                        const response = await formService.uploadFormFile(file, field.fieldKey);
                        setUploadedFiles(prev => ({
                          ...prev,
                          [field.fieldKey]: {
                            fileName: response.fileName,
                            fileUrl: response.fileUrl,
                            fileSize: response.fileSize,
                            contentType: response.contentType
                          }
                        }));
                        handleFieldChange(field.fieldKey, response.fileUrl);

                        // Clear error
                        setErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors[field.fieldKey];
                          return newErrors;
                        });
                      } catch (err: any) {
                        setErrors(prev => ({
                          ...prev,
                          [field.fieldKey]: err.message || 'Failed to upload file'
                        }));
                      } finally {
                        setUploadingFiles(prev => ({ ...prev, [field.fieldKey]: false }));
                      }
                    }
                  }}
                  accept={field.allowedFileTypes ? field.allowedFileTypes.split(',').map(t => `.${t.trim()}`).join(',') : undefined}
                  disabled={isUploading}
                  className={error ? 'border-red-500' : ''}
                />
                {isUploading && (
                  <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-green-900 truncate">{uploadedFile.fileName}</p>
                  <p className="text-xs text-green-700">
                    {(parseInt(uploadedFile.fileSize) / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setUploadedFiles(prev => {
                      const newFiles = { ...prev };
                      delete newFiles[field.fieldKey];
                      return newFiles;
                    });
                    handleFieldChange(field.fieldKey, null);
                  }}
                  className="flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
            {field.allowedFileTypes && (
              <p className="text-xs text-gray-500">
                Allowed: {field.allowedFileTypes}
                {field.maxFileSizeMb && ` (Max: ${field.maxFileSizeMb}MB)`}
              </p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">{form.name}</CardTitle>
          {form.description && (
            <p className="text-gray-600 mt-2">{form.description}</p>
          )}
          {/* Progress bar removed as requested */}
          {form.isMultiStep && (
            <div className="mt-4 text-sm text-gray-600">
              Step {currentStep} of {maxStep}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {currentFields.map(field => renderField(field))}
            </div>

            <div className="mt-8 flex items-center justify-between gap-4">
              {form.isMultiStep && currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                >
                  Back
                </Button>
              )}
              <div className="flex-1" />
              {form.isMultiStep && currentStep < maxStep ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  style={{ backgroundColor: form.themeColor || undefined }}
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={submitting}
                  style={{ backgroundColor: form.themeColor || undefined }}
                  className="min-w-32"
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
      <div className="text-center mt-6 text-sm text-gray-500">
        Powered by AebDMS
      </div>
    </div>
  );
}

