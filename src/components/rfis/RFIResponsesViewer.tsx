import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, FileText, Download, Minimize2, Maximize2, Package } from 'lucide-react';
import { RFI } from '@/hooks/useRFIs';
import { supabase } from '@/integrations/supabase/client';

interface RFIResponse {
  id: string;
  rfi_id: string;
  response: string;
  responder_name: string;
  responder_position: string;
  response_date: string;
  created_at: string;
  type: 'original' | 'response';
}

interface RFIResponsesViewerProps {
  rfi: RFI | null;
  isOpen: boolean;
  onClose: () => void;
}

export const RFIResponsesViewer: React.FC<RFIResponsesViewerProps> = ({
  rfi,
  isOpen,
  onClose
}) => {
  const [responses, setResponses] = useState<RFIResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [minimizedItems, setMinimizedItems] = useState<Set<string>>(new Set());
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    if (rfi && isOpen) {
      fetchResponses();
    }
  }, [rfi, isOpen]);

  const fetchResponses = async () => {
    if (!rfi) return;
    
    setLoading(true);
    try {
      const allResponses: RFIResponse[] = [];
      
      // Add the original RFI as the first "response"
      allResponses.push({
        id: `${rfi.id}-original`,
        rfi_id: rfi.id,
        response: rfi.question,
        responder_name: rfi.raised_by_profile?.name || 'Unknown User',
        responder_position: 'RFI Initiator',
        response_date: rfi.created_at,
        created_at: rfi.created_at,
        type: 'original'
      });
      
      // Add actual responses if they exist
      if (rfi.response) {
        allResponses.push({
          id: `${rfi.id}-response-1`,
          rfi_id: rfi.id,
          response: rfi.response,
          responder_name: rfi.responder_name || 'Unknown Responder',
          responder_position: rfi.responder_position || 'Team Member',
          response_date: rfi.response_date || rfi.updated_at,
          created_at: rfi.response_date || rfi.updated_at,
          type: 'response'
        });
      }
      
      setResponses(allResponses);
    } catch (error) {
      console.error('Error fetching responses:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateResponsePDF = (response: RFIResponse, index: number) => {
    const isOriginal = response.type === 'original';
    const title = isOriginal ? 'Original RFI' : `Response ${index}`;
    const headerColor = isOriginal ? '#1e40af' : '#059669';
    
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title} - ${rfi?.rfi_number || rfi?.id}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 40px 20px;
              background: white;
            }
            .header { 
              background: linear-gradient(135deg, ${headerColor}, ${headerColor === '#1e40af' ? '#3b82f6' : '#10b981'});
              color: white;
              padding: 30px;
              border-radius: 8px;
              margin-bottom: 30px;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .header h1 { 
              font-size: 28px;
              margin-bottom: 15px;
              font-weight: 600;
            }
            .header-info {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 15px;
              margin-top: 20px;
            }
            .field { 
              margin: 20px 0;
              padding: 15px;
              border-left: 4px solid ${headerColor};
              background: ${isOriginal ? '#f8fafc' : '#f0fdf4'};
              border-radius: 0 8px 8px 0;
            }
            .label { 
              font-weight: 600;
              color: #1e293b;
              font-size: 14px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 8px;
            }
            .content { 
              font-size: 16px;
              line-height: 1.7;
              color: #334155;
              white-space: pre-wrap;
            }
            .question-section, .response-section {
              background: ${isOriginal ? '#f8fafc' : '#f0fdf4'};
              border: 2px solid ${isOriginal ? '#e2e8f0' : '#bbf7d0'};
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .divider {
              height: 2px;
              background: linear-gradient(90deg, ${headerColor}, #e2e8f0);
              margin: 30px 0;
              border-radius: 1px;
            }
            @media print {
              body { padding: 20px; }
              .header { background: ${headerColor} !important; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${title}</h1>
            <div class="header-info">
              <div><strong>RFI Number:</strong> ${rfi?.rfi_number || `RFI-${rfi?.id.slice(0, 8)}`}</div>
              <div><strong>Date:</strong> ${new Date(response.response_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</div>
              <div><strong>${isOriginal ? 'Raised By' : 'Responder'}:</strong> ${response.responder_name}</div>
              <div><strong>Position:</strong> ${response.responder_position}</div>
            </div>
          </div>

          <div class="${isOriginal ? 'question' : 'response'}-section">
            <div class="label">${isOriginal ? 'Question' : 'Response'}</div>
            <div class="content">${response.response}</div>
          </div>

          ${!isOriginal && rfi?.question ? `
          <div class="divider"></div>
          <div class="field">
            <div class="label">Original Question</div>
            <div class="content">${rfi.question}</div>
          </div>
          ` : ''}

          <div class="field">
            <div class="label">${isOriginal ? 'Submitted By' : 'Responded By'}</div>
            <div class="content">${response.responder_name} (${response.responder_position})</div>
          </div>

          <div class="field">
            <div class="label">${isOriginal ? 'Submission Date' : 'Response Date'}</div>
            <div class="content">${new Date(response.response_date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</div>
          </div>

          ${rfi?.priority ? `
          <div class="field">
            <div class="label">Priority</div>
            <div class="content">${rfi.priority.charAt(0).toUpperCase() + rfi.priority.slice(1)}</div>
          </div>
          ` : ''}
        </body>
      </html>
    `;

    return printContent;
  };

  const downloadResponsePDF = (response: RFIResponse, index: number) => {
    const printContent = generateResponsePDF(response, index);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  const downloadAllPDFs = () => {
    responses.forEach((response, index) => {
      setTimeout(() => {
        downloadResponsePDF(response, index);
      }, index * 1000); // Stagger downloads by 1 second
    });
  };

  const toggleMinimize = (responseId: string) => {
    setMinimizedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(responseId)) {
        newSet.delete(responseId);
      } else {
        newSet.add(responseId);
      }
      return newSet;
    });
  };

  if (!rfi) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isMinimized ? 'max-w-md h-auto' : 'max-w-3xl h-[70vh]'} flex flex-col transition-all duration-200`}>
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle>
              {isMinimized ? 'RFI Responses' : `RFI Responses - ${rfi.rfi_number || `RFI-${rfi.id.slice(0, 8)}`}`}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? "Expand" : "Minimize"}
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              {!isMinimized && responses.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadAllPDFs}
                  title="Download All PDFs"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Download All
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {isMinimized ? (
          <div className="p-4">
            <p className="text-sm text-muted-foreground">
              {responses.length} item{responses.length !== 1 ? 's' : ''} (Click expand to view)
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p>Loading responses...</p>
                </div>
              </div>
            ) : responses.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No Responses Yet</h3>
                  <p>This RFI hasn't received any responses.</p>
                </div>
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="space-y-4 p-4">
                  {responses.map((response, index) => {
                    const isMinimizedItem = minimizedItems.has(response.id);
                    const isOriginal = response.type === 'original';
                    const displayIndex = isOriginal ? 0 : index;
                    
                    return (
                      <div key={response.id} className="border rounded-lg overflow-hidden">
                        <div className={`${isOriginal ? 'bg-blue-50' : 'bg-green-50'} p-3 border-b flex items-center justify-between`}>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">
                              {isOriginal ? 'Original RFI' : `Response ${displayIndex}`}
                            </h3>
                            <span className="text-xs text-muted-foreground">
                              {new Date(response.response_date).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleMinimize(response.id)}
                            >
                              {isMinimizedItem ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadResponsePDF(response, displayIndex)}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        </div>
                        
                        {!isMinimizedItem && (
                          <div className="h-[300px]">
                            <iframe
                              srcDoc={generateResponsePDF(response, displayIndex)}
                              className="w-full h-full border-0"
                              title={`${isOriginal ? 'Original RFI' : `Response ${displayIndex}`} Preview`}
                            />
                          </div>
                        )}
                        
                        {isMinimizedItem && (
                          <div className="p-3 text-sm text-muted-foreground">
                            <p>By {response.responder_name} • Click expand to view</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};