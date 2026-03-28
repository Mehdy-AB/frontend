// app/secured-spaces/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    ShieldCheck, Search, RefreshCw, Filter,
    AlertTriangle, Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { workspaceService, WorkspaceDto } from '@/api/services/workspaceService';
import { WorkspaceCard } from '@/components/workspace';
import Pagination from '@/components/main/Pagination';

type SortOption = 'name-asc' | 'name-desc' | 'createdAt-desc' | 'createdAt-asc' | 'updatedAt-desc';

export default function SecuredSpacesPage() {
    const router = useRouter();
    const [workspaces, setWorkspaces] = useState<WorkspaceDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOption, setSortOption] = useState<SortOption>('name-asc');
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(20);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchSecuredSpaces = useCallback(async () => {
        setLoading(true);
        try {
            const [sortField, sortDir] = sortOption.split('-');
            const response = await workspaceService.searchWorkspaces({
                page, size: pageSize, sort: `${sortField},${sortDir}`,
                search: searchQuery || undefined, type: 'SECURED',
            });
            setWorkspaces(response.content);
            setTotalPages(response.totalPages);
            setTotalElements(response.totalElements);
        } catch (error) {
            console.error('Failed to fetch secured spaces:', error);
        } finally { setLoading(false); }
    }, [page, pageSize, sortOption, searchQuery]);

    useEffect(() => { fetchSecuredSpaces(); }, [fetchSecuredSpaces]);
    useEffect(() => { setPage(0); }, [sortOption, searchQuery]);

    const handleRefresh = async () => { setIsRefreshing(true); await fetchSecuredSpaces(); setIsRefreshing(false); };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="space-y-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-gray-100">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                                <ShieldCheck className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Secured Spaces</h1>
                                <p className="text-gray-500 text-sm font-medium">High-sensitivity workspaces with stricter access controls</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col px-4 py-2 bg-white rounded-xl border border-gray-100 shadow-sm min-w-[120px]">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Secured</span>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                                <span className="text-xl font-bold text-gray-900">{totalElements || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Security Notice */}
                <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-medium text-blue-800">Enhanced Security Zone</p>
                        <p className="text-xs text-blue-600">Secured spaces enforce stricter policies: break-glass access, mandatory audit trails, and restricted external sharing.</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing || loading}
                        className="h-10 px-4 border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors rounded-xl">
                        <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />Refresh
                    </Button>
                    <Button onClick={() => router.push('/workspaces')} variant="outline"
                        className="h-10 px-4 border-blue-200 text-blue-600 hover:bg-blue-50 rounded-xl">
                        <Globe className="h-4 w-4 mr-2" />View All Workspaces
                    </Button>
                </div>
            </div>

            {/* Search and Sort */}
            <div className="flex flex-col lg:flex-row gap-4 p-1">
                <div className="flex-1 flex gap-4 p-1.5 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search secured spaces..." className="h-11 pl-10 border-0 bg-transparent focus-visible:ring-0 text-base placeholder:text-gray-400" />
                    </div>
                    <div className="w-px bg-gray-200 my-2"></div>
                    <div className="flex items-center gap-2 pr-2">
                        <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
                            <SelectTrigger className="w-[160px] h-9 border-0 bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium focus:ring-0 transition-colors rounded-xl">
                                <div className="flex items-center gap-2"><Filter className="h-3.5 w-3.5" /><SelectValue /></div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="name-asc">Name A-Z</SelectItem>
                                <SelectItem value="name-desc">Name Z-A</SelectItem>
                                <SelectItem value="createdAt-desc">Newest First</SelectItem>
                                <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                                <SelectItem value="updatedAt-desc">Recently Updated</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Cards — using WorkspaceCard component */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <Card key={i} className="animate-pulse"><CardContent className="p-6">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div><div className="h-3 bg-gray-100 rounded w-1/2 mb-6"></div><div className="h-3 bg-gray-100 rounded w-full"></div>
                        </CardContent></Card>
                    ))}
                </div>
            ) : workspaces.length === 0 ? (
                <Card className="flex flex-col items-center justify-center py-16"><CardContent className="text-center">
                    <div className="h-16 w-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><ShieldCheck className="h-8 w-8 text-blue-400" /></div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No secured spaces found</h3>
                    <p className="text-gray-500 mb-6 max-w-sm">{searchQuery ? `No secured spaces match "${searchQuery}"` : 'No secured workspaces exist yet. Create one from the Workspaces page.'}</p>
                </CardContent></Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {workspaces.map(ws => <WorkspaceCard key={ws.id} workspace={ws} />)}
                </div>
            )}

            <Pagination totalPages={totalPages} currentPage={page} totalElements={totalElements} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
        </div>
    );
}
