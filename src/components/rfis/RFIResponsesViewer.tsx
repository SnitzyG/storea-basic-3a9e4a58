import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, FileText, Download, Minimize2, Maximize2, Package, Eye, Paperclip } from 'lucide-react';
import { RFI } from '@/hooks/useRFIs';
import { supabase } from '@/integrations/supabase/client';
import jsPDF from 'jspdf';

interface RFIResponse {
  id: string;
  rfi_id: string;
  response: string;
  responder_name: string;
  responder_position: string;
  response_date: string;
  created_at: string;
  type: 'original' | 'response';
  attachments?: Array<{
    name: string;
    url: string;
    size?: number;
  }>;
}

interface RFIResponsesViewerProps {
  rfi: RFI | null;
  isOpen: boolean;
  onClose: () => void;
  onCreateResponse?: (rfi: RFI) => void;
}

export const RFIResponsesViewer: React.FC<RFIResponsesViewerProps> = ({
  rfi,
  isOpen,
  onClose,
  onCreateResponse
}) => {
  const [responses, setResponses] = useState<RFIResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [minimizedItems, setMinimizedItems] = useState<Set<string>>(new Set());
  const [isMinimized, setIsMinimized] = useState(false); // Start expanded by default

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
        type: 'original',
        attachments: rfi.attachments || []
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

  const generateResponsePDF = async (response: RFIResponse, index: number) => {
    const isOriginal = response.type === 'original';
    const title = isOriginal ? 'Original RFI' : `Response ${index}`;
    
    // Fetch company details from profile
    let companyDetails = {
      logo: '',
      address: '',
      phone: '',
      name: rfi?.raised_by_company_name || 'Unknown Company'
    };

    try {
      if (rfi?.raised_by) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_logo_url, company_address, phone, company_name')
          .eq('user_id', rfi.raised_by)
          .single();
        
        if (profile) {
          companyDetails = {
            logo: profile.company_logo_url || '',
            address: profile.company_address || '',
            phone: profile.phone || '',
            name: profile.company_name || rfi?.raised_by_company_name || 'Unknown Company'
          };
        }
      }
    } catch (error) {
      console.error('Error fetching company details:', error);
    }
    
    // Get project and company information
    const projectName = rfi?.project_name || 'Unknown Project';
    const projectReference = rfi?.project_id || 'No Reference';
    const rfiDescription = rfi?.question || 'No description available';
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    const dueDate = rfi?.due_date ? new Date(rfi.due_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : 'Not specified';
    
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title} - ${rfi?.rfi_number || rfi?.id}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: Arial, sans-serif;
              line-height: 1.4;
              color: #000;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
              background: white;
            }
            .mail-header {
              border: 2px solid #000;
              padding: 20px;
              margin-bottom: 30px;
              background: #f9f9f9;
            }
            .mail-header h1 {
              text-align: center;
              font-size: 18px;
              margin-bottom: 20px;
              text-decoration: underline;
            }
            .mail-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              font-size: 12px;
            }
            .mail-info div {
              margin-bottom: 8px;
            }
            .mail-info strong {
              display: inline-block;
              width: 120px;
              font-weight: bold;
            }
            .section {
              margin-bottom: 25px;
              border: 1px solid #ccc;
              padding: 15px;
            }
            .section-header {
              font-weight: bold;
              font-size: 14px;
              margin-bottom: 10px;
              text-decoration: underline;
            }
            .content-text {
              font-size: 12px;
              margin-bottom: 10px;
              white-space: pre-wrap;
            }
            .metadata {
              font-size: 11px;
              color: #666;
              margin-top: 10px;
            }
            .metadata div {
              margin-bottom: 3px;
            }
            .status-section {
              border: 2px solid #000;
              padding: 10px;
              text-align: center;
              font-weight: bold;
              margin-top: 20px;
            }
            @media print {
              body { padding: 10px; }
            }
          </style>
        </head>
        <body>
          <div class="mail-header">
            <h1>MAIL HEADER INFORMATION</h1>
            <div class="mail-info">
              <div><strong>Mail #:</strong> ${rfi?.rfi_number || `Mail-${rfi?.id.slice(0, 8)}`}</div>
              <div><strong>Date:</strong> ${currentDate}</div>
              <div><strong>To (Name and Title):</strong> ${response.responder_name} - ${response.responder_position}</div>
              <div><strong>Date Need By:</strong> ${dueDate}</div>
              <div><strong>Company:</strong> ${companyDetails.name}</div>
              <div><strong>Project Name:</strong> ${projectName}</div>
              <div><strong>Project Reference:</strong> ${projectReference}</div>
              <div style="grid-column: 1 / -1;"><strong>RFI Description:</strong> ${rfiDescription}</div>
            </div>
            ${companyDetails.logo ? `
            <div style="margin-top: 15px; text-align: center;">
              <img src="${companyDetails.logo}" alt="Company Logo" style="max-height: 60px; max-width: 200px;" />
            </div>
            ` : ''}
            ${companyDetails.address || companyDetails.phone ? `
            <div style="margin-top: 10px; font-size: 11px; text-align: center;">
              ${companyDetails.address ? `<div><strong>Address:</strong> ${companyDetails.address}</div>` : ''}
              ${companyDetails.phone ? `<div><strong>Phone:</strong> ${companyDetails.phone}</div>` : ''}
            </div>
            ` : ''}
          </div>

          ${isOriginal ? `
          <div class="section">
            <div class="section-header">QUESTION</div>
            <div class="content-text">${rfi?.question || 'No question available'}</div>
            <div class="metadata">
              <div><strong>Submitted By:</strong> ${response.responder_name}</div>
              <div><strong>Submission Date:</strong> ${new Date(response.response_date || response.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</div>
              <div><strong>Priority:</strong> ${rfi?.priority ? rfi.priority.charAt(0).toUpperCase() + rfi.priority.slice(1) : 'Standard'}</div>
            </div>
          </div>
          ` : `
          <div class="section">
            <div class="section-header">RESPONSE</div>
            <div class="content-text">${response.response}</div>
            <div class="metadata">
              <div><strong>Responded By:</strong> ${response.responder_name}</div>
              <div><strong>Responded Date:</strong> ${new Date(response.response_date || response.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</div>
              <div><strong>Priority:</strong> ${rfi?.priority ? rfi.priority.charAt(0).toUpperCase() + rfi.priority.slice(1) : 'Standard'}</div>
            </div>
          </div>
          `}

          <div class="status-section">
            <div>STATUS: ${rfi?.status ? rfi.status.toUpperCase().replace('_', ' ') : 'PENDING'}</div>
          </div>
        </body>
      </html>
    `;

    return printContent;
  };

  const downloadResponsePDF = async (response: RFIResponse, index: number) => {
    const printContent = await generateResponsePDF(response, index);
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
    const pdf = new jsPDF();
    let pageHeight = pdf.internal.pageSize.height;
    let yPosition = 20;

    responses.forEach((response, index) => {
      if (index > 0) {
        pdf.addPage();
        yPosition = 20;
      }

      const isOriginal = response.type === 'original';
      const title = isOriginal ? 'Original RFI' : `Response ${index}`;
      
      // Add title
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(title, 20, yPosition);
      yPosition += 15;

      // Add RFI number
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Mail: ${rfi?.rfi_number || `Mail-${rfi?.id.slice(0, 8)}`}`, 20, yPosition);
      yPosition += 10;

      // Add date
      const date = new Date(response.response_date || response.created_at);
      pdf.text(`Date: ${date.toLocaleDateString()}`, 20, yPosition);
      yPosition += 15;

      // Add content
      if (isOriginal && rfi?.question) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('Question:', 20, yPosition);
        yPosition += 8;
        pdf.setFont('helvetica', 'normal');
        const questionLines = pdf.splitTextToSize(rfi.question, 170);
        pdf.text(questionLines, 20, yPosition);
        yPosition += questionLines.length * 5 + 10;
      }

      if (response.response) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('Response:', 20, yPosition);
        yPosition += 8;
        pdf.setFont('helvetica', 'normal');
        const responseLines = pdf.splitTextToSize(response.response, 170);
        pdf.text(responseLines, 20, yPosition);
        yPosition += responseLines.length * 5 + 10;
      }

      // Add attachments info
      if (response.attachments && response.attachments.length > 0) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('Attachments:', 20, yPosition);
        yPosition += 8;
        pdf.setFont('helvetica', 'normal');
        response.attachments.forEach(attachment => {
          pdf.text(`• ${attachment.name}`, 25, yPosition);
          yPosition += 6;
        });
      }
    });

    pdf.save(`RFI-${rfi?.rfi_number || rfi?.id}-responses.pdf`);
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
              {onCreateResponse && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => onCreateResponse(rfi)}
                  title="Add Response"
                >
                  Add Response
                </Button>
              )}
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
                              onClick={async () => await downloadResponsePDF(response, displayIndex)}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        </div>
                        
                        {!isMinimizedItem && (
                          <div className="p-4 max-h-[400px] overflow-y-auto">
                            {/* Activity Timeline View */}
                            <div className="space-y-4">
                              <div className="flex items-start gap-3">
                                <div className={`w-2 h-2 rounded-full mt-2 ${isOriginal ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="font-medium">{response.responder_name}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {response.responder_position}
                                    </span>
                                    <span className="text-xs text-muted-foreground">•</span>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(response.response_date).toLocaleString()}
                                    </span>
                                  </div>
                                  
                                  <div className="bg-muted/50 rounded-lg p-3 mb-3">
                                    <p className="text-sm whitespace-pre-wrap">{response.response}</p>
                                  </div>

                                  {/* Attachments */}
                                  {response.attachments && response.attachments.length > 0 && (
                                    <div className="space-y-2">
                                      <h4 className="text-sm font-medium flex items-center gap-1">
                                        <Paperclip className="h-4 w-4" />
                                        Attachments ({response.attachments.length})
                                      </h4>
                                      <div className="grid grid-cols-1 gap-2">
                                        {response.attachments.map((attachment, attIndex) => (
                                          <div key={attIndex} className="flex items-center justify-between p-2 bg-background border rounded">
                                            <div className="flex items-center gap-2">
                                              <FileText className="h-4 w-4 text-muted-foreground" />
                                              <span className="text-sm truncate">{attachment.name}</span>
                                              {attachment.size && (
                                                <span className="text-xs text-muted-foreground">
                                                  ({(attachment.size / 1024).toFixed(1)} KB)
                                                </span>
                                              )}
                                            </div>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => window.open(attachment.url, '_blank')}
                                              className="h-7 w-7 p-0"
                                            >
                                              <Download className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {isMinimizedItem && (
                          <div className="p-3 text-sm text-muted-foreground">
                            <p>By {response.responder_name} • Click expand to view details</p>
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