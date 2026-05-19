'use client';

import React from 'react';
import { Search, TestTube, Trash2, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { SERVER_TYPES, STATUS_OPTIONS, SECURITY_OPTIONS } from './ldap-types';

interface LdapToolbarProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    selectedType: string;
    onTypeChange: (value: string) => void;
    selectedStatus: string;
    onStatusChange: (value: string) => void;
    selectedSecurity: string;
    onSecurityChange: (value: string) => void;
    selectedCount: number;
    onBulkDelete: () => void;
    onBulkTest: () => void;
}

export default function LdapToolbar({
    searchQuery,
    onSearchChange,
    selectedType,
    onTypeChange,
    selectedStatus,
    onStatusChange,
    selectedSecurity,
    onSecurityChange,
    selectedCount,
    onBulkDelete,
    onBulkTest,
}: LdapToolbarProps) {
    return (
        <div className="flex flex-col lg:flex-row gap-4">
            {/* Unified Search + Filter Container */}
            <div className="flex-1 flex gap-4 p-1.5 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="Search servers, hostnames, descriptions..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="h-11 pl-10 border-0 bg-transparent focus-visible:ring-0 text-base placeholder:text-gray-400"
                        aria-label="Search LDAP servers"
                    />
                </div>
                <div className="w-px bg-gray-200 my-2" />
                <div className="flex items-center gap-2 pr-2">
                    <Select value={selectedType} onValueChange={onTypeChange}>
                        <SelectTrigger
                            className="w-[130px] h-9 border-0 bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium focus:ring-0 transition-colors rounded-xl"
                            aria-label="Filter by server type"
                        >
                            <div className="flex items-center gap-2">
                                <Filter className="h-3.5 w-3.5" />
                                <SelectValue />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            {SERVER_TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={selectedStatus} onValueChange={onStatusChange}>
                        <SelectTrigger
                            className="w-[120px] h-9 border-0 bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium focus:ring-0 transition-colors rounded-xl"
                            aria-label="Filter by status"
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {STATUS_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={selectedSecurity} onValueChange={onSecurityChange}>
                        <SelectTrigger
                            className="w-[120px] h-9 border-0 bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium focus:ring-0 transition-colors rounded-xl"
                            aria-label="Filter by security"
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {SECURITY_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Bulk actions */}
            {selectedCount > 0 && (
                <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="secondary" className="bg-violet-100 text-violet-700 text-xs font-semibold px-3 py-1 rounded-full">
                        {selectedCount} selected
                    </Badge>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9 gap-1.5 text-xs rounded-xl border-gray-200"
                        onClick={onBulkTest}
                    >
                        <TestTube className="h-3.5 w-3.5" />
                        Test All
                    </Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        className="h-9 gap-1.5 text-xs rounded-xl"
                        onClick={onBulkDelete}
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                    </Button>
                </div>
            )}
        </div>
    );
}
