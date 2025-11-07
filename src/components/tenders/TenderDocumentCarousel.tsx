import React, { useState } from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  FileText, 
  ChevronLeft, 
  ChevronRight, 
  Eye,
  Package,
  MessageSquare
} from 'lucide-react';
import { downloadFromStorage } from '@/utils/storageUtils';
import { toast } from 'sonner';
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

interface TenderDocumentCarouselProps {
  documents: TenderDocument[];
  onRequestRFI?: (documentId: string, documentName: string) => void;
}

const NextArrow = ({ onClick }: any) => (
  <button
    onClick={onClick}
    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-primary/90 text-primary-foreground rounded-full p-2 hover:bg-primary shadow-lg"
  >
    <ChevronRight className="h-5 w-5" />
  </button>
);

const PrevArrow = ({ onClick }: any) => (
  <button
    onClick={onClick}
    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-primary/90 text-primary-foreground rounded-full p-2 hover:bg-primary shadow-lg"
  >
    <ChevronLeft className="h-5 w-5" />
  </button>
);

export const TenderDocumentCarousel: React.FC<TenderDocumentCarouselProps> = ({
  documents,
  onRequestRFI
}) => {
  const [downloading, setDownloading] = useState(false);

  const settings = {
    dots: true,
    infinite: documents.length > 3,
    speed: 500,
    slidesToShow: Math.min(3, documents.length),
    slidesToScroll: 1,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: Math.min(2, documents.length),
          slidesToScroll: 1,
        }
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1
        }
      }
    ]
  };

  const handleDownloadDocument = async (doc: TenderDocument) => {
    try {
      await downloadFromStorage(doc.file_path, doc.document_name);
      toast.success(`Downloaded ${doc.document_name}`);
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    }
  };

  const handleDownloadAll = async () => {
    if (documents.length === 0) return;

    setDownloading(true);
    try {
      const zip = new JSZip();

      // Download all files and add to zip
      for (const doc of documents) {
        try {
          const { data } = await supabase.storage
            .from('documents')
            .download(doc.file_path);

          if (data) {
            zip.file(doc.document_name, data);
          }
        } catch (error) {
          console.error(`Failed to download ${doc.document_name}:`, error);
        }
      }

      // Generate and download zip
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `tender-documents-${Date.now()}.zip`);
      
      toast.success('All documents downloaded successfully');
    } catch (error) {
      console.error('Error downloading all documents:', error);
      toast.error('Failed to download all documents');
    } finally {
      setDownloading(false);
    }
  };

  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center py-12">
          <Package className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
          <p className="text-muted-foreground">No documents available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Tender Documents
              <Badge variant="secondary">{documents.length}</Badge>
            </CardTitle>
          </div>
          <Button 
            onClick={handleDownloadAll} 
            disabled={downloading}
            variant="outline"
          >
            <Download className="h-4 w-4 mr-2" />
            {downloading ? 'Downloading...' : 'Download All'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pb-8">
        <div className="px-4">
          <Slider {...settings}>
            {documents.map((doc) => (
              <div key={doc.id} className="px-2">
                <Card className="border-2 hover:border-primary/50 transition-colors h-full">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm line-clamp-2">
                          {doc.document_name}
                        </h4>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {doc.document_type}
                        </Badge>
                        {doc.file_size && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {(doc.file_size / 1024).toFixed(2)} KB
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleDownloadDocument(doc)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                      {onRequestRFI && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => onRequestRFI(doc.id, doc.document_name)}
                        >
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Ask RFI
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </Slider>
        </div>
      </CardContent>
    </Card>
  );
};

// Import supabase
import { supabase } from '@/integrations/supabase/client';
