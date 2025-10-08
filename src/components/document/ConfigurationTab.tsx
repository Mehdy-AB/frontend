// components/document/ConfigurationTab.tsx
'use client';

import { 
  Info, 
  Settings, 
  Copy, 
  Share2, 
  MessageSquare, 
  Star,
  Globe,
  Lock
} from 'lucide-react';
import { DocumentViewDto } from '../../types/documentView';
import { formatFileSize, formatDate } from '../../utils/documentUtils';

interface ConfigurationTabProps {
  document: DocumentViewDto;
  isLoading: boolean;
  onCopyLink: () => void;
  onShare: () => void;
  onToggleFavorite: () => void;
  isFavorite: boolean;
}

export default function ConfigurationTab({ 
  document, 
  isLoading, 
  onCopyLink, 
  onShare, 
  onToggleFavorite, 
  isFavorite 
}: ConfigurationTabProps) {
  if (isLoading) {
    return (
      <div className="p-4 space-y-6">
        <div className="animate-pulse">
          <div className="h-6 bg-neutral-ui rounded w-32 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 bg-neutral-ui rounded w-20"></div>
                <div className="h-4 bg-neutral-ui rounded w-24"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Basic Info */}
      <div>
        <h3 className="font-medium text-neutral-text-dark mb-3 flex items-center gap-2">
          <Info className="h-4 w-4" />
          Document Information
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-neutral-text-light">File Name:</span>
            <span className="text-neutral-text-dark font-medium">{document.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-text-light">File Size:</span>
            <span className="text-neutral-text-dark font-medium">{formatFileSize(document.sizeBytes)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-text-light">MIME Type:</span>
            <span className="text-neutral-text-dark font-medium">{document.mimeType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-text-light">Version:</span>
            <span className="text-neutral-text-dark font-medium">v{document.versionNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-text-light">Visibility:</span>
            <span className="flex items-center gap-1">
              {document.isPublic ? (
                <>
                  <Globe className="h-3 w-3 text-success" />
                  <span className="text-success">Public</span>
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3 text-neutral-text-light" />
                  <span className="text-neutral-text-dark">Private</span>
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Model Configurations */}
      <div>
        <h3 className="font-medium text-neutral-text-dark mb-3 flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Model Configurations
        </h3>
        <div className="space-y-3">
          {document.modelConfigurations?.map((config) => (
            <div key={config.id} className="p-3 border border-ui rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <span className="font-medium text-neutral-text-dark">{config.name}</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  config.status === 'active' ? 'bg-success/20 text-success' :
                  config.status === 'processing' ? 'bg-warning/20 text-warning' :
                  'bg-neutral-ui text-neutral-text-light'
                }`}>
                  {config.status}
                </span>
              </div>
              <div className="flex justify-between text-sm text-neutral-text-light">
                <span>Confidence: {(config.confidence * 100).toFixed(1)}%</span>
                <span>{formatDate(config.lastRun)}</span>
              </div>
              <button className="w-full mt-2 text-xs text-primary hover:text-primary-dark text-center py-1">
                Configure
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="font-medium text-neutral-text-dark mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={onCopyLink}
            className="p-2 border border-ui rounded text-xs hover:bg-neutral-background transition-colors"
          >
            <Copy className="h-4 w-4 mx-auto mb-1" />
            Copy Link
          </button>
          <button 
            onClick={onShare}
            className="p-2 border border-ui rounded text-xs hover:bg-neutral-background transition-colors"
          >
            <Share2 className="h-4 w-4 mx-auto mb-1" />
            Manage Permissions
          </button>
          <button 
            onClick={onToggleFavorite}
            className={`p-2 border rounded text-xs transition-colors ${
              isFavorite 
                ? 'border-warning bg-warning/10 text-warning' 
                : 'border-ui hover:bg-neutral-background'
            }`}
          >
            <Star className={`h-4 w-4 mx-auto mb-1 ${isFavorite ? 'fill-current' : ''}`} />
            {isFavorite ? 'Favorited' : 'Add to Favorites'}
          </button>
        </div>
      </div>
    </div>
  );
}
