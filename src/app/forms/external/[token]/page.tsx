'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ClipboardList, Upload, CheckCircle, AlertTriangle, Loader2, Clock } from 'lucide-react';

// Types for the external form
interface FormField {
    label: string;
    type: string; // TEXT, EMAIL, NUMBER, DATE, FILE
    variableKey: string;
    required: boolean;
}

interface FormData {
    token: string;
    fields: FormField[];
    expiresAt: string;
    status: string;
}

export default function ExternalFormPage() {
    const params = useParams();
    const token = params?.token as string;

    const [formData, setFormData] = useState<FormData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Field values
    const [values, setValues] = useState<Record<string, string>>({});
    const [fileValues, setFileValues] = useState<Record<string, File>>({});
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    // Determine the API base URL
    const apiBaseUrl = typeof window !== 'undefined'
        ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080')
        : '';

    useEffect(() => {
        if (!token) return;

        const fetchForm = async () => {
            try {
                const res = await fetch(`${apiBaseUrl}/api/v1/external-forms/${token}`);
                if (res.status === 404) {
                    setError('This form link is invalid or has been removed.');
                    return;
                }
                if (res.status === 410) {
                    const data = await res.json();
                    setError(data.error || 'This form has expired or was already submitted.');
                    return;
                }
                if (!res.ok) {
                    setError('Failed to load form. Please try again later.');
                    return;
                }
                const data = await res.json();
                setFormData(data);
            } catch (err) {
                setError('Unable to connect to the server. Please check your connection.');
            } finally {
                setLoading(false);
            }
        };

        fetchForm();
    }, [token, apiBaseUrl]);

    const validate = (): boolean => {
        const errors: Record<string, string> = {};

        if (!formData) return false;

        for (const field of formData.fields) {
            if (field.required) {
                if (field.type === 'FILE') {
                    if (!fileValues[field.variableKey]) {
                        errors[field.variableKey] = `${field.label} is required`;
                    }
                } else {
                    if (!values[field.variableKey] || values[field.variableKey].trim() === '') {
                        errors[field.variableKey] = `${field.label} is required`;
                    }
                }
            }

            // Email validation
            if (field.type === 'EMAIL' && values[field.variableKey]) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(values[field.variableKey])) {
                    errors[field.variableKey] = 'Please enter a valid email address';
                }
            }
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate() || !formData) return;

        setSubmitting(true);

        try {
            const formDataBody = new FormData();

            // Add text values as params
            for (const [key, value] of Object.entries(values)) {
                formDataBody.append(key, value);
            }

            // Add file values
            for (const [key, file] of Object.entries(fileValues)) {
                formDataBody.append(`files[${key}]`, file);
            }

            const res = await fetch(`${apiBaseUrl}/api/v1/external-forms/${token}/submit`, {
                method: 'POST',
                body: formDataBody,
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || 'Submission failed. Please try again.');
                return;
            }

            setSubmitted(true);
        } catch (err) {
            setError('Failed to submit the form. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-teal-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-500">Loading form...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Form</h2>
                    <p className="text-gray-500">{error}</p>
                </div>
            </div>
        );
    }

    // Submitted state
    if (submitted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-10 h-10 text-green-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Form Submitted Successfully!</h2>
                    <p className="text-gray-500">Thank you for providing the requested information. You can close this page now.</p>
                </div>
            </div>
        );
    }

    if (!formData) return null;

    const expiresDate = new Date(formData.expiresAt);
    const isExpiringSoon = expiresDate.getTime() - Date.now() < 2 * 60 * 60 * 1000; // < 2 hours

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-teal-500 to-emerald-500 p-6 text-white">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                            <ClipboardList className="w-5 h-5" />
                        </div>
                        <h1 className="text-xl font-bold">Form Request</h1>
                    </div>
                    <p className="text-white/80 text-sm">Please fill in the fields below and submit.</p>
                    {isExpiringSoon && (
                        <div className="mt-3 flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 text-sm">
                            <Clock className="w-4 h-4" />
                            Expires: {expiresDate.toLocaleString()}
                        </div>
                    )}
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {formData.fields.map((field) => (
                        <div key={field.variableKey}>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                {field.label}
                                {field.required && <span className="text-red-500 ml-1">*</span>}
                            </label>

                            {field.type === 'FILE' ? (
                                <div className="relative">
                                    <input
                                        type="file"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setFileValues(prev => ({ ...prev, [field.variableKey]: file }));
                                                setValidationErrors(prev => ({ ...prev, [field.variableKey]: '' }));
                                            }
                                        }}
                                        className="hidden"
                                        id={`file-${field.variableKey}`}
                                    />
                                    <label
                                        htmlFor={`file-${field.variableKey}`}
                                        className="flex items-center gap-3 p-3 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-teal-300 hover:bg-teal-50/30 transition-all"
                                    >
                                        <Upload className="w-5 h-5 text-gray-400" />
                                        <span className="text-sm text-gray-500">
                                            {fileValues[field.variableKey]
                                                ? fileValues[field.variableKey].name
                                                : 'Click to upload file'}
                                        </span>
                                    </label>
                                </div>
                            ) : field.type === 'DATE' ? (
                                <input
                                    type="date"
                                    value={values[field.variableKey] || ''}
                                    onChange={(e) => {
                                        setValues(prev => ({ ...prev, [field.variableKey]: e.target.value }));
                                        setValidationErrors(prev => ({ ...prev, [field.variableKey]: '' }));
                                    }}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                                />
                            ) : field.type === 'NUMBER' ? (
                                <input
                                    type="number"
                                    value={values[field.variableKey] || ''}
                                    onChange={(e) => {
                                        setValues(prev => ({ ...prev, [field.variableKey]: e.target.value }));
                                        setValidationErrors(prev => ({ ...prev, [field.variableKey]: '' }));
                                    }}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                                    placeholder={`Enter ${field.label.toLowerCase()}`}
                                />
                            ) : (
                                <input
                                    type={field.type === 'EMAIL' ? 'email' : 'text'}
                                    value={values[field.variableKey] || ''}
                                    onChange={(e) => {
                                        setValues(prev => ({ ...prev, [field.variableKey]: e.target.value }));
                                        setValidationErrors(prev => ({ ...prev, [field.variableKey]: '' }));
                                    }}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                                    placeholder={`Enter ${field.label.toLowerCase()}`}
                                />
                            )}

                            {validationErrors[field.variableKey] && (
                                <p className="text-xs text-red-500 mt-1">{validationErrors[field.variableKey]}</p>
                            )}
                        </div>
                    ))}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold rounded-xl hover:from-teal-600 hover:to-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            'Submit Form'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
