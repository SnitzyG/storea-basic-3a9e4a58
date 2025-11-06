import jsPDF from 'jspdf';
import { Tender } from '@/hooks/useTenders';

interface TenderPDFData extends Tender {
  project_address?: string;
  client_name?: string;
  tender_reference_no?: string;
  contract_type?: string;
  scope_details?: any;
  compliance_requirements?: string;
  contractor_requirements?: string;
  completion_weeks?: string;
  environmental_targets?: string;
  communication_objectives?: string;
  defect_rate?: string;
  site_conditions?: any;
  evaluation_criteria?: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  clarification_deadline?: string;
  tender_validity?: string;
  additional_conditions?: string;
}

export const generateTenderPDF = (tender: TenderPDFData) => {
  try {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const marginLeft = 20;
    const marginRight = 20;
    const contentWidth = pageWidth - marginLeft - marginRight;
    let yPos = 25;

    // Primary Color for branding
    const primaryColor: [number, number, number] = [59, 130, 246]; // Blue
    const accentColor: [number, number, number] = [16, 185, 129]; // Green

    // Header with colored background
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
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
    doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.roundedRect(15, yPos - 4, 40, 8, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text(tender.status.toUpperCase(), 20, yPos + 1);
    
    yPos += 15;

    // Section: Project Information
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(240, 240, 240);
    doc.rect(15, yPos - 5, pageWidth - 30, 10, 'F');
    doc.text('PROJECT INFORMATION', 20, yPos);
    yPos += 12;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const projectInfo: Array<[string, string]> = [
      ['Issued by:', tender.issued_by_profile?.name || 'Unknown'],
      ['Created:', new Date(tender.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })],
      ['Deadline:', `${new Date(tender.deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} at ${new Date(tender.deadline).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`],
    ];
    
    if (tender.project_address) {
      projectInfo.push(['Project Address:', tender.project_address]);
    }
    
    if (tender.client_name) {
      projectInfo.push(['Client Name:', tender.client_name]);
    }
    
    if (tender.tender_reference_no) {
      projectInfo.push(['Reference No.:', tender.tender_reference_no]);
    }
    
    if (tender.budget) {
      projectInfo.push(['Budget:', `$${tender.budget.toLocaleString()}`]);
    }
    
    if (tender.estimated_start_date) {
      projectInfo.push(['Estimated Start:', new Date(tender.estimated_start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })]);
    }
    
    if (tender.completion_weeks) {
      projectInfo.push(['Completion Timeline:', `${tender.completion_weeks} weeks`]);
    }
    
    if (tender.contract_type) {
      projectInfo.push(['Contract Type:', tender.contract_type.replace('_', ' ').toUpperCase()]);
    }
    
    projectInfo.push(['Bids Received:', `${tender.bid_count || 0}`]);
    
    projectInfo.forEach(([label, value]) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFont('helvetica', 'bold');
      doc.text(label, 20, yPos);
      doc.setFont('helvetica', 'normal');
      const valueLines = doc.splitTextToSize(value, pageWidth - 80);
      doc.text(valueLines, 70, yPos);
      yPos += Math.max(7, valueLines.length * 5);
    });
    
    yPos += 5;

    // Section: Project Overview
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(240, 240, 240);
    doc.rect(15, yPos - 5, pageWidth - 30, 10, 'F');
    doc.text('PROJECT OVERVIEW', 20, yPos);
    yPos += 12;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const descriptionLines = doc.splitTextToSize(tender.description || 'No description provided', pageWidth - 40);
    doc.setFillColor(250, 250, 250);
    const descHeight = descriptionLines.length * 5 + 10;
    doc.roundedRect(15, yPos - 5, pageWidth - 30, descHeight, 2, 2, 'F');
    doc.text(descriptionLines, 20, yPos);
    yPos += descriptionLines.length * 5 + 15;

    // Helper function to add scope section
    const addScopeSection = (title: string, scopeData: any) => {
      if (!scopeData) return;
      
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(245, 245, 245);
      doc.rect(15, yPos - 4, pageWidth - 30, 8, 'F');
      doc.text(title, 20, yPos);
      yPos += 10;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      const items: string[] = [];
      Object.entries(scopeData).forEach(([key, value]) => {
        if (key === 'custom' && value) {
          // Add custom text separately
        } else if (value === true) {
          // Convert camelCase to readable text
          const readableKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          items.push(readableKey);
        }
      });
      
      if (items.length > 0) {
        items.forEach(item => {
          if (yPos > 275) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(`• ${item}`, 22, yPos);
          yPos += 5;
        });
      }
      
      if (scopeData.custom) {
        yPos += 2;
        doc.setFont('helvetica', 'italic');
        const customLines = doc.splitTextToSize(scopeData.custom, pageWidth - 50);
        customLines.forEach((line: string) => {
          if (yPos > 275) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(line, 22, yPos);
          yPos += 5;
        });
        doc.setFont('helvetica', 'normal');
      }
      
      yPos += 5;
    };

    // Section: Project Scope
    if (tender.scope_details) {
      if (yPos > 230) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(240, 240, 240);
      doc.rect(15, yPos - 5, pageWidth - 30, 10, 'F');
      doc.text('PROJECT SCOPE', 20, yPos);
      yPos += 15;

      if (tender.scope_details.sitePreparation) {
        addScopeSection('Site Preparation', tender.scope_details.sitePreparation);
      }
      if (tender.scope_details.foundations) {
        addScopeSection('Foundations & Structure', tender.scope_details.foundations);
      }
      if (tender.scope_details.buildingEnvelope) {
        addScopeSection('Building Envelope', tender.scope_details.buildingEnvelope);
      }
      if (tender.scope_details.internalWorks) {
        addScopeSection('Internal Works', tender.scope_details.internalWorks);
      }
      if (tender.scope_details.services) {
        addScopeSection('Services', tender.scope_details.services);
      }
      if (tender.scope_details.externalWorks) {
        addScopeSection('External Works', tender.scope_details.externalWorks);
      }
    }

    // Section: Requirements & Compliance
    if (tender.compliance_requirements || tender.contractor_requirements) {
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
      
      if (tender.compliance_requirements) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Compliance Requirements:', 20, yPos);
        yPos += 7;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const complianceLines = doc.splitTextToSize(tender.compliance_requirements, pageWidth - 40);
        complianceLines.forEach((line: string) => {
          if (yPos > 275) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(line, 20, yPos);
          yPos += 5;
        });
        yPos += 8;
      }
      
      if (tender.contractor_requirements) {
        if (yPos > 260) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Contractor Must Provide:', 20, yPos);
        yPos += 7;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const contractorLines = doc.splitTextToSize(tender.contractor_requirements, pageWidth - 40);
        contractorLines.forEach((line: string) => {
          if (yPos > 275) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(line, 20, yPos);
          yPos += 5;
        });
        yPos += 10;
      }
    }

    // Section: Project Objectives
    if (tender.environmental_targets || tender.communication_objectives || tender.defect_rate) {
      if (yPos > 230) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(240, 240, 240);
      doc.rect(15, yPos - 5, pageWidth - 30, 10, 'F');
      doc.text('PROJECT OBJECTIVES', 20, yPos);
      yPos += 12;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      if (tender.environmental_targets) {
        doc.setFont('helvetica', 'bold');
        doc.text('Environmental Targets:', 20, yPos);
        yPos += 6;
        doc.setFont('helvetica', 'normal');
        const envLines = doc.splitTextToSize(tender.environmental_targets, pageWidth - 40);
        envLines.forEach((line: string) => {
          if (yPos > 275) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(line, 20, yPos);
          yPos += 5;
        });
        yPos += 5;
      }
      
      if (tender.communication_objectives) {
        if (yPos > 260) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFont('helvetica', 'bold');
        doc.text('Communication Objectives:', 20, yPos);
        yPos += 6;
        doc.setFont('helvetica', 'normal');
        const commLines = doc.splitTextToSize(tender.communication_objectives, pageWidth - 40);
        commLines.forEach((line: string) => {
          if (yPos > 275) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(line, 20, yPos);
          yPos += 5;
        });
        yPos += 5;
      }
      
      if (tender.defect_rate) {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFont('helvetica', 'bold');
        doc.text(`Target Defect Rate:`, 20, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(`Below ${tender.defect_rate}%`, 70, yPos);
        yPos += 10;
      }
    }

    // Section: Site Conditions
    if (tender.site_conditions) {
      if (yPos > 220) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(240, 240, 240);
      doc.rect(15, yPos - 5, pageWidth - 30, 10, 'F');
      doc.text('SITE CONDITIONS', 20, yPos);
      yPos += 12;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const siteInfo: Array<[string, string]> = [];
      
      if (tender.site_conditions.soilClassification) {
        siteInfo.push(['Soil Classification:', tender.site_conditions.soilClassification]);
      }
      if (tender.site_conditions.servicesAvailable) {
        siteInfo.push(['Services Available:', tender.site_conditions.servicesAvailable]);
      }
      if (tender.site_conditions.accessDetails) {
        siteInfo.push(['Site Access:', tender.site_conditions.accessDetails]);
      }
      if (tender.site_conditions.workingHours) {
        siteInfo.push(['Working Hours:', tender.site_conditions.workingHours]);
      }
      
      siteInfo.forEach(([label, value]) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFont('helvetica', 'bold');
        doc.text(label, 20, yPos);
        doc.setFont('helvetica', 'normal');
        const valueLines = doc.splitTextToSize(value, pageWidth - 80);
        doc.text(valueLines, 70, yPos);
        yPos += Math.max(7, valueLines.length * 5);
      });
      
      yPos += 5;
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
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
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

    // Section: Evaluation Criteria
    if (tender.evaluation_criteria) {
      if (yPos > 230) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(240, 240, 240);
      doc.rect(15, yPos - 5, pageWidth - 30, 10, 'F');
      doc.text('EVALUATION CRITERIA', 20, yPos);
      yPos += 12;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const evalLines = doc.splitTextToSize(tender.evaluation_criteria, pageWidth - 40);
      evalLines.forEach((line: string) => {
        if (yPos > 275) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(line, 20, yPos);
        yPos += 5;
      });
      yPos += 10;
    }

    // Section: Contact & Deadlines
    if (tender.contact_person || tender.contact_email || tender.clarification_deadline) {
      if (yPos > 220) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(240, 240, 240);
      doc.rect(15, yPos - 5, pageWidth - 30, 10, 'F');
      doc.text('CONTACT & IMPORTANT DATES', 20, yPos);
      yPos += 12;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const contactInfo: Array<[string, string]> = [];
      
      if (tender.contact_person) {
        contactInfo.push(['Contact Person:', tender.contact_person]);
      }
      if (tender.contact_email) {
        contactInfo.push(['Email:', tender.contact_email]);
      }
      if (tender.contact_phone) {
        contactInfo.push(['Phone:', tender.contact_phone]);
      }
      if (tender.clarification_deadline) {
        contactInfo.push(['Clarification Questions Close:', new Date(tender.clarification_deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })]);
      }
      if (tender.tender_validity) {
        contactInfo.push(['Tender Validity:', `${tender.tender_validity} days from closing date`]);
      }
      
      contactInfo.forEach(([label, value]) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFont('helvetica', 'bold');
        doc.text(label, 20, yPos);
        doc.setFont('helvetica', 'normal');
        const valueLines = doc.splitTextToSize(value, pageWidth - 80);
        doc.text(valueLines, 75, yPos);
        yPos += Math.max(7, valueLines.length * 5);
      });
      yPos += 5;
    }

    // Section: Additional Conditions
    if (tender.additional_conditions) {
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(240, 240, 240);
      doc.rect(15, yPos - 5, pageWidth - 30, 10, 'F');
      doc.text('CONDITIONS OF TENDER', 20, yPos);
      yPos += 12;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const conditionsLines = doc.splitTextToSize(tender.additional_conditions, pageWidth - 40);
      conditionsLines.forEach((line: string) => {
        if (yPos > 275) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(line, 20, yPos);
        yPos += 5;
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
      doc.text('INVITED BUILDER', 20, yPos);
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
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('STOREA', 15, pageHeight - 10);
      
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
