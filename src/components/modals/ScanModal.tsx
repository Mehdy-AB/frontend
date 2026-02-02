'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
    Loader2,
    ScanLine,
    RefreshCw,
    AlertCircle,
    CheckCircle,
    XCircle,
    Folder,
    LogIn,
    ChevronDown,
    Settings2
} from 'lucide-react';
import {
    scanService,
    ScannerInfo,
    ScanOptions,
    ScanJobResponse
} from '@/api/services/scanService';
import { useSession } from 'next-auth/react';
import { FolderPicker } from '@/components/picker/FolderPicker';

interface ScanModalProps {
    isOpen: boolean;
    onClose: () => void;
    folderId?: number;
    folderName?: string;
    onUploadComplete?: (documentId: number, versionId: number) => void;
}

type ScanStep = 'configure' | 'scanning' | 'uploading' | 'complete' | 'error';

export function ScanModal({
    isOpen,
    onClose,
    folderId: initialFolderId,
    folderName: initialFolderName,
    onUploadComplete
}: ScanModalProps) {
    const { data: session, status } = useSession();
    const isAuthenticated = status === 'authenticated';
    const token = session?.accessToken as string | undefined;

    // State
    const [step, setStep] = useState<ScanStep>('configure');
    const [isAgentAvailable, setIsAgentAvailable] = useState<boolean | null>(null);
    const [scanners, setScanners] = useState<ScannerInfo[]>([]);
    const [isLoadingScanners, setIsLoadingScanners] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Folder selection state
    const [selectedFolderId, setSelectedFolderId] = useState<number | null>(initialFolderId ?? null);
    const [selectedFolderName, setSelectedFolderName] = useState<string>(initialFolderName ?? '');

    // Basic form state
    const [selectedScanner, setSelectedScanner] = useState<string>('');
    const [dpi, setDpi] = useState<string>('300');
    const [colorMode, setColorMode] = useState<'Color' | 'Grayscale' | 'BlackAndWhite'>('Grayscale');
    const [useAdf, setUseAdf] = useState(false);
    const [showUi, setShowUi] = useState(false);
    const [duplex, setDuplex] = useState(false);
    const [documentTitle, setDocumentTitle] = useState('Scanned Document');
    const [lang, setLang] = useState('ENG');

    // Advanced options state
    const [pageSize, setPageSize] = useState<string>('A4');
    const [orientation, setOrientation] = useState<string>('Portrait');
    const [brightness, setBrightness] = useState(0);
    const [contrast, setContrast] = useState(0);
    const [threshold, setThreshold] = useState(128);
    const [autoCrop, setAutoCrop] = useState(false);
    const [autoDeskew, setAutoDeskew] = useState(false);
    const [removeBlankPages, setRemoveBlankPages] = useState(false);
    const [jpegQuality, setJpegQuality] = useState(85);
    const [maxPages, setMaxPages] = useState(0);

    // Progress state
    const [currentJobId, setCurrentJobId] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [result, setResult] = useState<{ documentId?: number; versionId?: number } | null>(null);

    useEffect(() => {
        if (initialFolderId) {
            setSelectedFolderId(initialFolderId);
            setSelectedFolderName(initialFolderName ?? '');
        }
    }, [initialFolderId, initialFolderName]);

    useEffect(() => {
        if (isOpen) {
            checkAgentAndLoadScanners();
        }
    }, [isOpen]);

    const checkAgentAndLoadScanners = async () => {
        setIsLoadingScanners(true);
        try {
            const available = await scanService.isAvailable();
            setIsAgentAvailable(available);

            if (available) {
                const scannerList = await scanService.getScanners();
                setScanners(scannerList);

                const defaultScanner = scannerList.find(s => s.isDefault) || scannerList[0];
                if (defaultScanner) {
                    setSelectedScanner(defaultScanner.id);
                }
            }
        } catch (error) {
            console.error('Failed to load scanners:', error);
            setIsAgentAvailable(false);
        } finally {
            setIsLoadingScanners(false);
        }
    };

    const handleRefreshScanners = () => {
        checkAgentAndLoadScanners();
    };

    const handleFolderSelect = (folder: { id: number; name: string }) => {
        setSelectedFolderId(folder.id);
        setSelectedFolderName(folder.name);
    };

    const handleStartScan = async () => {
        if (!selectedScanner || !selectedFolderId || !token) return;

        setStep('scanning');
        setProgress(0);
        setStatusText('Starting scan...');
        setErrorMessage('');

        try {
            const options: ScanOptions = {
                // Basic options
                dpi: parseInt(dpi),
                colorMode,
                useAdf,
                showUi,
                duplex,
                // Advanced options
                pageSize: pageSize as ScanOptions['pageSize'],
                orientation: orientation as ScanOptions['orientation'],
                brightness,
                contrast,
                threshold: colorMode === 'BlackAndWhite' ? threshold : undefined,
                autoCrop,
                autoDeskew,
                removeBlankPages,
                jpegQuality,
                maxPages: maxPages > 0 ? maxPages : undefined
            };

            const job = await scanService.startScan(selectedScanner, options);
            setCurrentJobId(job.jobId);

            await scanService.waitForCompletion(
                job.jobId,
                (status: ScanJobResponse) => {
                    setProgress(status.progress);
                    setStatusText(getStatusText(status.status));
                }
            );

            setStep('uploading');
            setStatusText('Uploading to DMS...');

            const uploadResult = await scanService.upload(job.jobId, {
                folderId: selectedFolderId,
                title: documentTitle || 'Scanned Document',
                lang,
                token: token
            });

            if (uploadResult.success && uploadResult.documentId) {
                setResult({
                    documentId: uploadResult.documentId,
                    versionId: uploadResult.versionId
                });
                setStep('complete');
                onUploadComplete?.(uploadResult.documentId, uploadResult.versionId!);
            } else {
                throw new Error(uploadResult.errorMessage || 'Upload failed');
            }
        } catch (error) {
            console.error('Scan/upload failed:', error);
            setErrorMessage(error instanceof Error ? error.message : 'An error occurred');
            setStep('error');
        }
    };

    const getStatusText = (status: string): string => {
        switch (status) {
            case 'Pending': return 'Preparing scanner...';
            case 'Scanning': return 'Scanning pages...';
            case 'Processing': return 'Creating PDF...';
            case 'Completed': return 'Scan complete!';
            default: return status;
        }
    };

    const handleClose = () => {
        setStep('configure');
        setProgress(0);
        setStatusText('');
        setErrorMessage('');
        setResult(null);
        setCurrentJobId(null);
        if (!initialFolderId) {
            setSelectedFolderId(null);
            setSelectedFolderName('');
        }
        onClose();
    };

    const handleNewScan = () => {
        setStep('configure');
        setProgress(0);
        setStatusText('');
        setErrorMessage('');
        setResult(null);
        setCurrentJobId(null);
    };

    const canStartScan = selectedScanner &&
        selectedFolderId &&
        isAgentAvailable &&
        isAuthenticated &&
        !isLoadingScanners;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ScanLine className="h-5 w-5" />
                        Scan Document
                    </DialogTitle>
                </DialogHeader>

                {/* Not Authenticated */}
                {!isAuthenticated && (
                    <Alert variant="destructive">
                        <LogIn className="h-4 w-4" />
                        <AlertDescription>
                            Please log in to scan and upload documents.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Agent Not Available */}
                {isAuthenticated && isAgentAvailable === false && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            Scan Agent is not running. Please start the GiDOC Scan Agent.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Configuration Step */}
                {step === 'configure' && isAgentAvailable && isAuthenticated && (
                    <div className="space-y-4">
                        {/* Destination Folder */}
                        <div className="space-y-2">
                            <Label>Destination Folder</Label>
                            {initialFolderId ? (
                                <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                                    <Folder className="h-4 w-4 text-primary" />
                                    <span className="font-medium">{selectedFolderName || `Folder #${selectedFolderId}`}</span>
                                </div>
                            ) : (
                                <FolderPicker
                                    onSelect={handleFolderSelect}
                                    selectedFolderId={selectedFolderId}
                                    selectedFolderName={selectedFolderName}
                                />
                            )}
                        </div>

                        {/* Scanner select */}
                        <div className="space-y-2">
                            <Label>Scanner</Label>
                            <div className="flex gap-2">
                                <Select
                                    value={selectedScanner}
                                    onValueChange={setSelectedScanner}
                                    disabled={isLoadingScanners}
                                >
                                    <SelectTrigger className="flex-1">
                                        <SelectValue placeholder={isLoadingScanners ? "Loading..." : "Select scanner"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {scanners.map((scanner) => (
                                            <SelectItem key={scanner.id} value={scanner.id}>
                                                {scanner.name} ({scanner.type})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={handleRefreshScanners}
                                    disabled={isLoadingScanners}
                                >
                                    <RefreshCw className={`h-4 w-4 ${isLoadingScanners ? 'animate-spin' : ''}`} />
                                </Button>
                            </div>
                        </div>

                        {/* Document title */}
                        <div className="space-y-2">
                            <Label>Document Title</Label>
                            <Input
                                value={documentTitle}
                                onChange={(e) => setDocumentTitle(e.target.value)}
                                placeholder="Scanned Document"
                            />
                        </div>

                        {/* Basic Options Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Resolution</Label>
                                <Select value={dpi} onValueChange={setDpi}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="150">150 DPI (Draft)</SelectItem>
                                        <SelectItem value="200">200 DPI (Normal)</SelectItem>
                                        <SelectItem value="300">300 DPI (High)</SelectItem>
                                        <SelectItem value="600">600 DPI (Very High)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Color Mode</Label>
                                <Select
                                    value={colorMode}
                                    onValueChange={(v) => setColorMode(v as typeof colorMode)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Color">Color</SelectItem>
                                        <SelectItem value="Grayscale">Grayscale</SelectItem>
                                        <SelectItem value="BlackAndWhite">Black & White</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>OCR Language</Label>
                                <Select value={lang} onValueChange={setLang}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ENG">English</SelectItem>
                                        <SelectItem value="FRA">French</SelectItem>
                                        <SelectItem value="ARA">Arabic</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Page Size</Label>
                                <Select value={pageSize} onValueChange={setPageSize}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="A4">A4</SelectItem>
                                        <SelectItem value="A5">A5</SelectItem>
                                        <SelectItem value="A3">A3</SelectItem>
                                        <SelectItem value="Letter">Letter</SelectItem>
                                        <SelectItem value="Legal">Legal</SelectItem>
                                        <SelectItem value="Auto">Auto Detect</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Checkboxes */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="useAdf"
                                    checked={useAdf}
                                    onCheckedChange={(v) => setUseAdf(v === true)}
                                />
                                <Label htmlFor="useAdf" className="text-sm font-normal cursor-pointer">
                                    Document Feeder (ADF)
                                </Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="duplex"
                                    checked={duplex}
                                    onCheckedChange={(v) => setDuplex(v === true)}
                                />
                                <Label htmlFor="duplex" className="text-sm font-normal cursor-pointer">
                                    Duplex (Both Sides)
                                </Label>
                            </div>
                        </div>

                        {/* Advanced Options Collapsible */}
                        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                            <CollapsibleTrigger asChild>
                                <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                                    <span className="flex items-center gap-2 text-sm">
                                        <Settings2 className="h-4 w-4" />
                                        Advanced Options
                                    </span>
                                    <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                                </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="space-y-4 pt-4">
                                {/* Brightness & Contrast */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm">Brightness: {brightness}</Label>
                                        <Slider
                                            value={[brightness]}
                                            onValueChange={(v) => setBrightness(v[0])}
                                            min={-100}
                                            max={100}
                                            step={5}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm">Contrast: {contrast}</Label>
                                        <Slider
                                            value={[contrast]}
                                            onValueChange={(v) => setContrast(v[0])}
                                            min={-100}
                                            max={100}
                                            step={5}
                                        />
                                    </div>
                                </div>

                                {/* Threshold (B&W only) */}
                                {colorMode === 'BlackAndWhite' && (
                                    <div className="space-y-2">
                                        <Label className="text-sm">B&W Threshold: {threshold}</Label>
                                        <Slider
                                            value={[threshold]}
                                            onValueChange={(v) => setThreshold(v[0])}
                                            min={0}
                                            max={255}
                                            step={1}
                                        />
                                    </div>
                                )}

                                {/* Quality & Max Pages */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm">JPEG Quality: {jpegQuality}%</Label>
                                        <Slider
                                            value={[jpegQuality]}
                                            onValueChange={(v) => setJpegQuality(v[0])}
                                            min={10}
                                            max={100}
                                            step={5}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm">Max Pages (0=unlimited)</Label>
                                        <Input
                                            type="number"
                                            value={maxPages}
                                            onChange={(e) => setMaxPages(parseInt(e.target.value) || 0)}
                                            min={0}
                                            max={100}
                                        />
                                    </div>
                                </div>

                                {/* Post-processing checkboxes */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id="autoCrop"
                                            checked={autoCrop}
                                            onCheckedChange={(v) => setAutoCrop(v === true)}
                                        />
                                        <Label htmlFor="autoCrop" className="text-sm font-normal cursor-pointer">
                                            Auto Crop
                                        </Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id="autoDeskew"
                                            checked={autoDeskew}
                                            onCheckedChange={(v) => setAutoDeskew(v === true)}
                                        />
                                        <Label htmlFor="autoDeskew" className="text-sm font-normal cursor-pointer">
                                            Auto Straighten
                                        </Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id="removeBlankPages"
                                            checked={removeBlankPages}
                                            onCheckedChange={(v) => setRemoveBlankPages(v === true)}
                                        />
                                        <Label htmlFor="removeBlankPages" className="text-sm font-normal cursor-pointer">
                                            Remove Blank Pages
                                        </Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id="showUi"
                                            checked={showUi}
                                            onCheckedChange={(v) => setShowUi(v === true)}
                                        />
                                        <Label htmlFor="showUi" className="text-sm font-normal cursor-pointer">
                                            Show Scanner UI
                                        </Label>
                                    </div>
                                </div>
                            </CollapsibleContent>
                        </Collapsible>

                        {/* Folder warning */}
                        {!selectedFolderId && (
                            <Alert>
                                <Folder className="h-4 w-4" />
                                <AlertDescription>
                                    Please select a destination folder.
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>
                )}

                {/* Scanning/Uploading Step */}
                {(step === 'scanning' || step === 'uploading') && (
                    <div className="py-6 space-y-4">
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            <div className="text-center">
                                <p className="font-medium">{statusText}</p>
                                {step === 'scanning' && (
                                    <p className="text-sm text-muted-foreground">
                                        Please wait while scanning...
                                    </p>
                                )}
                            </div>
                        </div>
                        <Progress value={progress} className="w-full" />
                        <p className="text-center text-sm text-muted-foreground">{progress}%</p>
                    </div>
                )}

                {/* Complete Step */}
                {step === 'complete' && result && (
                    <div className="py-6 space-y-4">
                        <div className="flex flex-col items-center gap-4">
                            <CheckCircle className="h-12 w-12 text-green-500" />
                            <div className="text-center">
                                <p className="font-medium">Document scanned successfully!</p>
                                <p className="text-sm text-muted-foreground">
                                    Document ID: {result.documentId}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Saved to: {selectedFolderName}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error Step */}
                {step === 'error' && (
                    <div className="py-6 space-y-4">
                        <div className="flex flex-col items-center gap-4">
                            <XCircle className="h-12 w-12 text-destructive" />
                            <div className="text-center">
                                <p className="font-medium">Scan failed</p>
                                <p className="text-sm text-muted-foreground">{errorMessage}</p>
                            </div>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    {step === 'configure' && (
                        <>
                            <Button variant="outline" onClick={handleClose}>Cancel</Button>
                            <Button onClick={handleStartScan} disabled={!canStartScan}>
                                <ScanLine className="h-4 w-4 mr-2" />
                                Start Scan
                            </Button>
                        </>
                    )}

                    {step === 'complete' && (
                        <>
                            <Button variant="outline" onClick={handleNewScan}>Scan Another</Button>
                            <Button onClick={handleClose}>Done</Button>
                        </>
                    )}

                    {step === 'error' && (
                        <>
                            <Button variant="outline" onClick={handleClose}>Cancel</Button>
                            <Button onClick={handleNewScan}>Try Again</Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default ScanModal;
