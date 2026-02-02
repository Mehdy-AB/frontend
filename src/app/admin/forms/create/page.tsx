'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import FormDesigner from '@/components/forms/FormDesigner';
import { formService } from '@/api/services/formService';
import { CreateFormRequest } from '@/types/api';
import { useNotifications } from '@/hooks/useNotifications';

export default function CreateFormPage() {
  const router = useRouter();
  const { showSuccess, showError } = useNotifications();
  const [saving, setSaving] = useState(false);

  const handleSave = async (formData: CreateFormRequest) => {
    setSaving(true);
    try {
      const created = await formService.createForm(formData);
      showSuccess('Form Created', 'Your form has been created successfully');
      router.push('/admin/forms');
    } catch (error: any) {
      console.error('Failed to create form:', error);
      showError('Save Failed', error.message || 'Failed to create form. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden">
      <FormDesigner
        onSave={handleSave}
        onCancel={() => router.push('/admin/forms')}
        saving={saving}
      />
    </div>
  );
}

