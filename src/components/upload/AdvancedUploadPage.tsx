'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    Upload,
    X,
    File,
    FileText,
    Image,
    Video,
    Music,
    ChevronLeft,
    ChevronRight,
    Plus,
    Trash2,
    Check,
    AlertCircle,
    Database,
    ScanLine,
    Type,
    FileSearch,
    Settings,
    ArrowLeft,
    Loader2
} from 'lucide-react';
import { notificationApiClient } from '@/api/notificationClient';
import { tagService } from '@/api/services/tagService';
import { folderService } from '@/api/services/folderService';
import { useNotifications } from '@/hooks/useNotifications';
import FileViewer from '@/components/viewers/FileViewer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    FilingCategoryResponseDto,
    CategoryMetadataDefinitionDto,
    ExtractorLanguage,
    TagResponseDto,
    MetadataType,
    FolderResDto
} from '@/types/api';
import { SearchSelect } from '@/components/main/SearchSelect';
import { renderFileToCanvas } from '@/utils/pdfToCanvas';
import { apiClient } from '@/api/client';

// ============================================================================
// Types
// ============================================================================

type MetadataSource = 'manual' | 'filename' | 'mysql' | 'zonal-ocr';

interface MetadataValue {
    value: string;
    source: MetadataSource;
    zone?: { x: number; y: number; width: number; height: number; page?: number };
    mysqlColumn?: string;
}

interface FileWithConfig {
    file: File;
    name: string;
    title: string;
    description: string;
    tags: TagResponseDto[];
    language: ExtractorLanguage;
    metadata: Record<string, MetadataValue>;
    metadataErrors: Record<string, string>;
    isValid: boolean;
    previewUrl?: string;
}

interface MySQLConnection {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    isConnected: boolean;
    tables: string[];
    selectedTable: string;
    columns: string[];
    idColumn: string;
    columnMapping: Record<string, string>; // metadataKey -> columnName
}

interface AdvancedUploadPageProps {
    folderId: number;
}

// ============================================================================
// Constants
// ============================================================================

const SUPPORTED_LANGUAGES = [
    { value: 'ENG', label: 'English' },
    { value: 'FRA', label: 'French' },
    { value: 'ARA', label: 'Arabic' }
];

const getFileIcon = (file: File, size: string = 'h-8 w-8') => {
    const type = file.type;
    if (type.startsWith('image/')) return <Image className={`${size} text-blue-500`} />;
    if (type.startsWith('video/')) return <Video className={`${size} text-purple-500`} />;
    if (type.startsWith('audio/')) return <Music className={`${size} text-green-500`} />;
    if (type.includes('pdf') || type.includes('document')) return <FileText className={`${size} text-red-500`} />;
    return <File className={`${size} text-gray-500`} />;
};

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getSourceBadge = (source: MetadataSource) => {
    switch (source) {
        case 'manual':
            return { icon: Type, label: 'Manual', color: 'bg-gray-100 text-gray-700' };
        case 'filename':
            return { icon: FileSearch, label: 'Filename', color: 'bg-blue-100 text-blue-700' };
        case 'mysql':
            return { icon: Database, label: 'MySQL', color: 'bg-green-100 text-green-700' };
        case 'zonal-ocr':
            return { icon: ScanLine, label: 'OCR Zone', color: 'bg-purple-100 text-purple-700' };
    }
};

// ============================================================================
// Main Component
// ============================================================================

export default function AdvancedUploadPage({ folderId }: AdvancedUploadPageProps) {
    const router = useRouter();
    const { showWarning, showError, showSuccess } = useNotifications();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Files state
    const [files, setFiles] = useState<FileWithConfig[]>([]);
    const [selectedFileIndex, setSelectedFileIndex] = useState(0);
    const [dragActive, setDragActive] = useState(false);

    // Global settings (shared across all files)
    const [language, setLanguage] = useState<ExtractorLanguage>('ENG' as ExtractorLanguage);
    const [filingCategory, setFilingCategory] = useState<FilingCategoryResponseDto | null>(null);
    const [filingCategories, setFilingCategories] = useState<FilingCategoryResponseDto[]>([]);
    const [tags, setTags] = useState<TagResponseDto[]>([]);
    const [availableTags, setAvailableTags] = useState<TagResponseDto[]>([]);

    // Folder info
    const [folder, setFolder] = useState<FolderResDto | null>(null);
    const [folderName, setFolderName] = useState<string>('');

    // Loading states
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, percentage: 0 });

    // MySQL state
    const [mysqlConnection, setMysqlConnection] = useState<MySQLConnection>({
        host: '',
        port: 3306,
        database: '',
        username: '',
        password: '',
        isConnected: false,
        tables: [],
        selectedTable: '',
        columns: [],
        idColumn: '',
        columnMapping: {}
    });
    const [showMySQLPanel, setShowMySQLPanel] = useState(false);

    // Zonal OCR state
    const [ocrActiveField, setOcrActiveField] = useState<string | null>(null);
    const [isDrawingZone, setIsDrawingZone] = useState(false);
    const [zoneStart, setZoneStart] = useState<{ x: number; y: number } | null>(null);
    const [currentZone, setCurrentZone] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
    const [ocrProcessing, setOcrProcessing] = useState(false);
    const previewContainerRef = useRef<HTMLDivElement>(null);

    // Filename extraction state
    const [separator, setSeparator] = useState('#');
    const [filenameFieldOrder, setFilenameFieldOrder] = useState<string[]>([]);

    // ============================================================================
    // Helper Functions
    // ============================================================================

    // Calculate metadata completion percentage for a file
    const calculateMetadataCompletion = (file: FileWithConfig): { filled: number; total: number; percentage: number } => {
        if (!filingCategory?.metadataDefinitions) return { filled: 0, total: 0, percentage: 0 };

        const total = filingCategory.metadataDefinitions.length;
        const filled = filingCategory.metadataDefinitions.filter(def => {
            const metaValue = file.metadata[def.key];
            return metaValue && metaValue.value && metaValue.value.trim() !== '';
        }).length;

        const percentage = total > 0 ? Math.round((filled / total) * 100) : 0;
        return { filled, total, percentage };
    };

    // Generate filename from category's nameStructure pattern
    const generateFileName = (file: FileWithConfig): string => {
        if (!filingCategory?.nameStructure) return file.name;

        let generatedName = filingCategory.nameStructure;

        // Replace {metadataKey} placeholders with actual values
        generatedName = generatedName.replace(/{(\w+)}/g, (match, key) => {
            const metaValue = file.metadata[key];
            return metaValue && metaValue.value ? metaValue.value : match;
        });

        return generatedName;
    };

    // Update all filenames based on current metadata
    const updateAllFileNames = () => {
        if (!filingCategory?.nameStructure) return;

        setFiles(prev => prev.map(file => ({
            ...file,
            name: generateFileName(file)
        })));

        showSuccess('Names Updated', 'All filenames regenerated from metadata');
    };

    // ============================================================================
    // Initial Data Loading
    // ============================================================================

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // Load folder info
                const folderData = await folderService.getFolderById(folderId);
                setFolder(folderData);
                setFolderName(folderData.name);

                // Load filing categories
                setLoadingCategories(true);
                const categoriesResponse = await notificationApiClient.getAllFilingCategories({ size: 100 }, { silent: true });
                setFilingCategories(categoriesResponse.content);

                // Load available tags
                const tagsData = await tagService.getAvailableTags();
                setAvailableTags(tagsData);
            } catch (error) {
                console.error('Error loading initial data:', error);
            } finally {
                setLoadingCategories(false);
            }
        };

        loadInitialData();
    }, [folderId]);

    // ============================================================================
    // File Handling
    // ============================================================================

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFilesSelected(e.dataTransfer.files);
        }
    }, []);

    const handleFilesSelected = (fileList: FileList) => {
        const newFiles: FileWithConfig[] = Array.from(fileList).map(file => {
            const previewUrl = file.type.startsWith('image/') || file.type === 'application/pdf'
                ? URL.createObjectURL(file)
                : undefined;

            return {
                file,
                name: file.name.replace(/\.[^/.]+$/, ''),
                title: file.name.replace(/\.[^/.]+$/, ''),
                description: '',
                tags: [],
                language: language, // Default to global language setting
                metadata: {},
                metadataErrors: {},
                isValid: true,
                previewUrl
            };
        });

        setFiles(prev => [...prev, ...newFiles]);
        if (files.length === 0 && newFiles.length > 0) {
            setSelectedFileIndex(0);
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => {
            const newFiles = prev.filter((_, i) => i !== index);
            if (selectedFileIndex >= newFiles.length) {
                setSelectedFileIndex(Math.max(0, newFiles.length - 1));
            }
            return newFiles;
        });
    };

    const updateFile = (index: number, updates: Partial<FileWithConfig>) => {
        setFiles(prev => prev.map((f, i) => i === index ? { ...f, ...updates } : f));
    };

    const updateFileMetadata = (index: number, key: string, value: MetadataValue) => {
        setFiles(prev => prev.map((f, i) => {
            if (i !== index) return f;
            return {
                ...f,
                metadata: { ...f.metadata, [key]: value }
            };
        }));
    };

    // ============================================================================
    // Category Selection
    // ============================================================================

    const handleCategorySelect = (categoryId: string) => {
        const category = filingCategories.find(c => c.id.toString() === categoryId);
        setFilingCategory(category || null);

        // Reset filename field order when category changes
        if (category?.metadataDefinitions) {
            setFilenameFieldOrder(category.metadataDefinitions.map(d => d.key));
        }

        // Initialize metadata for all files
        if (category) {
            setFiles(prev => prev.map(file => ({
                ...file,
                metadata: category.metadataDefinitions?.reduce((acc, def) => ({
                    ...acc,
                    [def.key]: { value: '', source: 'manual' as MetadataSource }
                }), {}) || {},
                metadataErrors: {}
            })));
        }
    };

    // ============================================================================
    // MySQL Integration
    // ============================================================================

    const [mysqlConnecting, setMysqlConnecting] = useState(false);
    const [mysqlFetching, setMysqlFetching] = useState(false);

    const testMySQLConnection = async () => {
        if (!mysqlConnection.host || !mysqlConnection.database) {
            showWarning('Missing Info', 'Please provide host and database name');
            return;
        }

        try {
            setMysqlConnecting(true);

            // Call backend to test connection and fetch table/column info
            const apiUrl = typeof window !== 'undefined' && (window as any).ENV?.API_URL
                ? (window as any).ENV.API_URL
                : 'http://localhost:8080';

            const response = await fetch(`${apiUrl}/api/v1/mysql/test-connection`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    host: mysqlConnection.host,
                    port: mysqlConnection.port,
                    database: mysqlConnection.database,
                    username: mysqlConnection.username,
                    password: mysqlConnection.password
                })
            });

            if (response.ok) {
                const data = await response.json();
                setMysqlConnection(prev => ({
                    ...prev,
                    isConnected: true,
                    tables: data.tables || []
                }));
                showSuccess('Connected', 'MySQL connection successful');
            } else {
                throw new Error('Connection failed');
            }
        } catch (error: any) {
            showError('Connection Failed', error?.message || 'Could not connect to MySQL');
            setMysqlConnection(prev => ({ ...prev, isConnected: false }));
        } finally {
            setMysqlConnecting(false);
        }
    };

    const fetchTableColumns = async (tableName: string) => {
        try {
            const apiUrl = typeof window !== 'undefined' && (window as any).ENV?.API_URL
                ? (window as any).ENV.API_URL
                : 'http://localhost:8080';

            const response = await fetch(`${apiUrl}/api/v1/mysql/table-columns`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    ...mysqlConnection,
                    tableName
                })
            });

            if (response.ok) {
                const columns = await response.json();
                setMysqlConnection(prev => ({
                    ...prev,
                    selectedTable: tableName,
                    columns: columns
                }));
            }
        } catch (error) {
            console.error('Error fetching columns:', error);
        }
    };

    const applyMySQLDataToAll = async () => {
        if (!mysqlConnection.isConnected || !mysqlConnection.selectedTable || !mysqlConnection.idColumn) {
            showWarning('Incomplete Setup', 'Please configure MySQL connection, table, and ID column');
            return;
        }

        if (Object.keys(mysqlConnection.columnMapping).length === 0) {
            showWarning('No Mapping', 'Please map at least one column to a metadata field');
            return;
        }

        try {
            setMysqlFetching(true);

            const apiUrl = typeof window !== 'undefined' && (window as any).ENV?.API_URL
                ? (window as any).ENV.API_URL
                : 'http://localhost:8080';

            // Fetch data for all files
            const fileIdentifiers = files.map(f => f.name);

            const response = await fetch(`${apiUrl}/api/v1/mysql/fetch-data`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    connection: mysqlConnection,
                    identifiers: fileIdentifiers
                })
            });

            if (response.ok) {
                const dataRows = await response.json();

                // Apply data to files
                setFiles(prev => prev.map(file => {
                    const rowData = dataRows[file.name];
                    if (!rowData) return file;

                    const updatedMetadata = { ...file.metadata };

                    // Map columns to metadata fields
                    Object.entries(mysqlConnection.columnMapping).forEach(([metadataKey, columnName]) => {
                        if (rowData[columnName]) {
                            updatedMetadata[metadataKey] = {
                                value: String(rowData[columnName]),
                                source: 'mysql',
                                mysqlColumn: columnName
                            };
                        }
                    });

                    return { ...file, metadata: updatedMetadata };
                }));

                showSuccess('Data Applied', `MySQL data applied to ${Object.keys(dataRows).length} file(s)`);
            } else {
                throw new Error('Failed to fetch data');
            }
        } catch (error: any) {
            showError('Fetch Failed', error?.message || 'Could not fetch MySQL data');
        } finally {
            setMysqlFetching(false);
        }
    };

    // ============================================================================
    // Filename Extraction
    // ============================================================================

    const extractMetadataFromFilename = (filename: string): Record<string, MetadataValue> => {
        if (!filingCategory?.metadataDefinitions) return {};

        const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
        const parts = nameWithoutExt.split(separator).map(p => p.trim());

        const metadata: Record<string, MetadataValue> = {};
        filenameFieldOrder.forEach((fieldKey, index) => {
            const value = parts[index] || '';
            metadata[fieldKey] = { value, source: 'filename' };
        });

        return metadata;
    };

    const applyFilenameExtractionToAll = () => {
        if (!filingCategory?.metadataDefinitions) {
            showWarning('No category selected', 'Please select a document model first');
            return;
        }

        setFiles(prev => prev.map(file => {
            const extractedMetadata = extractMetadataFromFilename(file.file.name);
            return {
                ...file,
                metadata: { ...file.metadata, ...extractedMetadata }
            };
        }));

        showSuccess('Extraction complete', `Metadata extracted from ${files.length} filename(s)`);
    };

    // ============================================================================
    // Zonal OCR
    // ============================================================================

    const startOCRMode = (fieldKey: string) => {
        setOcrActiveField(fieldKey);
        setIsDrawingZone(true);
        setCurrentZone(null);
        showSuccess('OCR Mode', 'Draw a rectangle on the preview to extract text');
    };

    const cancelOCRMode = () => {
        setOcrActiveField(null);
        setIsDrawingZone(false);
        setCurrentZone(null);
        setZoneStart(null);
    };

    const handlePreviewMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDrawingZone || !previewContainerRef.current) return;

        const rect = previewContainerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setZoneStart({ x, y });
        setCurrentZone({ x, y, width: 0, height: 0 });
    };

    const handlePreviewMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDrawingZone || !zoneStart || !previewContainerRef.current) return;

        const rect = previewContainerRef.current.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;

        setCurrentZone({
            x: Math.min(zoneStart.x, currentX),
            y: Math.min(zoneStart.y, currentY),
            width: Math.abs(currentX - zoneStart.x),
            height: Math.abs(currentY - zoneStart.y)
        });
    };

    const handlePreviewMouseUp = async () => {
        if (!isDrawingZone || !currentZone || !ocrActiveField || !selectedFile) return;

        if (currentZone.width < 10 || currentZone.height < 10) {
            showWarning('Zone too small', 'Please draw a larger rectangle');
            return;
        }

        const fileType = selectedFile.file.type;
        const isPDF = fileType === 'application/pdf';
        const isImage = fileType.startsWith('image/');

        if (!isImage && !isPDF) {
            showError('Unsupported File Type', 'OCR only works with image files (PNG, JPG, etc.) or PDF files');
            cancelOCRMode();
            return;
        }

        try {
            setOcrProcessing(true);

            // Get the preview container dimensions for calculating relative coordinates
            const containerRect = previewContainerRef.current?.getBoundingClientRect();
            if (!containerRect) {
                throw new Error('Preview container not found');
            }

            // For now, we'll use a simple OCR approach
            // Convert zone to relative coordinates (0-100%)
            const relativeZone = {
                x: (currentZone.x / containerRect.width) * 100,
                y: (currentZone.y / containerRect.height) * 100,
                width: (currentZone.width / containerRect.width) * 100,
                height: (currentZone.height / containerRect.height) * 100
            };

            // Render file to canvas (supports both images and PDFs)
            const sourceCanvas = await renderFileToCanvas(selectedFile.file, isPDF);
            const actualX = (relativeZone.x / 100) * sourceCanvas.width;
            const actualY = (relativeZone.y / 100) * sourceCanvas.height;
            const actualWidth = (relativeZone.width / 100) * sourceCanvas.width;
            const actualHeight = (relativeZone.height / 100) * sourceCanvas.height;

            // Create canvas for cropping the zone
            const canvas = document.createElement('canvas');
            canvas.width = actualWidth;
            canvas.height = actualHeight;
            const ctx = canvas.getContext('2d');

            if (ctx) {
                ctx.drawImage(sourceCanvas, actualX, actualY, actualWidth, actualHeight, 0, 0, actualWidth, actualHeight);
                // Convert to blob
                const blob = await new Promise<Blob>((resolve) => {
                    canvas.toBlob((b) => resolve(b!), 'image/png');
                });

                // Send to backend OCR proxy (avoids CORS issues)
                const formData = new FormData();
                formData.append('file', blob, 'zone.png');
                formData.append('lang', language); // Use the selected language


                const text = await apiClient.post<string>('/api/v1/ocr/extract', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                const cleanedText = text.trim();

                // Update the metadata field with OCR result
                updateFileMetadata(selectedFileIndex, ocrActiveField, {
                    value: cleanedText,
                    source: 'zonal-ocr',
                    zone: currentZone
                });

                showSuccess('OCR Complete', `Extracted: "${cleanedText.substring(0, 50)}${cleanedText.length > 50 ? '...' : ''}"`);
            }
        } catch (error: any) {
            console.error('OCR error object:', error);
            const errorMessage = error?.message || 'Could not extract text from the selected zone';
            showError('OCR Failed', errorMessage);
        } finally {
            setOcrProcessing(false);
            cancelOCRMode();
        }
    };

    // ============================================================================
    // Upload
    // ============================================================================

    const handleUpload = async () => {
        if (files.length === 0) {
            showWarning('No files', 'Please select files to upload');
            return;
        }

        try {
            setUploading(true);
            setUploadProgress({ current: 0, total: files.length, percentage: 0 });

            const fileArray = files.map(f => f.file);
            const metadataList = files.map(f => {
                const metaDataDtoArray = filingCategory?.metadataDefinitions
                    ?.filter(def => f.metadata[def.key]?.value)
                    .map((def, idx) => ({
                        id: def.id || idx + 1,
                        value: f.metadata[def.key].value
                    })) || [];

                return {
                    fileName: f.name,
                    title: f.title || f.name,
                    filingCategoryId: filingCategory?.id,
                    metadataJson: metaDataDtoArray.length > 0 ? JSON.stringify(metaDataDtoArray) : undefined,
                    tagsJson: (f.tags && f.tags.length > 0) ? JSON.stringify(f.tags.map(t => t.id)) : undefined,
                    description: f.description,
                    lang: f.language
                };
            });

            const response = await notificationApiClient.uploadBulkDocuments(
                fileArray,
                folderId,
                language,
                metadataList,
                (current, total) => {
                    setUploadProgress(prev => ({ ...prev, current, total }));
                },
                (loaded, total, percentage) => {
                    setUploadProgress(prev => ({ ...prev, percentage }));
                }
            );

            if (response.failedCount > 0) {
                showWarning('Partial upload', `${response.successCount}/${response.totalFiles} uploaded`);
            } else {
                showSuccess('Upload complete', `${response.successCount} file(s) uploaded successfully`);
                router.push(`/folders/${folderId}`);
            }
        } catch (error) {
            console.error('Upload failed:', error);
            showError('Upload failed', 'Please try again');
        } finally {
            setUploading(false);
        }
    };

    // ============================================================================
    // Render: Selected File
    // ============================================================================

    const selectedFile = files[selectedFileIndex];

    // ============================================================================
    // Render
    // ============================================================================

    return (
        <div className="h-screen flex flex-col bg-neutral-background">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 bg-surface border-b border-ui">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push(`/folders/${folderId}`)}
                        className="p-2 rounded-lg hover:bg-neutral-background transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-semibold text-neutral-text-dark">Advanced Upload</h1>
                        <p className="text-sm text-neutral-text-light flex items-center gap-2">
                            Folder: <span className="font-medium">{folder?.name || folderName}</span>
                            {folder?.id && <span className="text-xs text-neutral-text-light/70">#{folder.id}</span>}
                            {folder?.path && <span className="text-xs text-neutral-text-light/70">({folder.path})</span>}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Global Actions */}
                    <button
                        onClick={handleUpload}
                        disabled={files.length === 0 || uploading}
                        className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>{uploadProgress.percentage}%</span>
                            </>
                        ) : (
                            <>
                                <Upload className="h-4 w-4" />
                                <span>Upload {files.length} file{files.length !== 1 ? 's' : ''}</span>
                            </>
                        )}
                    </button>
                </div>
            </header>

            {/* Main Content - 3 Panel Layout */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel: File List */}
                <div className="w-80 bg-surface border-r border-ui flex flex-col">
                    <div className="p-4 border-b border-ui">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="font-semibold text-neutral-text-dark">Files ({files.length})</h2>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2 rounded-lg hover:bg-neutral-background transition-colors text-primary"
                            >
                                <Plus className="h-5 w-5" />
                            </button>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            className="hidden"
                            onChange={(e) => e.target.files && handleFilesSelected(e.target.files)}
                        />
                    </div>

                    {/* File List */}
                    <div className="flex-1 overflow-auto p-2">
                        {files.length === 0 ? (
                            <div
                                className={`h-full border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-4 transition-colors cursor-pointer ${dragActive ? 'border-primary bg-primary/5' : 'border-gray-300'
                                    }`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className="h-12 w-12 text-gray-400 mb-3" />
                                <p className="text-sm text-center text-neutral-text-light">
                                    Drop files here or click to browse
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {files.map((file, index) => {
                                    const completion = calculateMetadataCompletion(file);
                                    const hasAutoName = filingCategory?.nameStructure;
                                    const generatedName = hasAutoName ? generateFileName(file) : '';

                                    return (
                                        <div
                                            key={index}
                                            onClick={() => setSelectedFileIndex(index)}
                                            className={`p-3 rounded-lg cursor-pointer transition-all border ${index === selectedFileIndex
                                                ? 'bg-primary/10 border-primary shadow-sm'
                                                : 'hover:bg-neutral-background border-transparent'
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                {getFileIcon(file.file, 'h-6 w-6 flex-shrink-0')}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <p className="text-sm font-medium truncate text-neutral-text-dark">
                                                            {file.name}
                                                        </p>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                                                            className="p-1 rounded hover:bg-red-100 text-red-500 flex-shrink-0"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    </div>

                                                    {/* Auto-generated name indicator */}
                                                    {hasAutoName && generatedName && generatedName !== file.name && (
                                                        <div className="flex items-center gap-1 mb-1">
                                                            <span className="text-xs text-purple-600 font-medium">→</span>
                                                            <span className="text-xs text-purple-600 truncate" title={generatedName}>
                                                                {generatedName}
                                                            </span>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs text-neutral-text-light">
                                                            {formatFileSize(file.file.size)}
                                                        </span>
                                                        {filingCategory && (
                                                            <span className={`text-xs font-medium ${completion.percentage === 100 ? 'text-green-600' :
                                                                completion.percentage > 0 ? 'text-yellow-600' :
                                                                    'text-gray-400'
                                                                }`}>
                                                                {completion.filled}/{completion.total}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Progress bar */}
                                                    {filingCategory && (
                                                        <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full transition-all duration-300 ${completion.percentage === 100 ? 'bg-green-500' :
                                                                    completion.percentage > 0 ? 'bg-yellow-500' :
                                                                        'bg-gray-300'
                                                                    }`}
                                                                style={{ width: `${completion.percentage}%` }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Add more files dropzone */}
                                <div
                                    className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${dragActive ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Plus className="h-5 w-5 mx-auto text-gray-400 mb-1" />
                                    <p className="text-xs text-neutral-text-light">Add more files</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Center Panel: Preview (Swapped from Right) */}
                <div className="flex-1 bg-neutral-background flex flex-col min-w-0">
                    <div className="p-4 border-b border-ui bg-surface flex items-center justify-between shadow-sm z-10">
                        <h2 className="font-semibold text-neutral-text-dark">Preview</h2>
                        {isDrawingZone && (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-purple-600 font-medium">
                                    Draw zone for: {ocrActiveField}
                                </span>
                                <button
                                    onClick={cancelOCRMode}
                                    className="text-xs px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="flex-1 overflow-hidden p-4 relative">
                        {selectedFile ? (
                            <div
                                ref={previewContainerRef}
                                className={`h-full bg-white rounded-lg shadow-sm overflow-hidden relative ${isDrawingZone ? 'cursor-crosshair' : ''
                                    }`}
                                onMouseDown={handlePreviewMouseDown}
                                onMouseMove={handlePreviewMouseMove}
                                onMouseUp={handlePreviewMouseUp}
                                onMouseLeave={() => {
                                    if (isDrawingZone && zoneStart) {
                                        setZoneStart(null);
                                        setCurrentZone(null);
                                    }
                                }}
                            >
                                {selectedFile.file.type === 'application/pdf' || selectedFile.file.type.startsWith('image/') ? (
                                    <>
                                        {selectedFile.file.type.startsWith('image/') ? (
                                            <img
                                                src={selectedFile.previewUrl}
                                                alt="Preview"
                                                className="w-full h-full object-contain pointer-events-none"
                                                draggable={false}
                                            />
                                        ) : (
                                            <iframe
                                                src={selectedFile.previewUrl}
                                                className="w-full h-full"
                                                title="File preview"
                                                style={{ pointerEvents: isDrawingZone ? 'none' : 'auto' }}
                                            />
                                        )}

                                        {/* Zone Drawing Overlay */}
                                        {isDrawingZone && (
                                            <div className="absolute inset-0 bg-purple-500/10 pointer-events-none" />
                                        )}

                                        {/* Current Zone Rectangle */}
                                        {currentZone && currentZone.width > 0 && currentZone.height > 0 && (
                                            <div
                                                className="absolute border-2 border-purple-600 bg-purple-500/20 pointer-events-none"
                                                style={{
                                                    left: currentZone.x,
                                                    top: currentZone.y,
                                                    width: currentZone.width,
                                                    height: currentZone.height
                                                }}
                                            />
                                        )}
                                    </>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-neutral-text-light">
                                        <div className="text-center">
                                            {getFileIcon(selectedFile.file, 'h-16 w-16 mx-auto mb-4 opacity-50')}
                                            <p>Preview not available for this file type</p>
                                            <p className="text-sm mt-1">{selectedFile.file.type || 'Unknown type'}</p>
                                        </div>
                                    </div>
                                )}

                                {/* OCR Processing Overlay */}
                                {ocrProcessing && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <div className="bg-white rounded-lg p-4 flex items-center gap-3">
                                            <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                                            <span className="font-medium">Extracting text...</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center text-neutral-text-light">
                                <p>Select a file to preview</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel: Configuration (Swapped from Center) */}
                <div className="w-[450px] bg-surface border-l border-ui overflow-y-auto">
                    {selectedFile ? (
                        <div className="p-6 space-y-6">
                            {/* File Details */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-neutral-text-dark">File Details</h3>

                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-medium text-neutral-text-dark mb-1">
                                        Display Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={selectedFile.title}
                                        onChange={(e) => updateFile(selectedFileIndex, { title: e.target.value })}
                                        className="w-full px-3 py-2 border border-ui rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                        placeholder="Document title"
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-neutral-text-dark mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        value={selectedFile.description || ''}
                                        onChange={(e) => updateFile(selectedFileIndex, { description: e.target.value })}
                                        className="w-full px-3 py-2 border border-ui rounded-lg focus:ring-2 focus:ring-primary focus:border-primary min-h-[80px]"
                                        placeholder="Enter description..."
                                    />
                                </div>

                                {/* Tags */}
                                <div>
                                    <label className="block text-sm font-medium text-neutral-text-dark mb-1">
                                        Tags
                                    </label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {selectedFile.tags?.map(tag => (
                                            <span
                                                key={tag.id}
                                                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                                                style={{ backgroundColor: tag.color + '20', color: tag.color }}
                                            >
                                                {tag.name}
                                                <button
                                                    onClick={() => updateFile(selectedFileIndex, {
                                                        tags: selectedFile.tags.filter(t => t.id !== tag.id)
                                                    })}
                                                    className="hover:bg-black/10 rounded-full p-0.5"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                    <SearchSelect
                                        placeholder="Add tags..."
                                        items={availableTags.filter(t => !selectedFile.tags?.find(st => st.id === t.id))}
                                        displayField="name"
                                        onSelect={(tag) => {
                                            updateFile(selectedFileIndex, {
                                                tags: [...(selectedFile.tags || []), tag]
                                            });
                                        }}
                                        renderItem={(tag) => (
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                                                <span>{tag.name}</span>
                                            </div>
                                        )}
                                    />
                                </div>

                                {/* Language */}
                                <div>
                                    <label className="block text-sm font-medium text-neutral-text-dark mb-1">
                                        Language
                                    </label>
                                    <Select
                                        value={selectedFile.language || language}
                                        onValueChange={(v) => updateFile(selectedFileIndex, { language: v as ExtractorLanguage })}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {SUPPORTED_LANGUAGES.map(l => (
                                                <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <hr className="border-ui" />

                            {/* Filing Category */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-text-dark mb-2">
                                    Document Model
                                </label>
                                <Select
                                    value={filingCategory?.id?.toString() || ''}
                                    onValueChange={handleCategorySelect}
                                    disabled={loadingCategories}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select a document model..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filingCategories.map(cat => (
                                            <SelectItem key={cat.id} value={cat.id.toString()}>
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Metadata Sources */}
                            {filingCategory && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold text-neutral-text-dark">Metadata</h3>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setShowMySQLPanel(!showMySQLPanel)}
                                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${showMySQLPanel ? 'bg-green-100 text-green-700' : 'bg-neutral-background hover:bg-gray-200'
                                                    }`}
                                            >
                                                <Database className="h-4 w-4" />
                                                MySQL
                                            </button>
                                            <button
                                                onClick={applyFilenameExtractionToAll}
                                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                                            >
                                                <FileSearch className="h-4 w-4" />
                                                Extract
                                            </button>
                                        </div>
                                    </div>

                                    {/* Filename Separator */}
                                    <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg">
                                        <label className="text-sm font-medium text-blue-700">Separator:</label>
                                        <input
                                            type="text"
                                            value={separator}
                                            onChange={(e) => setSeparator(e.target.value)}
                                            className="w-16 px-2 py-1 border rounded text-center"
                                            maxLength={3}
                                        />
                                        <span className="text-sm text-blue-600">
                                            Preview: {selectedFile.file.name.split(separator).join(' | ')}
                                        </span>
                                    </div>

                                    {/* MySQL Panel */}
                                    {showMySQLPanel && (
                                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                            <h4 className="font-medium text-green-800 mb-3">MySQL Connection</h4>
                                            <div className="grid grid-cols-2 gap-3">
                                                <input
                                                    type="text"
                                                    placeholder="Host"
                                                    value={mysqlConnection.host}
                                                    onChange={(e) => setMysqlConnection(prev => ({ ...prev, host: e.target.value }))}
                                                    className="px-3 py-2 border rounded-lg text-sm"
                                                />
                                                <input
                                                    type="number"
                                                    placeholder="Port"
                                                    value={mysqlConnection.port}
                                                    onChange={(e) => setMysqlConnection(prev => ({ ...prev, port: parseInt(e.target.value) }))}
                                                    className="px-3 py-2 border rounded-lg text-sm"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Database"
                                                    value={mysqlConnection.database}
                                                    onChange={(e) => setMysqlConnection(prev => ({ ...prev, database: e.target.value }))}
                                                    className="px-3 py-2 border rounded-lg text-sm"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Username"
                                                    value={mysqlConnection.username}
                                                    onChange={(e) => setMysqlConnection(prev => ({ ...prev, username: e.target.value }))}
                                                    className="px-3 py-2 border rounded-lg text-sm"
                                                />
                                                <input
                                                    type="password"
                                                    placeholder="Password"
                                                    value={mysqlConnection.password}
                                                    onChange={(e) => setMysqlConnection(prev => ({ ...prev, password: e.target.value }))}
                                                    className="px-3 py-2 border rounded-lg text-sm col-span-2"
                                                />
                                            </div>
                                            <button className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                                                Test Connection
                                            </button>
                                        </div>
                                    )}

                                    {/* Metadata Fields */}
                                    <div className="space-y-3">
                                        {filingCategory.metadataDefinitions?.map((def) => {
                                            const metaValue = selectedFile.metadata[def.key] || { value: '', source: 'manual' as MetadataSource };
                                            const badge = getSourceBadge(metaValue.source);
                                            const BadgeIcon = badge.icon;
                                            const isOCRActive = ocrActiveField === def.key;

                                            return (
                                                <div key={def.key} className="space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-sm font-medium text-neutral-text-dark">
                                                            {def.key}
                                                            {def.mandatory && <span className="text-red-500 ml-1">*</span>}
                                                        </label>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${badge.color}`}>
                                                                <BadgeIcon className="h-3 w-3" />
                                                                {badge.label}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type={def.dataType === MetadataType.DATE ? 'date' : 'text'}
                                                            value={metaValue.value}
                                                            onChange={(e) => updateFileMetadata(selectedFileIndex, def.key, {
                                                                ...metaValue,
                                                                value: e.target.value,
                                                                source: 'manual'
                                                            })}
                                                            className="flex-1 px-3 py-2 border border-ui rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                                                            placeholder={`Enter ${def.key.toLowerCase()}`}
                                                        />
                                                        {/* OCR Button */}
                                                        <button
                                                            type="button"
                                                            onClick={() => isOCRActive ? cancelOCRMode() : startOCRMode(def.key)}
                                                            disabled={ocrProcessing || !selectedFile.previewUrl}
                                                            className={`px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-1 ${isOCRActive
                                                                ? 'bg-purple-600 text-white'
                                                                : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                                                                } ${(!selectedFile.previewUrl || ocrProcessing) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                            title={isOCRActive ? 'Cancel OCR' : 'Extract with OCR'}
                                                        >
                                                            {ocrProcessing && isOCRActive ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <ScanLine className="h-4 w-4" />
                                                            )}
                                                        </button>
                                                    </div>
                                                    {selectedFile.metadataErrors[def.key] && (
                                                        <p className="text-xs text-red-500">{selectedFile.metadataErrors[def.key]}</p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-neutral-text-light">
                            <div className="text-center">
                                <Settings className="h-16 w-16 mx-auto mb-4 opacity-30" />
                                <p>Select files to configure</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
