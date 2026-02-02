'use client';

import React, { useState, useEffect } from 'react';
import { Stamp, Search, Loader2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { stampService } from '@/api/services/stampService';
import { StampResponse } from '@/types/api';

interface StampSelectorProps {
    onSelectStamp: (stamp: StampResponse) => void;
    disabled?: boolean;
}

export default function StampSelector({ onSelectStamp, disabled }: StampSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [stamps, setStamps] = useState<StampResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (isOpen && stamps.length === 0) {
            fetchStamps();
        }
    }, [isOpen]);

    const fetchStamps = async () => {
        setLoading(true);
        try {
            const response = await stampService.getAllStamps(0, 50, undefined, undefined, undefined, true);
            setStamps(response.content);
        } catch (error) {
            console.error('Failed to fetch stamps:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredStamps = stamps.filter(stamp =>
        stamp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (stamp.content && stamp.content.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const renderStampPreview = (stamp: StampResponse) => {
        if (stamp.stampType === 'TEXT') {
            return (
                <div
                    className="inline-flex items-center justify-center px-2 py-1 rounded border text-xs font-bold"
                    style={{
                        color: stamp.color || '#000',
                        backgroundColor: stamp.backgroundColor || 'transparent',
                        borderColor: stamp.borderColor || '#000',
                        fontSize: '10px',
                        maxWidth: '100px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {stamp.content || stamp.name}
                </div>
            );
        } else if (stamp.stampType === 'IMAGE' && stamp.imageUrl) {
            return (
                <img
                    src={stamp.imageUrl}
                    alt={stamp.name}
                    className="w-8 h-8 object-contain rounded"
                />
            );
        }
        return <Stamp className="w-6 h-6 text-muted-foreground" />;
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={disabled}
                    className="gap-2"
                >
                    <Stamp className="w-4 h-4" />
                    Add Stamp
                    <ChevronDown className="w-3 h-3" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
                <div className="p-3 border-b">
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search stamps..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8 h-8"
                        />
                    </div>
                </div>

                <div className="h-[300px] overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-full py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                    ) : filteredStamps.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <Stamp className="w-10 h-10 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">
                                {searchQuery ? 'No stamps found' : 'No active stamps available'}
                            </p>
                        </div>
                    ) : (
                        <div className="p-2 space-y-1">
                            {filteredStamps.map((stamp) => (
                                <button
                                    key={stamp.id}
                                    onClick={() => {
                                        onSelectStamp(stamp);
                                        setIsOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left"
                                >
                                    <div className="flex-shrink-0">
                                        {renderStampPreview(stamp)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">{stamp.name}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <Badge variant="secondary" className="text-xs">
                                                {stamp.stampType}
                                            </Badge>
                                            {stamp.category && (
                                                <Badge variant="outline" className="text-xs">
                                                    {stamp.category}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
