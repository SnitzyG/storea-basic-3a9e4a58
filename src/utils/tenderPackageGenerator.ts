import jsPDF from 'jspdf';
import { Tender } from '@/hooks/useTenders';

import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { supabase } from '@/integrations/supabase/client';

// Helper to convert tender construction items to export format
const prepareTenderConstructionItems = (tender: Tender) => {
  if (!tender.construction_items || !Array.isArray(tender.construction_items)) {
    return [];
  }
  return tender.construction_items.map((item: any) => item.id || item.item);
};

export const generateTenderPackage = async (tender: Tender) => {
  try {
    // Fetch uploaded documents from tender_package_documents
    const { data: packageDocs, error } = await supabase
      .from('tender_package_documents')
      .select('*')
      .eq('tender_id', tender.id);

    if (error) throw error;

    if (!packageDocs || packageDocs.length === 0) {
      throw new Error('No documents in tender package. Please upload or select at least one document.');
    }

    // Create ZIP package with uploaded documents only
    const zip = new JSZip();
    
    // Download and add each document to the ZIP
    for (const doc of packageDocs) {
      try {
        // Download file from storage
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('tender-packages')
          .download(doc.file_path);

        if (downloadError) {
          console.warn(`Failed to download ${doc.document_name}:`, downloadError);
          continue;
        }

        // Add file to ZIP with organized folder structure
        const folderName = doc.document_type.split(' - ')[0] || 'Other';
        zip.file(`${folderName}/${doc.document_name}`, fileData);
      } catch (err) {
        console.warn(`Error processing ${doc.document_name}:`, err);
      }
    }
    
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, `Tender_Package_${tender.title.replace(/[^a-z0-9]/gi, '_')}.zip`);
    
    return true;
  } catch (error) {
    console.error('Error generating tender package:', error);
    throw new Error('Failed to generate tender package');
  }
};

const generateTenderPDF = async (tender: Tender): Promise<Blob> => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const marginLeft = 20;
  const marginRight = 20;
  const contentWidth = pageWidth - marginLeft - marginRight;
  let yPos = 25;

  // Define colors (matching RFI style)
  const primaryColor: [number, number, number] = [37, 99, 235]; // blue-600
  const textColor: [number, number, number] = [31, 41, 55]; // gray-800
  const mutedColor: [number, number, number] = [107, 114, 128]; // gray-500

  // Helper function to add section headers
  const addSectionHeader = (title: string) => {
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = 25;
    }
    
    doc.setFillColor(241, 245, 249); // gray-100
    doc.rect(marginLeft - 5, yPos - 2, contentWidth + 10, 10, 'F');
    
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(title, marginLeft, yPos + 5);
    
    yPos += 15;
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFont('helvetica', 'normal');
  };

  // Helper function to add field with label
  const addField = (label: string, value: string, isMultiline = false) => {
    if (yPos > pageHeight - 30) {
      doc.addPage();
      yPos = 25;
    }
    
    doc.setFontSize(9);
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.text(label + ':', marginLeft, yPos);
    
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFontSize(10);
    
    if (isMultiline) {
      const lines = doc.splitTextToSize(value, contentWidth - 20);
      doc.text(lines, marginLeft + 5, yPos + 5);
      yPos += 5 + (lines.length * 5);
    } else {
      doc.text(value, marginLeft + 50, yPos);
      yPos += 7;
    }
  };

  // Header with colored background (RFI-style)
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text('TENDER PACKAGE', marginLeft, 15);
  
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(tender.title, marginLeft, 28);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const statusText = tender.status.toUpperCase().replace('_', ' ');
  doc.text(`Status: ${statusText}`, marginLeft, 38);
  
  yPos = 55;

  // STEP 1: Contract Type
  if (tender.requirements?.contract_type) {
    addSectionHeader('1. Contract Type');
    const contractInfo = tender.requirements.contract_type;
    if (contractInfo.type) addField('Type', contractInfo.type);
    if (contractInfo.payment_terms) addField('Payment Terms', contractInfo.payment_terms);
    if (contractInfo.retention) addField('Retention', contractInfo.retention);
    if (contractInfo.variations) addField('Variations Process', contractInfo.variations, true);
    yPos += 5;
  }

  // Project Information
  addSectionHeader('Project Information');
  if (tender.budget) addField('Budget', `$${tender.budget.toLocaleString()}`);
  addField('Submission Deadline', new Date(tender.deadline).toLocaleDateString());
  if (tender.estimated_start_date) addField('Estimated Start', new Date(tender.estimated_start_date).toLocaleDateString());
  yPos += 5;

  // STEP 3: Project Overview
  addSectionHeader('3. Project Overview');
  const overviewText = tender.description || 'No overview provided.';
  addField('Overview', overviewText, true);
  const timeline = (tender.requirements as any)?.timeline;
  if (timeline?.completion_weeks) addField('Estimated Duration', `${timeline.completion_weeks} weeks`);
  if (timeline?.completion_date) addField('Estimated Completion', timeline.completion_date);
  yPos += 5;

  // STEP 4: Project Scope
  if (tender.requirements?.scope) {
    addSectionHeader('4. Project Scope');

    const scopeObj = tender.requirements.scope as Record<string, string[]>;
    const humanize = (key: string) => key.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase());

    Object.entries(scopeObj).forEach(([category, items]) => {
      if (!items || items.length === 0) return;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.text(humanize(category), marginLeft, yPos);
      yPos += 6;

      doc.setFont('helvetica', 'normal');
      items.forEach(item => {
        if (yPos > pageHeight - 20) {
          doc.addPage();
          yPos = 25;
        }
        const lines = doc.splitTextToSize('• ' + item, contentWidth - 10);
        doc.text(lines, marginLeft + 3, yPos);
        yPos += lines.length * 5;
      });
      yPos += 3;
    });

    yPos += 5;
  }

  // STEP 5: Requirements & Compliance
  if (tender.requirements?.compliance) {
    addSectionHeader('5. Requirements & Compliance');
    const compliance: any = tender.requirements.compliance;

    if (Array.isArray(compliance) && compliance.length) {
      doc.setFont('helvetica', 'normal');
      compliance.forEach((item: string) => {
        if (yPos > pageHeight - 20) { doc.addPage(); yPos = 25; }
        const lines = doc.splitTextToSize('• ' + item, contentWidth - 10);
        doc.text(lines, marginLeft + 3, yPos);
        yPos += lines.length * 5;
      });
      yPos += 5;
    } else {
      if (compliance.certifications?.length) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Required Certifications:', marginLeft, yPos);
        yPos += 6;
        doc.setFont('helvetica', 'normal');
        compliance.certifications.forEach((cert: string) => {
          const certLines = doc.splitTextToSize('• ' + cert, contentWidth - 10);
          doc.text(certLines, marginLeft + 3, yPos);
          yPos += certLines.length * 5;
        });
        yPos += 3;
      }
      
      if (compliance.standards?.length) {
        doc.setFont('helvetica', 'bold');
        doc.text('Standards:', marginLeft, yPos);
        yPos += 6;
        doc.setFont('helvetica', 'normal');
        compliance.standards.forEach((std: string) => {
          const stdLines = doc.splitTextToSize('• ' + std, contentWidth - 10);
          doc.text(stdLines, marginLeft + 3, yPos);
          yPos += stdLines.length * 5;
        });
        yPos += 3;
      }
      
      if (compliance.insurance_requirements) {
        addField('Insurance Requirements', compliance.insurance_requirements, true);
      }
      
      yPos += 5;
    }
  }

  // STEP 6: Contractor Requirements  
  if (tender.requirements?.contractor || (tender as any).requirements?.contractor_requirements) {
    addSectionHeader('6. Contractor Requirements');
    const contractor = (tender.requirements as any).contractor || (tender as any).requirements?.contractor_requirements;

    if (Array.isArray(contractor)) {
      contractor.forEach((req: string) => {
        if (yPos > pageHeight - 20) { doc.addPage(); yPos = 25; }
        const lines = doc.splitTextToSize('• ' + req, contentWidth - 10);
        doc.text(lines, marginLeft + 3, yPos);
        yPos += lines.length * 5;
      });
      yPos += 5;
    } else if (contractor) {
      if (contractor.experience_years) addField('Minimum Experience', `${contractor.experience_years} years`);
      if (contractor.team_size) addField('Required Team Size', contractor.team_size);
      if (contractor.equipment) addField('Equipment Requirements', contractor.equipment, true);
      if (contractor.licenses) addField('Required Licenses', contractor.licenses, true);
      yPos += 5;
    }
  }

  // STEP 7: Environmental Targets
  if ((tender.requirements as any)?.environmental || (tender.requirements as any)?.environmental_targets || (tender.requirements as any)?.custom_environmental) {
    addSectionHeader('7. Environmental Targets');
    const envArray: string[] = (tender.requirements as any).environmental || [];
    const envTargets = (tender.requirements as any).environmental_targets;
    const customEnv: string | undefined = (tender.requirements as any).custom_environmental;

    if (Array.isArray(envArray) && envArray.length) {
      envArray.forEach((item: string) => {
        if (yPos > pageHeight - 20) { doc.addPage(); yPos = 25; }
        const lines = doc.splitTextToSize('• ' + item, contentWidth - 10);
        doc.text(lines, marginLeft + 3, yPos);
        yPos += lines.length * 5;
      });
      yPos += 3;
    }

    if (envTargets) {
      if (envTargets.energy_rating) addField('Target Energy Rating', envTargets.energy_rating);
      if (envTargets.water_efficiency) addField('Water Efficiency', envTargets.water_efficiency);
      if (envTargets.waste_management) addField('Waste Management', envTargets.waste_management, true);
      if (envTargets.materials) addField('Sustainable Materials', envTargets.materials, true);
    }

    if (customEnv) {
      addField('Additional Environmental Targets', customEnv, true);
    }

    yPos += 5;
  }

  // STEP 8: Communication & Objectives
  if ((tender.requirements as any)?.communication || (tender.requirements as any)?.communication_details) {
    addSectionHeader('8. Communication & Project Objectives');
    const commArray: string[] = (tender.requirements as any).communication || [];
    const commDetails: any = (tender.requirements as any).communication_details;

    if (Array.isArray(commArray) && commArray.length) {
      doc.setFont('helvetica', 'normal');
      commArray.forEach((item: string) => {
        if (yPos > pageHeight - 20) { doc.addPage(); yPos = 25; }
        const lines = doc.splitTextToSize('• ' + item, contentWidth - 10);
        doc.text(lines, marginLeft + 3, yPos);
        yPos += lines.length * 5;
      });
      yPos += 3;
    }

    if (commDetails) {
      if (commDetails.reporting_frequency) addField('Reporting Frequency', commDetails.reporting_frequency);
      if (commDetails.preferred_format) addField('Preferred Format', commDetails.preferred_format);
    }

    yPos += 5;
  }

  // Footer on all pages
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(128, 128, 128);
    
    doc.setDrawColor(200, 200, 200);
    doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);
    
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('STOREA', 15, pageHeight - 10);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(128, 128, 128);
    doc.setFontSize(7);
    doc.text(`Generated ${new Date().toLocaleDateString()}`, pageWidth - 15, pageHeight - 10, { align: 'right' });
  }
  
  return doc.output('blob');
};

const generateTenderExcel = async (tender: Tender): Promise<Blob> => {
  const XLSX = await import('xlsx');

  // Fetch saved line items and documents for this tender
  let dbLineItems: Array<{
    category: string;
    item_description: string;
    specification: string | null;
    quantity: number | null;
    unit_of_measure: string | null;
    line_number: number;
  }> = [];
  
  let tenderDocuments: Array<{
    document_type: string;
    document_content: string;
  }> = [];
  
  try {
    const { data, error } = await supabase
      .from('tender_line_items')
      .select('*')
      .eq('tender_id', tender.id)
      .order('line_number', { ascending: true });
    if (error) throw error;
    dbLineItems = data || [];
  } catch (e) {
    console.warn('Could not load tender_line_items:', e);
  }

  try {
    const { data, error } = await supabase
      .from('tender_package_documents')
      .select('document_type, document_content')
      .eq('tender_id', tender.id);
    if (error) throw error;
    tenderDocuments = data || [];
  } catch (e) {
    console.warn('Could not load tender_package_documents:', e);
  }

  const today = new Date().toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Professional header section with tender details
  const headerRows: any[][] = [
    ['TENDER PRICING SCHEDULE'],
    [''],
    [`Project: ${tender.title || 'N/A'}`],
    [`Address: ${(tender as any).project_address || 'N/A'}`],
    [`Client: ${(tender as any).client_name || 'N/A'}`],
    [`Reference: ${(tender as any).tender_reference_no || 'N/A'}`],
    [`Deadline: ${tender.deadline ? new Date(tender.deadline).toLocaleDateString('en-AU') : 'N/A'}`],
    [`Budget: ${tender.budget ? `$${tender.budget.toLocaleString()}` : 'N/A'}`],
    [`Start Date: ${(tender as any).estimated_start_date ? new Date((tender as any).estimated_start_date).toLocaleDateString('en-AU') : 'N/A'}`],
    [`Duration: ${(tender as any).completion_weeks ? `${(tender as any).completion_weeks} weeks` : 'N/A'}`],
    [''],
    [`Generated: ${today}`],
    [''],
    [''],
    ['PRICING SCHEDULE'],
    [''],
    ['Item #', 'Category', 'Description', 'Specification', 'Qty', 'Unit', 'Rate (AUD)', 'Total (AUD)', 'Notes'],
  ];

  // Build item rows from database - already ordered by line_number
  const itemRows: any[][] = [];
  if (dbLineItems.length > 0) {
    dbLineItems.forEach((it) => {
      itemRows.push([
        it.line_number || '',
        it.category || 'Uncategorized',
        it.item_description || '',
        it.specification || '',
        it.quantity ?? '',
        it.unit_of_measure || '',
        '', // Rate - to be filled by builder
        '', // Total - will be calculated
        ''  // Notes
      ]);
    });
  } else {
    itemRows.push(['', 'No line items available', 'Please upload construction drawings in Step 3', '', '', '', '', '', '']);
  }

  // Totals section with formulas
  const totalsRows: any[][] = [
    [''],
    [''],
    ['', '', '', '', '', '', 'Subtotal (AUD):', '', ''],
    ['', '', '', '', '', '', 'GST (10%):', '', ''],
    ['', '', '', '', '', '', 'TOTAL (AUD):', '', ''],
    [''],
    [''],
    ['BUILDER/CONTRACTOR DETAILS'],
    ['Company Name:', '', '', '', '', '', '', '', ''],
    ['ABN:', '', '', '', '', '', '', '', ''],
    ['Contact Person:', '', '', '', '', '', '', '', ''],
    ['Email:', '', '', '', '', '', '', '', ''],
    ['Phone:', '', '', '', '', '', '', '', ''],
    [''],
    ['Authorized Signature:', '', '', '', 'Date:', '', '', '', ''],
    [''],
    ['NOTES:'],
    ['• All prices are in Australian Dollars (AUD) excluding GST unless otherwise stated'],
    ['• This pricing schedule forms part of the tender submission'],
    ['• Payment terms and conditions as per the General Conditions of Contract'],
  ];

  const allRows = [...headerRows, ...itemRows, ...totalsRows];
  const lineItemsSheet = XLSX.utils.aoa_to_sheet(allRows);

  // Enhanced column widths for better presentation
  lineItemsSheet['!cols'] = [
    { wch: 8 },   // Item #
    { wch: 15 },  // Category
    { wch: 30 },  // Description
    { wch: 35 },  // Specification
    { wch: 8 },   // Qty
    { wch: 10 },  // Unit
    { wch: 12 },  // Rate
    { wch: 12 },  // Total
    { wch: 20 },  // Notes
  ];

  // Enable text wrapping for all cells in line items sheet
  const range = XLSX.utils.decode_range(lineItemsSheet['!ref'] || 'A1');
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      if (!lineItemsSheet[cellAddress]) continue;
      if (!lineItemsSheet[cellAddress].s) lineItemsSheet[cellAddress].s = {};
      lineItemsSheet[cellAddress].s.alignment = { wrapText: true, vertical: 'top' };
    }
  }

  // Formulas for line totals and summary
  const startDataRow = headerRows.length + 1; // 1-based Excel row index for first item row
  const endDataRow = headerRows.length + itemRows.length; // 1-based Excel row index for last item row

  for (let i = startDataRow; i <= endDataRow; i++) {
    const totalCell = XLSX.utils.encode_cell({ r: i - 1, c: 7 }); // H column (Total)
    const qtyRef = XLSX.utils.encode_cell({ r: i - 1, c: 4 }); // E (Qty)
    const rateRef = XLSX.utils.encode_cell({ r: i - 1, c: 6 }); // G (Rate)
    (lineItemsSheet as any)[totalCell] = {
      f: `IF(AND(ISNUMBER(${qtyRef}),ISNUMBER(${rateRef})),${qtyRef}*${rateRef},"")`,
      t: 'n',
      z: '$#,##0.00'
    };
  }

  // Summary formulas
  const subtotalRowR = headerRows.length + itemRows.length + 2; // Offset for spacing rows
  const gstRowR = subtotalRowR + 1;
  const grandRowR = subtotalRowR + 2;

  const subtotalCell = XLSX.utils.encode_cell({ r: subtotalRowR, c: 7 });
  const totalStart = XLSX.utils.encode_cell({ r: headerRows.length, c: 7 });
  const totalEnd = XLSX.utils.encode_cell({ r: headerRows.length + itemRows.length - 1, c: 7 });
  (lineItemsSheet as any)[subtotalCell] = { f: `SUM(${totalStart}:${totalEnd})`, t: 'n', z: '$#,##0.00' };

  const gstCell = XLSX.utils.encode_cell({ r: gstRowR, c: 7 });
  (lineItemsSheet as any)[gstCell] = { f: `${subtotalCell}*0.10`, t: 'n', z: '$#,##0.00' };

  const grandCell = XLSX.utils.encode_cell({ r: grandRowR, c: 7 });
  (lineItemsSheet as any)[grandCell] = { f: `${subtotalCell}+${gstCell}`, t: 'n', z: '$#,##0.00' };

  // Merge cells for better presentation
  (lineItemsSheet as any)['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }, // Title
    { s: { r: 14, c: 0 }, e: { r: 14, c: 8 } }, // Pricing Schedule header
  ];
  
  // Set row heights for better readability
  (lineItemsSheet as any)['!rows'] = [
    { hpt: 30 }, // Title row
  ];

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, lineItemsSheet, 'Line Items');
  
  // Helper function to create document sheet from sections
  const createDocumentSheet = (documentType: string, sections: any[]) => {
    const docRows: any[][] = [
      [documentType.toUpperCase()],
      [''],
      ['Section', 'Content'],
    ];

    sections.forEach((section: any) => {
      const title = section.title ?? '';
      const rawContent = section.content ?? '';

      // Section header row
      docRows.push([title, '']);

      // Split content into separate rows by newlines or bullet markers
      const lines: string[] = Array.isArray(rawContent)
        ? rawContent.flatMap((v: any) => String(v).split(/\r?\n/))
        : String(rawContent)
            .replace(/\r\n/g, '\n')
            .split(/\n|(?:^|\s)•\s+/);

      lines
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
        .forEach((line) => {
          docRows.push(['', line]);
        });

      // Spacer row after each section
      docRows.push(['', '']);
    });

    const ws = XLSX.utils.aoa_to_sheet(docRows);

    // Narrower, more readable columns
    ws['!cols'] = [
      { wch: 28 }, // Section title
      { wch: 60 }, // Content lines
    ];

    // Merge the main title across both columns
    (ws as any)['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
    ];

    // Ensure content rows are readable with top alignment (wrapping is fine per-cell)
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const addr = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[addr]) continue;
        if (!ws[addr].s) (ws as any)[addr].s = {};
        (ws as any)[addr].s.alignment = { wrapText: true, vertical: 'top' };
      }
    }

    return ws;
  };
  
  // Add document tabs for each saved tender document
  const documentTypeMapping: Record<string, string> = {
    'General Conditions of Contract': 'General Conditions',
    'Contract Schedules': 'Contract Schedules',
    'Schedules of Monetary Sums': 'Monetary Sums',
    'Tender Schedules': 'Tender Schedules',
    'Technical Specifications': 'Tech Specs',
    'Technical Schedules': 'Tech Schedules',
    'Bills of Quantities': 'Bills of Quantities',
  };
  
  tenderDocuments.forEach(doc => {
    try {
      const sections = JSON.parse(doc.document_content);
      const sheetName = documentTypeMapping[doc.document_type] || doc.document_type.substring(0, 30);
      const sheet = createDocumentSheet(doc.document_type, sections);
      XLSX.utils.book_append_sheet(wb, sheet, sheetName);
    } catch (e) {
      console.warn(`Could not parse document ${doc.document_type}:`, e);
    }
  });

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};

