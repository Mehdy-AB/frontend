'use client';
import Image from 'next/image';

import React, { useState, useEffect } from 'react';
import { use } from 'react';
import { formService } from '@/api/services/formService';
import { FormResponse, SubmitFormRequest } from '@/types/api';
import FormRenderer from '@/components/forms/FormRenderer';
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function PublicFormPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [form, setForm] = useState<FormResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [startTime] = useState(Date.now());

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

  // ─── Loading State ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-lg font-medium text-foreground">Loading form...</p>
            <p className="text-sm text-muted-foreground">Please wait a moment</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Error State ──────────────────────────────────────────────────
  if (error || !form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-red-50/30 p-6">
        <Card className="max-w-md w-full shadow-xl border-0">
          <div className="h-1 bg-gradient-to-r from-red-400 to-red-500 rounded-t-xl" />
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">Form Not Available</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">{error || 'This form could not be found or is no longer accepting responses.'}</p>
            </div>
            <Separator />
            <Button variant="outline" onClick={() => window.history.back()} className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Success State ────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50/30 p-6">
        <Card className="max-w-md w-full shadow-xl border-0">
          <div className="h-1 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-t-xl" />
          <CardContent className="pt-10 pb-8 text-center space-y-5">
            <div className="relative">
              <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 flex items-center justify-center animate-in zoom-in-50 duration-500">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
            </div>
            <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
              <h2 className="text-2xl font-bold text-foreground">Thank You!</h2>
              <p className="text-muted-foreground leading-relaxed">
                {form.successMessage || 'Your submission has been received successfully. We will review it shortly.'}
              </p>
            </div>
            {form.redirectUrl && (
              <div className="pt-2">
                <a
                  href={form.redirectUrl}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors"
                >
                  Continue →
                </a>
              </div>
            )}
            {form.allowMultipleSubmissions && (
              <div className="pt-2">
                <Button variant="ghost" onClick={() => { setSubmitted(false); }} className="text-muted-foreground">
                  Submit another response
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Form View ────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen py-12 px-4"
      style={{
        background: form.backgroundColor
          ? `linear-gradient(135deg, ${form.backgroundColor} 0%, ${form.backgroundColor}dd 100%)`
          : 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)'
      }}
    >
      {/* Logo */}
      <div className="flex justify-center mb-8">
        <div className="w-48 h-16 relative">
          <Image
            src="/logo.svg"
            alt="Logo"
            fill
            className="object-contain"
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
