'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { notificationApiClient } from '@/api/notificationClient'
import { DocumentResponseDto } from '@/types/api'
import FileViewer from './FileViewer'

export default function FileViewerTest() {
  const [document, setDocument] = React.useState<DocumentResponseDto | null>(null)
  const [downloadUrl, setDownloadUrl] = React.useState<string>('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const testDocumentId = 1 // Replace with a real document ID for testing

  const loadTestDocument = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch document data and download URL using the API
      const [docData, downloadUrlData] = await Promise.all([
        notificationApiClient.getDocument(testDocumentId, { silent: true }),
        notificationApiClient.downloadDocument(testDocumentId, {}, { silent: true })
      ])

      setDocument(docData)
      setDownloadUrl(downloadUrlData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load document'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">File Viewer API Integration Test</h2>
        <p className="text-gray-600">
          Test the FileViewer component with real API data and download URLs.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button
              onClick={loadTestDocument}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Load Test Document'}
            </Button>
            
            {document && (
              <div className="text-sm text-gray-600">
                <p><strong>Document ID:</strong> {document.documentId}</p>
                <p><strong>Name:</strong> {document.name}</p>
                <p><strong>MIME Type:</strong> {document.mimeType}</p>
                <p><strong>Download URL:</strong> {downloadUrl ? 'Available' : 'Not available'}</p>
              </div>
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800"><strong>Error:</strong> {error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {document && downloadUrl && (
        <Card>
          <CardHeader>
            <CardTitle>File Viewer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96 border border-gray-200 rounded-lg">
              <FileViewer
                document={document}
                downloadUrl={downloadUrl}
                onError={(error) => setError(error)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">How it works:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Document data is fetched using <code>notificationApiClient.getDocument()</code></li>
          <li>• Download URL is fetched using <code>notificationApiClient.downloadDocument()</code></li>
          <li>• FileViewer receives both the document data and download URL as props</li>
          <li>• FileViewer uses the download URL to fetch and display file content</li>
          <li>• All API calls include automatic notifications for success/error</li>
        </ul>
      </div>
    </div>
  )
}
