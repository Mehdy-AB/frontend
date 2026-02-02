'use client';

import React, { useState, useEffect } from 'react';
import { use } from 'react';
import {
  BarChart3,
  Users,
  Eye,
  CheckCircle,
  Clock,
  TrendingUp,
  Calendar,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formService } from '@/api/services/formService';
import { FormResponse } from '@/types/api';
import { useRouter } from 'next/navigation';

export default function FormAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [form, setForm] = useState<FormResponse | null>(null);
  const [analytics, setAnalytics] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [formData, analyticsData] = await Promise.all([
          formService.getFormById(parseInt(id)),
          formService.getFormAnalytics(parseInt(id))
        ]);
        setForm(formData);
        setAnalytics(analyticsData);
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  if (!form || !analytics) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">Failed to load analytics data</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const conversionRate = form.viewCount > 0
    ? ((form.submissionCount / form.viewCount) * 100).toFixed(1)
    : '0';

  const avgTimeFormatted = form.avgCompletionTimeSeconds
    ? `${Math.floor(form.avgCompletionTimeSeconds / 60)}m ${form.avgCompletionTimeSeconds % 60}s`
    : 'N/A';

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Button variant="ghost" onClick={() => router.push('/admin/forms')}>
            ← Back to Forms
          </Button>
          <h1 className="text-3xl font-bold mt-2">{form.name} - Analytics</h1>
          <p className="text-gray-500 mt-1">Form performance metrics and insights</p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{form.viewCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Since {new Date(form.publishedAt || form.createdAt).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{form.submissionCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {conversionRate}% conversion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {form.completionRate?.toFixed(1) || '0'}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Forms completed vs started
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Completion Time</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgTimeFormatted}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Time to complete form
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Submission Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Submission Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.submissionsByStatus && Object.entries(analytics.submissionsByStatus).map(([status, count]) => {
                const percentage = form.submissionCount > 0
                  ? (((count as number) / form.submissionCount) * 100).toFixed(1)
                  : '0';
                
                const colors: Record<string, string> = {
                  SUBMITTED: 'bg-blue-500',
                  UNDER_REVIEW: 'bg-yellow-500',
                  APPROVED: 'bg-green-500',
                  REJECTED: 'bg-red-500',
                  ARCHIVED: 'bg-gray-500'
                };

                return (
                  <div key={status}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">{status.replace(/_/g, ' ')}</span>
                      <span className="text-gray-500">{count as number} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`${colors[status] || 'bg-gray-500'} h-2 rounded-full transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Form Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Form Status</span>
                <span className="font-semibold">{form.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Fields</span>
                <span className="font-semibold">{form.fields.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Required Fields</span>
                <span className="font-semibold">
                  {form.fields.filter(f => f.isRequired).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Multi-Step</span>
                <span className="font-semibold">{form.isMultiStep ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Public Access</span>
                <span className="font-semibold">{form.isPublic ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Created</span>
                <span className="font-semibold">
                  {new Date(form.createdAt).toLocaleDateString()}
                </span>
              </div>
              {form.publishedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Published</span>
                  <span className="font-semibold">
                    {new Date(form.publishedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Field Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Form Fields</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Field</th>
                  <th className="text-left py-3 px-4 font-medium">Type</th>
                  <th className="text-left py-3 px-4 font-medium">Required</th>
                  <th className="text-left py-3 px-4 font-medium">Order</th>
                </tr>
              </thead>
              <tbody>
                {form.fields
                  .sort((a, b) => a.orderIndex - b.orderIndex)
                  .map((field) => (
                    <tr key={field.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{field.label}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-gray-100 rounded text-sm">
                          {field.fieldType}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {field.isRequired ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">{field.orderIndex + 1}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button onClick={() => router.push(`/admin/forms/${id}/submissions`)}>
              <Users className="w-4 h-4 mr-2" />
              View Submissions
            </Button>
            <Button variant="outline" onClick={() => router.push(`/admin/forms/${id}/edit`)}>
              Edit Form
            </Button>
            <Button variant="outline" onClick={() => window.open(`/forms/${form.slug}`, '_blank')}>
              <Eye className="w-4 h-4 mr-2" />
              Preview Form
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/forms/${form.slug}`);
                alert('Link copied to clipboard!');
              }}
            >
              Copy Public Link
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Performance Tips */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">💡 Performance Tips</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-900">
          <ul className="space-y-2">
            {form.completionRate && form.completionRate < 50 && (
              <li>• Consider reducing the number of required fields to improve completion rate</li>
            )}
            {form.avgCompletionTimeSeconds && form.avgCompletionTimeSeconds > 300 && (
              <li>• The average completion time is quite long - consider simplifying your form</li>
            )}
            {form.fields.length > 15 && (
              <li>• Your form has many fields - consider using multi-step form feature</li>
            )}
            {!form.isMultiStep && form.fields.length > 10 && (
              <li>• Enable multi-step form to improve user experience for long forms</li>
            )}
            {form.viewCount > 100 && form.submissionCount < 10 && (
              <li>• Low conversion rate - review your form design and field requirements</li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

