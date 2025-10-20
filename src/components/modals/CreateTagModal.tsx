'use client';

import { useState } from 'react';
import { X, Tag, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface CreateTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTag: (tagData: { name: string; description?: string; color?: string }) => Promise<void>;
}

export default function CreateTagModal({ isOpen, onClose, onCreateTag }: CreateTagModalProps) {
  const [tagName, setTagName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3B82F6'); // Default blue color
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const predefinedColors = [
    '#3B82F6', // Blue
    '#EF4444', // Red
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#6B7280', // Gray
    '#14B8A6', // Teal
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tagName.trim()) {
      setError('Tag name is required');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      await onCreateTag({
        name: tagName.trim(),
        description: description.trim() || undefined,
        color: color,
      });
      
      // Reset form
      setTagName('');
      setDescription('');
      setColor('#3B82F6');
      onClose();
    } catch (error) {
      setError('Failed to create tag. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setTagName('');
      setDescription('');
      setColor('#3B82F6');
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Create New Tag</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isCreating}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Tag Name */}
          <div>
            <label htmlFor="tagName" className="block text-sm font-medium text-gray-700 mb-1">
              Tag Name *
            </label>
            <Input
              id="tagName"
              type="text"
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              placeholder="Enter tag name..."
              disabled={isCreating}
              className="w-full"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <Input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter tag description (optional)..."
              disabled={isCreating}
              className="w-full"
            />
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
            <div className="flex items-center gap-3">
              <div className="flex gap-2 flex-wrap">
                {predefinedColors.map((colorOption) => (
                  <button
                    key={colorOption}
                    type="button"
                    onClick={() => setColor(colorOption)}
                    disabled={isCreating}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      color === colorOption
                        ? 'border-gray-400 scale-110'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={{ backgroundColor: colorOption }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Custom:</span>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  disabled={isCreating}
                  className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <div
              className="w-4 h-4 rounded-full border border-gray-300"
              style={{ backgroundColor: color }}
            />
            <span className="text-sm font-medium text-gray-700">{tagName || 'Tag Name'}</span>
            {description && (
              <span className="text-xs text-gray-500">- {description}</span>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isCreating}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isCreating || !tagName.trim()}
              className="flex-1"
            >
              {isCreating ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Tag
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
