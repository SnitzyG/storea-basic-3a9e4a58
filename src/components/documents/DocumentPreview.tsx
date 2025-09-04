import React, { useState } from 'react';
import { Eye, Download, X, ZoomIn, ZoomOut, RotateCw, Maximize } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface DocumentPreviewProps {
  document: {
    id: string;
    name: string;
    file_path: string;
    file_type: string;
    version?: number;
  };
  isOpen: boolean;
  onClose: () => void;
  onDownload: (filePath: string, fileName: string) => void;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  document,
  isOpen,
  onClose,
  onDownload
}) => {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const renderPreview = () => {
    if (document.file_type.startsWith('image/')) {
      return (
        <div className="flex justify-center items-center h-full bg-muted/20 rounded-lg">
          <img
            src={`/api/documents/preview/${document.file_path}`}
            alt={document.name}
            className="max-w-full max-h-full object-contain"
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transition: 'transform 0.2s ease'
            }}
          />
        </div>
      );
    }

    if (document.file_type === 'application/pdf') {
      return (
        <div className="flex justify-center items-center h-full bg-muted/20 rounded-lg">
          <iframe
            src={`/api/documents/preview/${document.file_path}`}
            className="w-full h-full border-0 rounded-lg"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top left'
            }}
          />
        </div>
      );
    }

    return (
      <div className="flex flex-col justify-center items-center h-full bg-muted/20 rounded-lg text-center">
        <Eye className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Preview not available</h3>
        <p className="text-muted-foreground mb-4">
          This file type cannot be previewed in the browser
        </p>
        <Button onClick={() => onDownload(document.file_path, document.name)}>
          <Download className="h-4 w-4 mr-2" />
          Download to View
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DialogTitle className="truncate">{document.name}</DialogTitle>
              {document.version && (
                <Badge variant="outline">v{document.version}</Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {(document.file_type.startsWith('image/') || document.file_type === 'application/pdf') && (
                <>
                  <Button variant="ghost" size="sm" onClick={handleZoomOut}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground min-w-12 text-center">
                    {zoom}%
                  </span>
                  <Button variant="ghost" size="sm" onClick={handleZoomIn}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  
                  {document.file_type.startsWith('image/') && (
                    <Button variant="ghost" size="sm" onClick={handleRotate}>
                      <RotateCw className="h-4 w-4" />
                    </Button>
                  )}
                </>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDownload(document.file_path, document.name)}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 min-h-0 p-4">
          {renderPreview()}
        </div>
      </DialogContent>
    </Dialog>
  );
};