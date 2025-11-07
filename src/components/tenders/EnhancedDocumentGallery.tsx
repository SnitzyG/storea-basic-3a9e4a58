import { useState } from 'react';
import { Download, Eye, FileText, Image as ImageIcon, File } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { downloadFromStorage, getDownloadUrl } from '@/utils/storageUtils';
import { useToast } from '@/hooks/use-toast';
import { getFileExtension } from '@/utils/documentUtils';

interface TenderDocument {
  id: string;
  document_type: string;
  document_name: string;
  file_path: string;
  file_size?: number;
  uploaded_at: string;
}

interface EnhancedDocumentGalleryProps {
  documents: TenderDocument[];
}

export const EnhancedDocumentGallery = ({ documents }: EnhancedDocumentGalleryProps) => {
  const [selectedDoc, setSelectedDoc] = useState<TenderDocument | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const { toast } = useToast();

  const loadPreviewUrl = async (doc: TenderDocument) => {
    try {
      const { url } = await getDownloadUrl(doc.file_path);
      setPreviewUrl(url);
    } catch (error: any) {
      toast({
        title: 'Preview error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return <ImageIcon className="h-8 w-8 text-primary" />;
    } else if (['pdf'].includes(ext || '')) {
      return <FileText className="h-8 w-8 text-destructive" />;
    } else if (['xlsx', 'xls'].includes(ext || '')) {
      return <File className="h-8 w-8 text-success" />;
    } else if (['docx', 'doc'].includes(ext || '')) {
      return <File className="h-8 w-8 text-info" />;
    }
    
    return <File className="h-8 w-8 text-muted-foreground" />;
  };

  const getFileTypeColor = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return 'bg-primary/10 text-primary';
    } else if (['pdf'].includes(ext || '')) {
      return 'bg-destructive/10 text-destructive';
    } else if (['xlsx', 'xls'].includes(ext || '')) {
      return 'bg-success/10 text-success';
    } else if (['docx', 'doc'].includes(ext || '')) {
      return 'bg-info/10 text-info';
    }
    
    return 'bg-muted text-muted-foreground';
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleDownload = async (doc: TenderDocument) => {
    try {
      await downloadFromStorage(doc.file_path, doc.document_name);
      toast({
        title: 'Download started',
        description: `Downloading ${doc.document_name}`
      });
    } catch (error: any) {
      toast({
        title: 'Download failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handlePreview = async (doc: TenderDocument) => {
    setSelectedDoc(doc);
    await loadPreviewUrl(doc);
    setPreviewOpen(true);
  };

  const renderPreview = () => {
    if (!selectedDoc || !previewUrl) return null;

    const ext = getFileExtension(selectedDoc.document_name);
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
    const isPdf = ext === 'pdf';
    const isOffice = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext);

    if (isImage) {
      return (
        <div className="flex justify-center items-center">
          <img
            src={previewUrl}
            alt={selectedDoc.document_name}
            className="max-w-full max-h-[70vh] object-contain"
          />
        </div>
      );
    }

    if (isPdf || isOffice) {
      const fileUrl = encodeURIComponent(previewUrl);
      const viewerUrl = `https://docs.google.com/gview?url=${fileUrl}&embedded=true`;
      
      return (
        <iframe
          src={viewerUrl}
          className="w-full h-[70vh] border-0 rounded-lg"
          title="Document Preview"
        />
      );
    }

    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">
          Preview not available for this file type
        </p>
        <Button onClick={() => selectedDoc && handleDownload(selectedDoc)} className="mt-4">
          <Download className="h-4 w-4 mr-2" />
          Download to View
        </Button>
      </div>
    );
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No documents available</h3>
        <p className="text-sm text-muted-foreground">
          Documents will appear here when they are uploaded
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((doc) => (
          <Card key={doc.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`p-3 rounded-lg ${getFileTypeColor(doc.document_name)}`}>
                  {getFileIcon(doc.document_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-foreground truncate mb-1">
                    {doc.document_name}
                  </h4>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      {doc.document_type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(doc.file_size)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    {new Date(doc.uploaded_at).toLocaleDateString()}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePreview(doc)}
                      className="flex-1"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleDownload(doc)}
                      className="flex-1"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{selectedDoc?.document_name}</DialogTitle>
          </DialogHeader>
          <div className="overflow-auto">
            {renderPreview()}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
