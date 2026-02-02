'use client';
import Image from 'next/image';

import React, { useState, useEffect } from 'react';
import { use } from 'react';
import { formService } from '@/api/services/formService';
import { FormResponse, SubmitFormRequest } from '@/types/api';
import FormRenderer from '@/components/forms/FormRenderer';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function PublicFormPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [form, setForm] = useState<FormResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const data = await formService.getPublicForm(slug);
        setForm(data);
        setError(null);
      } catch (err: any) {
        console.error('Failed to load form:', err);
        setError(err.message || 'Form not found or not available');
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [slug]);

  const handleSubmit = async (data: Record<string, any>) => {
    setSubmitting(true);
    try {
      const request: SubmitFormRequest = {
        submissionData: data,
        completionTimeSeconds: Math.floor((Date.now() - startTime) / 1000)
      };

      await formService.submitPublicForm(slug, request);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Failed to submit form:', err);
      alert(err.message || 'Failed to submit form. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const [startTime] = useState(Date.now());

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading form...</p>
        </div>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Form Not Available</h2>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
            <p className="text-gray-600">
              {form.successMessage || 'Your submission has been received successfully.'}
            </p>
            {form.redirectUrl && (
              <a
                href={form.redirectUrl}
                className="inline-block mt-6 text-blue-600 hover:underline"
              >
                Continue →
              </a>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen py-12 px-4"
      style={{
        backgroundColor: form.backgroundColor || '#f9fafb',
        color: form.themeColor ? undefined : undefined
      }}
    >
      <div className="flex justify-center mb-8">
        <div className="w-48 h-16 relative">
          <Image
            src="/logo.svg"
            alt="Logo"
            fill
            className="object-contain" // Use object-contain to keep aspect ratio
            priority
          />
        </div>
      </div>
      <FormRenderer
        form={form}
        onSubmit={handleSubmit}
        submitting={submitting}
      />
    </div>
  );
}

