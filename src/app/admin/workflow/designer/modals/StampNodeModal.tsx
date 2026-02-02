'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Stamp, Search, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { stampService } from '@/api/services/stampService';
import { StampResponse } from '@/types/api';
import Pagination from '@/components/main/Pagination';
import { WorkflowNodeData } from '../nodes/types';

interface StampNodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    nodeData: WorkflowNodeData;
    onSave: (updatedData: Partial<WorkflowNodeData>) => void;
}

export default function StampNodeModal({ isOpen, onClose, nodeData, onSave }: StampNodeModalProps) {
    const [stamps, setStamps] = useState<StampResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [selectedStamp, setSelectedStamp] = useState<StampResponse | null>(null);
    const pageSize = 12;

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);
            setCurrentPage(0);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Load stamps
    const loadStamps = useCallback(async () => {
        setLoading(true);
        try {
            const response = debouncedQuery
                ? await stampService.searchStamps(debouncedQuery, currentPage, pageSize)
                : await stampService.getAllStamps(currentPage, pageSize, undefined, undefined, undefined, true);

            setStamps(response.content);
            setTotalPages(response.totalPages);
            setTotalElements(response.totalElements);
        } catch (error) {
            console.error('Failed to load stamps:', error);
        } finally {
            setLoading(false);
        }
    }, [debouncedQuery, currentPage]);

    useEffect(() => {
        if (isOpen) {
            loadStamps();
        }
    }, [isOpen, loadStamps]);

    // Initialize selected stamp from nodeData
    useEffect(() => {
        if (isOpen && nodeData.stampId) {
            // Find and set the selected stamp if it's in the current list
            const existingStamp = stamps.find(s => s.id === nodeData.stampId);
            if (existingStamp) {
                setSelectedStamp(existingStamp);
            }
        }
    }, [isOpen, nodeData.stampId, stamps]);

    const handleSave = () => {
        if (selectedStamp) {
            onSave({
                stampId: selectedStamp.id,
                stampName: selectedStamp.name,
                stampPreviewUrl: selectedStamp.imageUrl,
            });
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-indigo-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
                            <Stamp className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Select Stamp</h3>
                            <p className="text-sm text-gray-500">Choose a stamp to apply to the document</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl hover:bg-gray-200 flex items-center justify-center transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Search stamps..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                        </div>
                    ) : stamps.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Stamp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>No stamps found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                            {stamps.map((stamp) => (
                                <button
                                    key={stamp.id}
                                    onClick={() => setSelectedStamp(stamp)}
                                    className={`relative p-3 rounded-xl border-2 transition-all hover:shadow-md ${selectedStamp?.id === stamp.id
                                        ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200'
                                        : 'border-gray-200 hover:border-indigo-300'
                                        }`}
                                >
                                    {selectedStamp?.id === stamp.id && (
                                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                                            <Check className="w-4 h-4 text-white" />
                                        </div>
                                    )}
                                    <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                                        {stamp.imageUrl ? (
                                            <img
                                                src={stamp.imageUrl}
                                                alt={stamp.name}
                                                className="w-full h-full object-contain"
                                            />
                                        ) : (
                                            <Stamp className="w-8 h-8 text-gray-400" />
                                        )}
                                    </div>
                                    <p className="text-sm font-medium text-center truncate">{stamp.name}</p>
                                    {stamp.category && (
                                        <p className="text-xs text-gray-500 text-center truncate">{stamp.category}</p>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="border-t p-4">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalElements={totalElements}
                            pageSize={pageSize}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}

                {/* Selected Preview */}
                {selectedStamp && (
                    <div className="border-t p-4 bg-indigo-50">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center border">
                                {selectedStamp.imageUrl ? (
                                    <img
                                        src={selectedStamp.imageUrl}
                                        alt={selectedStamp.name}
                                        className="w-14 h-14 object-contain"
                                    />
                                ) : (
                                    <Stamp className="w-8 h-8 text-gray-400" />
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold">{selectedStamp.name}</p>
                                <p className="text-sm text-gray-500">{selectedStamp.category || 'Uncategorized'}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={!selectedStamp}
                        className="bg-indigo-500 hover:bg-indigo-600"
                    >
                        Apply Stamp
                    </Button>
                </div>
            </div>
        </div>
    );
}
