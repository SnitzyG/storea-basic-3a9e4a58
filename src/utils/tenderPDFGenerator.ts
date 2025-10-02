import jsPDF from 'jspdf';
import { Tender } from '@/hooks/useTenders';

export const generateTenderPDF = (tender: Tender) => {
  try {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let yPos = 20;

    // Primary Color for branding
    const primaryColor: [number, number, number] = [59, 130, 246]; // Blue
    const accentColor: [number, number, number] = [16, 185, 129]; // Green

    // Header with colored background
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('TENDER PACKAGE', pageWidth / 2, 18, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text(tender.title, pageWidth / 2, 30, { align: 'center' });
    
    yPos = 50;

    // Status Badge
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    const statusColor = tender.status === 'open' ? accentColor : 
                       tender.status === 'closed' ? [251, 146, 60] as [number, number, number] :
                       tender.status === 'awarded' ? [59, 130, 246] as [number, number, number] :
                       [156, 163, 175] as [number, number, number];
    doc.setFillColor(...statusColor);
    doc.roundedRect(15, yPos - 4, 40, 8, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text(tender.status.toUpperCase(), 20, yPos + 1);
    
    yPos += 15;

    // Section: Basic Information
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(240, 240, 240);
    doc.rect(15, yPos - 5, pageWidth - 30, 10, 'F');
    doc.text('BASIC INFORMATION', 20, yPos);
    yPos += 12;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const basicInfo: Array<[string, string]> = [
      ['Issued by:', tender.issued_by_profile?.name || 'Unknown'],
      ['Created:', new Date(tender.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })],
      ['Deadline:', `${new Date(tender.deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} at ${new Date(tender.deadline).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`],
    ];
    
    if (tender.budget) {
      basicInfo.push(['Budget:', `$${tender.budget.toLocaleString()}`]);
    }
    
    if (tender.estimated_start_date) {
      basicInfo.push(['Estimated Start:', new Date(tender.estimated_start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })]);
    }
    
    basicInfo.push(['Bids Received:', `${tender.bid_count || 0}`]);
    
    basicInfo.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(value, 60, yPos);
      yPos += 7;
    });
    
    yPos += 5;

    // Section: Description
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(240, 240, 240);
    doc.rect(15, yPos - 5, pageWidth - 30, 10, 'F');
    doc.text('DESCRIPTION', 20, yPos);
    yPos += 12;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const descriptionLines = doc.splitTextToSize(tender.description || 'No description provided', pageWidth - 40);
    doc.setFillColor(250, 250, 250);
    const descHeight = descriptionLines.length * 5 + 10;
    doc.roundedRect(15, yPos - 5, pageWidth - 30, descHeight, 2, 2, 'F');
    doc.text(descriptionLines, 20, yPos);
    yPos += descriptionLines.length * 5 + 15;

    // Section: Requirements
    if (tender.requirements && tender.requirements.description) {
      if (yPos > 230) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(240, 240, 240);
      doc.rect(15, yPos - 5, pageWidth - 30, 10, 'F');
      doc.text('REQUIREMENTS', 20, yPos);
      yPos += 12;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const reqLines = doc.splitTextToSize(tender.requirements.description, pageWidth - 40);
      doc.setFillColor(250, 250, 250);
      const reqHeight = reqLines.length * 5 + 10;
      doc.roundedRect(15, yPos - 5, pageWidth - 30, reqHeight, 2, 2, 'F');
      doc.text(reqLines, 20, yPos);
      yPos += reqLines.length * 5 + 15;
    }

    // Section: Construction Items Table
    if (tender.construction_items && Array.isArray(tender.construction_items) && tender.construction_items.length > 0) {
      if (yPos > 220) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(240, 240, 240);
      doc.rect(15, yPos - 5, pageWidth - 30, 10, 'F');
      doc.text('CONSTRUCTION ITEMS', 20, yPos);
      yPos += 15;
      
      // Create simple table manually - widths adjusted to fit within page margins (180mm total)
      const colWidths = [20, 15, 45, 18, 15, 20, 20, 27];
      const headers = ['Section', 'Item', 'Description', 'Quantity', 'Unit', 'Rate', 'Total', 'Notes'];
      let xPos = 15;
      
      // Draw header
      doc.setFillColor(...primaryColor);
      doc.rect(15, yPos - 6, pageWidth - 30, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      
      headers.forEach((header, i) => {
        doc.text(header, xPos + 2, yPos);
        xPos += colWidths[i];
      });
      
      yPos += 10;
      
      // Draw rows
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      
      tender.construction_items.forEach((item: any, index: number) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        
        // Alternate row colors
        if (index % 2 === 1) {
          doc.setFillColor(250, 250, 250);
          doc.rect(15, yPos - 6, pageWidth - 30, 8, 'F');
        }
        
        xPos = 15;
        const rowData = [
          (item.section || 'General').substring(0, 15),
          (item.item_code || item.code || '-').substring(0, 10),
          (item.description || item.name || item.title || 'Item').substring(0, 35),
          (item.quantity?.toString() || '-').substring(0, 8),
          (item.unit || '-').substring(0, 8),
          item.rate ? `$${parseFloat(item.rate).toFixed(2)}` : '-',
          item.total ? `$${parseFloat(item.total).toFixed(2)}` : '-',
          (item.notes || '-').substring(0, 20)
        ];
        
        rowData.forEach((data, i) => {
          doc.text(data, xPos + 2, yPos);
          xPos += colWidths[i];
        });
        
        yPos += 8;
      });
      
      yPos += 10;
    }

    // Section: Builder Information
    if (tender.builder_company_name) {
      if (yPos > 230) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(240, 240, 240);
      doc.rect(15, yPos - 5, pageWidth - 30, 10, 'F');
      doc.text('BUILDER INFORMATION', 20, yPos);
      yPos += 12;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const builderInfo: Array<[string, string]> = [
        ['Company:', tender.builder_company_name]
      ];
      
      if (tender.builder_contact_person) {
        builderInfo.push(['Contact Person:', tender.builder_contact_person]);
      }
      
      if (tender.builder_email) {
        builderInfo.push(['Email:', tender.builder_email]);
      }
      
      if (tender.builder_phone) {
        builderInfo.push(['Phone:', tender.builder_phone]);
      }
      
      if (tender.builder_address) {
        builderInfo.push(['Address:', tender.builder_address]);
      }
      
      builderInfo.forEach(([label, value]) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFont('helvetica', 'bold');
        doc.text(label, 20, yPos);
        doc.setFont('helvetica', 'normal');
        const valueLines = doc.splitTextToSize(value, pageWidth - 80);
        doc.text(valueLines, 60, yPos);
        yPos += valueLines.length * 7;
      });
    }
    
    // Footer on all pages
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(128, 128, 128);
      
      // Footer line
      doc.setDrawColor(200, 200, 200);
      doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);
      
      // Page number
      doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      
      // Branding
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      doc.text('STOREALite', 15, pageHeight - 10);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(128, 128, 128);
      doc.setFontSize(7);
      doc.text(`Generated ${new Date().toLocaleDateString()}`, pageWidth - 15, pageHeight - 10, { align: 'right' });
    }
    
    // Save the PDF
    const filename = `Tender_${tender.title.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.pdf`;
    doc.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF. Please check the console for details.');
  }
};
