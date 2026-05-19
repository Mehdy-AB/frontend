'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Zap, Database, Search, FileText, TrendingUp } from 'lucide-react';
import type { PerformanceSettings } from '../lib/types';

interface PerformanceTabProps {
  performanceSettings: PerformanceSettings;
  onPerformanceSettingsChange: (settings: PerformanceSettings) => void;
}

export default function PerformanceTab({
  performanceSettings,
  onPerformanceSettingsChange
}: PerformanceTabProps) {
  const updateCaching = (updates: Partial<typeof performanceSettings.caching>) => {
    onPerformanceSettingsChange({
      ...performanceSettings,
      caching: { ...performanceSettings.caching, ...updates }
    });
  };

  const updateIndexing = (updates: Partial<typeof performanceSettings.indexing>) => {
    onPerformanceSettingsChange({
      ...performanceSettings,
      indexing: { ...performanceSettings.indexing, ...updates }
    });
  };

  const updateCompression = (updates: Partial<typeof performanceSettings.compression>) => {
    onPerformanceSettingsChange({
      ...performanceSettings,
      compression: { ...performanceSettings.compression, ...updates }
    });
  };

  const updateOptimization = (updates: Partial<typeof performanceSettings.optimization>) => {
    onPerformanceSettingsChange({
      ...performanceSettings,
      optimization: { ...performanceSettings.optimization, ...updates }
    });
  };

  return (
    <div className="space-y-6">
      {/* Async Processing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Async Processing
          </CardTitle>
          <CardDescription>Enable background processing for OCR, antivirus scanning, and indexing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Async Processing</Label>
              <p className="text-sm text-muted-foreground">
                Process OCR, AV scans, and indexing in the background
              </p>
            </div>
            <Switch
              checked={performanceSettings.asyncProcessingEnabled}
              onCheckedChange={(checked) => onPerformanceSettingsChange({
                ...performanceSettings,
                asyncProcessingEnabled: checked
              })}
            />
          </div>

          {performanceSettings.asyncProcessingEnabled && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label>Max Concurrent Jobs</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    min={1}
                    max={32}
                    value={performanceSettings.maxConcurrentJobs}
                    onChange={(e) => onPerformanceSettingsChange({
                      ...performanceSettings,
                      maxConcurrentJobs: Math.max(1, Math.min(32, parseInt(e.target.value) || 4))
                    })}
                    className="w-24"
                  />
                  <p className="text-sm text-muted-foreground">
                    Number of background jobs that run simultaneously (1-32)
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Caching Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Caching
          </CardTitle>
          <CardDescription>Configure caching to improve response times</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Caching</Label>
              <p className="text-sm text-muted-foreground">
                Cache frequently accessed data
              </p>
            </div>
            <Switch
              checked={performanceSettings.caching.enabled}
              onCheckedChange={(checked) => updateCaching({ enabled: checked })}
            />
          </div>

          {performanceSettings.caching.enabled && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Cache Type</Label>
                  <Select
                    value={performanceSettings.caching.type}
                    onValueChange={(value) => updateCaching({ type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LRU">LRU (Least Recently Used)</SelectItem>
                      <SelectItem value="LFU">LFU (Least Frequently Used)</SelectItem>
                      <SelectItem value="FIFO">FIFO (First In First Out)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>TTL (seconds)</Label>
                  <Input
                    type="number"
                    value={performanceSettings.caching.ttl}
                    onChange={(e) => updateCaching({ ttl: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Memory</Label>
                  <Input
                    value={performanceSettings.caching.maxMemory}
                    onChange={(e) => updateCaching({ maxMemory: e.target.value })}
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Indexing Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Indexing
          </CardTitle>
          <CardDescription>Configure search indexing engine and settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Indexing</Label>
              <p className="text-sm text-muted-foreground">
                Index documents for faster search
              </p>
            </div>
            <Switch
              checked={performanceSettings.indexing.enabled}
              onCheckedChange={(checked) => updateIndexing({ enabled: checked })}
            />
          </div>

          {performanceSettings.indexing.enabled && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Search Engine</Label>
                  <Select
                    value={performanceSettings.indexing.engine}
                    onValueChange={(value) => updateIndexing({ engine: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="elasticsearch">Elasticsearch</SelectItem>
                      <SelectItem value="solr">Apache Solr</SelectItem>
                      <SelectItem value="lucene">Lucene</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Batch Size</Label>
                  <Input
                    type="number"
                    value={performanceSettings.indexing.batchSize}
                    onChange={(e) => updateIndexing({ batchSize: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Index Interval (seconds)</Label>
                  <Input
                    type="number"
                    value={performanceSettings.indexing.interval}
                    onChange={(e) => updateIndexing({ interval: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Compression Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Compression
          </CardTitle>
          <CardDescription>Configure data compression settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Compression</Label>
              <p className="text-sm text-muted-foreground">
                Compress data to reduce storage and bandwidth
              </p>
            </div>
            <Switch
              checked={performanceSettings.compression.enabled}
              onCheckedChange={(checked) => updateCompression({ enabled: checked })}
            />
          </div>

          {performanceSettings.compression.enabled && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Algorithm</Label>
                  <Select
                    value={performanceSettings.compression.algorithm}
                    onValueChange={(value) => updateCompression({ algorithm: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gzip">Gzip</SelectItem>
                      <SelectItem value="brotli">Brotli</SelectItem>
                      <SelectItem value="lz4">LZ4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Compression Level (1-9)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="9"
                    value={performanceSettings.compression.level}
                    onChange={(e) => updateCompression({ level: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Threshold (bytes)</Label>
                  <Input
                    type="number"
                    value={performanceSettings.compression.threshold}
                    onChange={(e) => updateCompression({ threshold: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Optimization Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Optimization
          </CardTitle>
          <CardDescription>Configure performance optimization features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Lazy Loading</Label>
                <p className="text-sm text-muted-foreground">
                  Load content on demand
                </p>
              </div>
              <Switch
                checked={performanceSettings.optimization.lazyLoading}
                onCheckedChange={(checked) => updateOptimization({ lazyLoading: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Image Optimization</Label>
                <p className="text-sm text-muted-foreground">
                  Optimize images automatically
                </p>
              </div>
              <Switch
                checked={performanceSettings.optimization.imageOptimization}
                onCheckedChange={(checked) => updateOptimization({ imageOptimization: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>CDN Enabled</Label>
                <p className="text-sm text-muted-foreground">
                  Use Content Delivery Network
                </p>
              </div>
              <Switch
                checked={performanceSettings.optimization.cdnEnabled}
                onCheckedChange={(checked) => updateOptimization({ cdnEnabled: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Preload Critical Resources</Label>
                <p className="text-sm text-muted-foreground">
                  Preload critical assets
                </p>
              </div>
              <Switch
                checked={performanceSettings.optimization.preloadCritical}
                onCheckedChange={(checked) => updateOptimization({ preloadCritical: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
