import { useState, useMemo } from 'react';
import { Download, Eye, FileText, Image as ImageIcon, File, Download as DownloadIcon, ChevronDown, ZoomIn, ZoomOut, Maximize2, X, CheckSquare, Square } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { downloadFromStorage, getDownloadUrl } from '@/utils/storageUtils';
import { useToast } from '@/hooks/use-toast';
import { getFileExtension } from '@/utils/documentUtils';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

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

// Document category types
const DOCUMENT_CATEGORIES = {
  drawings: { label: 'Drawings', icon: FileText, color: 'bg-blue-500/10 text-blue-700' },
  specifications: { label: 'Specifications', icon: FileText, color: 'bg-purple-500/10 text-purple-700' },
  boq: { label: 'Bill of Quantities', icon: File, color: 'bg-green-500/10 text-green-700' },
  site_plans: { label: 'Site Plans', icon: FileText, color: 'bg-orange-500/10 text-orange-700' },
  supporting: { label: 'Supporting Documents', icon: File, color: 'bg-gray-500/10 text-gray-700' },
};

type CategoryKey = keyof typeof DOCUMENT_CATEGORIES;

export const EnhancedDocumentGallery = ({ documents }: EnhancedDocumentGalleryProps) => {
  const [selectedDoc, setSelectedDoc] = useState<TenderDocument | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [fullscreen, setFullscreen] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<CategoryKey>>(new Set(['drawings', 'specifications', 'boq', 'site_plans', 'supporting']));
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();

  // Categorize documents based on type or filename
  const categorizedDocs = useMemo(() => {
    const categories: Record<CategoryKey, TenderDocument[]> = {
      drawings: [],
      specifications: [],
      boq: [],
      site_plans: [],
      supporting: [],
    };

    documents.forEach((doc) => {
      const name = doc.document_name.toLowerCase();
      const type = doc.document_type.toLowerCase();
      
      if (name.includes('drawing') || type.includes('drawing') || name.includes('dwg') || name.includes('plan')) {
        categories.drawings.push(doc);
      } else if (name.includes('spec') || type.includes('spec')) {
        categories.specifications.push(doc);
      } else if (name.includes('boq') || name.includes('quantities') || type.includes('boq')) {
        categories.boq.push(doc);
      } else if (name.includes('site') || type.includes('site')) {
        categories.site_plans.push(doc);
      } else {
        categories.supporting.push(doc);
      }
    });

    return categories;
  }, [documents]);

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

  const handleBulkDownload = async (category?: CategoryKey) => {
    setDownloading(true);
    try {
      const zip = new JSZip();
      const docsToDownload = category 
        ? categorizedDocs[category]
        : Array.from(selectedDocs).map(id => documents.find(d => d.id === id)).filter(Boolean) as TenderDocument[];

      if (docsToDownload.length === 0) {
        toast({
          title: 'No documents selected',
          description: 'Please select documents to download',
          variant: 'destructive'
        });
        return;
      }

      // Fetch all files and add to ZIP
      for (const doc of docsToDownload) {
        try {
          const { url } = await getDownloadUrl(doc.file_path);
          const response = await fetch(url);
          const blob = await response.blob();
          zip.file(doc.document_name, blob);
        } catch (error) {
          console.error(`Failed to fetch ${doc.document_name}:`, error);
        }
      }

      // Generate ZIP and download
      const content = await zip.generateAsync({ type: 'blob' });
      const fileName = category 
        ? `${DOCUMENT_CATEGORIES[category].label}_Documents.zip`
        : 'Selected_Documents.zip';
      
      saveAs(content, fileName);
      
      toast({
        title: 'Download complete',
        description: `${docsToDownload.length} document(s) downloaded as ${fileName}`
      });
      
      // Clear selection
      setSelectedDocs(new Set());
    } catch (error: any) {
      toast({
        title: 'Bulk download failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadAll = async () => {
    setDownloading(true);
    try {
      const zip = new JSZip();

      // Fetch all files and add to ZIP
      for (const doc of documents) {
        try {
          const { url } = await getDownloadUrl(doc.file_path);
          const response = await fetch(url);
          const blob = await response.blob();
          zip.file(doc.document_name, blob);
        } catch (error) {
          console.error(`Failed to fetch ${doc.document_name}:`, error);
        }
      }

      // Generate ZIP and download
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, 'All_Tender_Documents.zip');
      
      toast({
        title: 'Download complete',
        description: `${documents.length} document(s) downloaded as All_Tender_Documents.zip`
      });
    } catch (error: any) {
      toast({
        title: 'Bulk download failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setDownloading(false);
    }
  };

  const handlePreview = async (doc: TenderDocument) => {
    setSelectedDoc(doc);
    setZoomLevel(100);
    await loadPreviewUrl(doc);
    setPreviewOpen(true);
  };

  const toggleDocumentSelection = (docId: string) => {
    const newSelection = new Set(selectedDocs);
    if (newSelection.has(docId)) {
      newSelection.delete(docId);
    } else {
      newSelection.add(docId);
    }
    setSelectedDocs(newSelection);
  };

  const toggleCategoryExpanded = (category: CategoryKey) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const renderPreview = () => {
    if (!selectedDoc || !previewUrl) return null;

    const ext = getFileExtension(selectedDoc.document_name);
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
    const isPdf = ext === 'pdf';

    if (isImage) {
      return (
        <div className={`flex flex-col items-center justify-center ${fullscreen ? 'h-screen' : ''}`}>
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoomLevel(Math.max(25, zoomLevel - 25))}
              disabled={zoomLevel <= 25}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">{zoomLevel}%</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoomLevel(Math.min(200, zoomLevel + 25))}
              disabled={zoomLevel >= 200}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFullscreen(!fullscreen)}
            >
              {fullscreen ? <X className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
          <img
            src={previewUrl}
            alt={selectedDoc.document_name}
            style={{ width: `${zoomLevel}%` }}
            className="object-contain"
          />
        </div>
      );
    }

    if (isPdf) {
      return (
        <div className="w-full">
          <iframe
            src={previewUrl}
            className="w-full h-[70vh] border-0 rounded-lg"
            title="PDF Preview"
          />
        </div>
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

  const renderDocumentCard = (doc: TenderDocument) => (
    <Card key={doc.id} className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={selectedDocs.has(doc.id)}
            onCheckedChange={() => toggleDocumentSelection(doc.id)}
            className="mt-1"
          />
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
              Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
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
  );

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
      {/* Bulk Actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {selectedDocs.size > 0 && (
            <>
              <span className="text-sm text-muted-foreground">
                {selectedDocs.size} selected
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedDocs(new Set())}
              >
                Clear
              </Button>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selectedDocs.size > 0 && (
            <Button
              size="sm"
              onClick={() => handleBulkDownload()}
              disabled={downloading}
            >
              <DownloadIcon className="h-4 w-4 mr-2" />
              Download Selected ({selectedDocs.size})
            </Button>
          )}
          <Button
            size="sm"
            variant="secondary"
            onClick={handleDownloadAll}
            disabled={downloading}
          >
            <DownloadIcon className="h-4 w-4 mr-2" />
            Download All ({documents.length})
          </Button>
        </div>
      </div>

      {/* Categorized Documents */}
      <div className="space-y-4">
        {(Object.entries(categorizedDocs) as [CategoryKey, TenderDocument[]][]).map(([category, docs]) => {
          if (docs.length === 0) return null;
          
          const categoryConfig = DOCUMENT_CATEGORIES[category];
          const IconComponent = categoryConfig.icon;
          const isExpanded = expandedCategories.has(category);

          return (
            <Card key={category}>
              <Collapsible open={isExpanded} onOpenChange={() => toggleCategoryExpanded(category)}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${categoryConfig.color}`}>
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{categoryConfig.label}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {docs.length} document{docs.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBulkDownload(category);
                          }}
                          disabled={downloading}
                        >
                          <DownloadIcon className="h-4 w-4 mr-1" />
                          Download All
                        </Button>
                        <ChevronDown className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {docs.map(renderDocumentCard)}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className={fullscreen ? "max-w-full max-h-full w-screen h-screen" : "max-w-4xl max-h-[90vh]"}>
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedDoc?.document_name}</span>
              {selectedDoc && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownload(selectedDoc)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-auto">
            {renderPreview()}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};