'use client';

import { Suspense } from 'react';
import AdvancedUploadPage from '@/components/upload/AdvancedUploadPage';

interface PageProps {
    params: Promise<{ folderId: string }>;
}

export default async function UploadPage({ params }: PageProps) {
    const { folderId } = await params;
    const folderIdNum = parseInt(folderId, 10);

    if (isNaN(folderIdNum)) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-red-500">Invalid folder ID</div>
            </div>
        );
    }

    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        }>
            <AdvancedUploadPage folderId={folderIdNum} />
        </Suspense>
    );
}
