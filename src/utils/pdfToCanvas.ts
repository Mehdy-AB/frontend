import { apiClient } from '../api/client';

/**
 * Render a PDF or image file to a canvas
 * For PDFs, sends to backend for conversion to image first
 * @param file - The file to render (image or PDF)
 * @param isPDF - Whether the file is a PDF
 * @returns HTMLCanvasElement with the rendered content
 */
export async function renderFileToCanvas(file: File, isPDF: boolean): Promise<HTMLCanvasElement> {
    if (isPDF) {
        // PDF: Send to backend for conversion to image using authenticated API client
        const formData = new FormData();
        formData.append('file', file);
        formData.append('dpi', '150'); // Good quality for OCR
        formData.append('page', '0'); // First page

        const imageBlob = await apiClient.post<Blob>('/api/v1/pdf/to-image', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            responseType: 'blob'
        });
        const imageUrl = URL.createObjectURL(imageBlob);

        // Load image into canvas
        const img = new window.Image();
        await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error('Failed to load converted image'));
            img.src = imageUrl;
        });

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Failed to get canvas context');
        context.drawImage(img, 0, 0);

        // Clean up blob URL
        URL.revokeObjectURL(imageUrl);

        return canvas;
    } else {
        // Image: Load via FileReader and draw to canvas
        const imageDataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = () => reject(new Error('File read error'));
            reader.readAsDataURL(file);
        });

        const img = new window.Image();
        await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error('Image decode failed'));
            img.src = imageDataUrl;
        });

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Failed to get canvas context');
        context.drawImage(img, 0, 0);
        return canvas;
    }
}
