'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import FormDesigner from '@/components/forms/FormDesigner';
import { formService } from '@/api/services/formService';
import { CreateFormRequest, FormResponse } from '@/types/api';
import { useNotifications } from '@/hooks/useNotifications';
import { Loader2 } from 'lucide-react';

export default function EditFormPage() {
    const router = useRouter();
    const params = useParams();
    const formId = Number(params.id);
    const { showSuccess, showError } = useNotifications();

    const [form, setForm] = useState<FormResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const loadForm = async () => {
            try {
                const data = await formService.getFormById(formId);
                setForm(data);
            } catch (error: any) {
                console.error('Failed to load form:', error);
                showError('Load Failed', 'Failed to load form. Please try again.');
                router.push('/admin/forms');
            } finally {
                setLoading(false);
            }
        };

        if (formId) {
            loadForm();
        }
    }, [formId]);

    const handleSave = async (formData: CreateFormRequest) => {
        setSaving(true);
        try {
            await formService.updateForm(formId, formData);
            showSuccess('Form Updated', 'Your form has been updated successfully');
            router.push('/admin/forms');
        } catch (error: any) {
            console.error('Failed to update form:', error);
            showError('Save Failed', error.message || 'Failed to update form. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // Convert FormResponse to CreateFormRequest format for the designer
    const getInitialData = (): CreateFormRequest | undefined => {
        if (!form) return undefined;

        return {
            name: form.name,
            slug: form.slug,
            description: form.description || '',
            category: form.category || '',
            allowMultipleSubmissions: form.allowMultipleSubmissions ?? true,
            requireAuthentication: form.requireAuthentication ?? false,
            isPublic: form.isPublic ?? true,
            showProgressBar: form.showProgressBar ?? true,
            isMultiStep: form.isMultiStep ?? false,
            sendEmailNotification: form.sendEmailNotification ?? false,
            notificationEmail: form.notificationEmail || '',
            sendConfirmationEmail: form.sendConfirmationEmail ?? false,
            maxSubmissions: form.maxSubmissions,
            submissionDeadline: form.submissionDeadline,
            closeAfterMaxSubmissions: form.closeAfterMaxSubmissions ?? false,
            successMessage: form.successMessage || '',
            redirectUrl: form.redirectUrl || '',
            themeColor: form.themeColor || '#3B82F6',
            backgroundColor: form.backgroundColor || '#FFFFFF',
            customCss: form.customCss || '',
            saveToFolderId: form.saveToFolderId,
            createDocumentOnSubmit: form.createDocumentOnSubmit ?? false,
            templateMinioKey: form.templateMinioKey,
            templateFilename: form.templateFilename,
            outputAsPdf: form.outputAsPdf ?? false,
            filingCategoryId: form.filingCategoryId,
            fieldMetadataMappings: form.fieldMetadataMappings,
            defaultCreatorUserId: form.defaultCreatorUserId,
            fields: form.fields?.map(field => ({
                label: field.label,
                fieldKey: field.fieldKey,
                fieldType: field.fieldType,
                placeholder: field.placeholder || '',
                description: field.description || '',
                defaultValue: field.defaultValue || '',
                isRequired: field.isRequired ?? false,
                minLength: field.minLength,
                maxLength: field.maxLength,
                minValue: field.minValue,
                maxValue: field.maxValue,
                pattern: field.pattern || '',
                validationMessage: field.validationMessage || '',
                options: field.options?.items || [],
                conditionalLogic: field.conditionalLogic,
                orderIndex: field.orderIndex ?? 0,
                stepNumber: field.stepNumber ?? 1,
                width: field.width || 'full',
                allowedFileTypes: field.allowedFileTypes || '',
                maxFileSizeMb: field.maxFileSizeMb,
                allowMultipleFiles: field.allowMultipleFiles ?? false,
                config: field.config
            })) || []
        };
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (!form) {
        return null;
    }

    return (
        <div className="h-screen overflow-hidden">
            <FormDesigner
                formId={form.id}
                initialData={getInitialData()}
                initialFolderName={form.saveToFolderName}
                onSave={handleSave}
                onCancel={() => router.push('/admin/forms')}
                saving={saving}
            />
        </div>
    );
}
