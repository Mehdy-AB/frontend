// components/document/ModelsTab.tsx
'use client';

import { DocumentViewDto } from '../../types/documentView';
import { formatDate } from '../../utils/documentUtils';

interface ModelsTabProps {
  document: DocumentViewDto;
  isLoading: boolean;
}

export default function ModelsTab({ document, isLoading }: ModelsTabProps) {
  if (isLoading) {
    return (
      <div className="p-4 space-y-6">
        <div className="animate-pulse">
          <div className="h-6 bg-neutral-ui rounded w-32 mb-4"></div>
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="p-3 border border-ui rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div className="space-y-2">
                    <div className="h-4 bg-neutral-ui rounded w-24"></div>
                    <div className="h-3 bg-neutral-ui rounded w-16"></div>
                  </div>
                  <div className="h-6 bg-neutral-ui rounded w-12"></div>
                </div>
                <div className="h-4 bg-neutral-ui rounded w-full mb-2"></div>
                <div className="flex justify-between">
                  <div className="h-3 bg-neutral-ui rounded w-20"></div>
                  <div className="h-3 bg-neutral-ui rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div>
        <h3 className="font-medium text-neutral-text-dark mb-3">AI Models Applied</h3>
        <div className="space-y-3">
          {document.aiModels?.map((model) => (
            <div key={model.id} className="p-3 border border-ui rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-medium text-neutral-text-dark">{model.name}</div>
                  <div className="text-xs text-neutral-text-light">{model.provider} v{model.version}</div>
                </div>
                <span className="px-2 py-1 bg-primary/20 text-primary rounded text-xs">
                  {(model.accuracy * 100).toFixed(1)}%
                </span>
              </div>
              <div className="text-sm text-neutral-text-light mb-2">{model.purpose}</div>
              <div className="flex justify-between text-xs text-neutral-text-light">
                <span>Last used: {formatDate(model.lastUsed)}</span>
                <button className="text-primary hover:text-primary-dark">View Results</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Model Suggestions */}
      <div>
        <h3 className="font-medium text-neutral-text-dark mb-3">Suggested Models</h3>
        <div className="space-y-2 text-sm">
          <div className="p-2 border border-ui rounded hover:bg-neutral-background cursor-pointer">
            <div className="font-medium">Content Summarization</div>
            <div className="text-xs text-neutral-text-light">Generate executive summary</div>
          </div>
          <div className="p-2 border border-ui rounded hover:bg-neutral-background cursor-pointer">
            <div className="font-medium">Entity Recognition</div>
            <div className="text-xs text-neutral-text-light">Extract people, dates, companies</div>
          </div>
          <div className="p-2 border border-ui rounded hover:bg-neutral-background cursor-pointer">
            <div className="font-medium">Similarity Search</div>
            <div className="text-xs text-neutral-text-light">Find related documents</div>
          </div>
        </div>
      </div>
    </div>
  );
}
