import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, FileText, Download } from 'lucide-react';
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

  useEffect(() => {
    if (rfi && isOpen) {
      fetchResponses();
    }
  }, [rfi, isOpen]);

  const fetchResponses = async () => {
    if (!rfi) return;
    
    setLoading(true);
    try {
      // For now, we'll create mock responses based on the main RFI response
      // In a real implementation, you'd have a separate responses table
      const mockResponses: RFIResponse[] = [];
      
      if (rfi.response) {
        mockResponses.push({
          id: `${rfi.id}-response-1`,
          rfi_id: rfi.id,
          response: rfi.response,
          responder_name: rfi.responder_name || 'Unknown Responder',
          responder_position: rfi.responder_position || 'Team Member',
          response_date: rfi.response_date || rfi.updated_at,
          created_at: rfi.response_date || rfi.updated_at
        });
      }
      
      setResponses(mockResponses);
    } catch (error) {
      console.error('Error fetching responses:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateResponsePDF = (response: RFIResponse, index: number) => {
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>RFI Response ${index + 1} - ${rfi?.rfi_number || rfi?.id}</title>
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
              background: linear-gradient(135deg, #059669, #10b981);
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
              border-left: 4px solid #059669;
              background: #f0fdf4;
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
            .original-question {
              background: #f8fafc;
              border: 2px solid #e2e8f0;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .response-section {
              background: #f0fdf4;
              border: 2px solid #bbf7d0;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .divider {
              height: 2px;
              background: linear-gradient(90deg, #059669, #e2e8f0);
              margin: 30px 0;
              border-radius: 1px;
            }
            @media print {
              body { padding: 20px; }
              .header { background: #059669 !important; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>RFI Response ${index + 1}</h1>
            <div class="header-info">
              <div><strong>RFI Number:</strong> ${rfi?.rfi_number || `RFI-${rfi?.id.slice(0, 8)}`}</div>
              <div><strong>Response Date:</strong> ${new Date(response.response_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</div>
              <div><strong>Responder:</strong> ${response.responder_name}</div>
              <div><strong>Position:</strong> ${response.responder_position}</div>
            </div>
          </div>

          <div class="original-question">
            <div class="label">Original Question</div>
            <div class="content">${rfi?.question || 'N/A'}</div>
          </div>

          <div class="divider"></div>

          <div class="response-section">
            <div class="label">Response</div>
            <div class="content">${response.response}</div>
          </div>

          <div class="field">
            <div class="label">Submitted By</div>
            <div class="content">${response.responder_name} (${response.responder_position})</div>
          </div>

          <div class="field">
            <div class="label">Submission Date</div>
            <div class="content">${new Date(response.response_date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</div>
          </div>
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

  if (!rfi) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle>
              RFI Responses - {rfi.rfi_number || `RFI-${rfi.id.slice(0, 8)}`}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

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
            <div className="grid grid-cols-1 gap-4 h-full">
              {responses.map((response, index) => (
                <div key={response.id} className="border rounded-lg overflow-hidden">
                  <div className="bg-muted p-4 border-b flex items-center justify-between">
                    <h3 className="font-semibold">Response {index + 1}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {new Date(response.response_date).toLocaleDateString()}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadResponsePDF(response, index)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex-1 h-[400px]">
                    <iframe
                      srcDoc={generateResponsePDF(response, index)}
                      className="w-full h-full border-0"
                      title={`Response ${index + 1} Preview`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};