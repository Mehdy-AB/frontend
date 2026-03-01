'use client';

import React from 'react';
import { Search, TestTube, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            {/* Left side - Search & Filters */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                {/* Search */}
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none" />
                    <Input
                        type="text"
                        placeholder="Search servers, hostnames..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-10 h-9"
                        aria-label="Search LDAP servers"
                    />
                </div>

                {/* Type Filter */}
                <Select value={selectedType} onValueChange={onTypeChange}>
                    <SelectTrigger className="w-[150px] h-9" aria-label="Filter by server type">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {SERVER_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                                {type.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Status Filter */}
                <Select value={selectedStatus} onValueChange={onStatusChange}>
                    <SelectTrigger className="w-[140px] h-9" aria-label="Filter by status">
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

                {/* Security Filter */}
                <Select value={selectedSecurity} onValueChange={onSecurityChange}>
                    <SelectTrigger className="w-[140px] h-9" aria-label="Filter by security">
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

            {/* Right side - Selection counter & bulk actions */}
            <div className="flex items-center gap-2 shrink-0">
                {selectedCount > 0 ? (
                    <>
                        <span className="text-sm font-medium text-primary">
                            {selectedCount} selected
                        </span>
                        <div className="h-4 w-px bg-border mx-1" />
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5 text-xs"
                            onClick={onBulkTest}
                        >
                            <TestTube className="h-3.5 w-3.5" />
                            Test All
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            className="h-8 gap-1.5 text-xs"
                            onClick={onBulkDelete}
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                        </Button>
                    </>
                ) : (
                    <span className="text-sm text-muted-foreground">0 selected</span>
                )}
            </div>
        </div>
    );
}
