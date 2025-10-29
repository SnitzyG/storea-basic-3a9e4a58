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
    // Generate PDF for steps 1,3,4,5,6,7,8
    const pdfBlob = await generateTenderPDF(tender);
    
    // Generate Excel for step 2 (construction items)
    const excelBlob = await generateTenderExcel(tender);
    
    // Create ZIP package
    const zip = new JSZip();
    zip.file(`${tender.title}_Details.pdf`, pdfBlob);
    zip.file(`${tender.title}_Pricing_Template.xlsx`, excelBlob);
    
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
    doc.text('STOREALite', 15, pageHeight - 10);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(128, 128, 128);
    doc.setFontSize(7);
    doc.text(`Generated ${new Date().toLocaleDateString()}`, pageWidth - 15, pageHeight - 10, { align: 'right' });
  }
  
  return doc.output('blob');
};

const generateTenderExcel = async (tender: Tender): Promise<Blob> => {
  const XLSX = await import('xlsx');

  // Fetch saved line items for this tender from Step 3
  let dbLineItems: Array<{
    category: string;
    item_description: string;
    specification: string | null;
    quantity: number | null;
    unit_of_measure: string | null;
    line_number: number;
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

  const today = new Date().toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Professional header section with tender details
  const headerRows: any[][] = [
    ['TENDER PRICING SCHEDULE'],
    [''],
    ['Project Details'],
    [`Project Title: ${tender.title || 'N/A'}`],
    [`Project Address: ${(tender as any).project_address || 'N/A'}`],
    [`Client Name: ${(tender as any).client_name || 'N/A'}`],
    [`Tender Reference: ${(tender as any).tender_reference_no || 'N/A'}`],
    [`Submission Deadline: ${tender.deadline ? new Date(tender.deadline).toLocaleDateString('en-AU') : 'N/A'}`],
    [''],
    ['Budget & Timeline'],
    [`Budget (AUD): ${tender.budget ? `$${tender.budget.toLocaleString()}` : 'N/A'}`],
    [`Estimated Start Date: ${(tender as any).estimated_start_date ? new Date((tender as any).estimated_start_date).toLocaleDateString('en-AU') : 'N/A'}`],
    [`Completion Weeks: ${(tender as any).completion_weeks || 'N/A'}`],
    [''],
    [`Date Generated: ${today}`],
    [''],
    ['LINE ITEMS FROM CONSTRUCTION DRAWINGS'],
    ['Category', 'Item Description', 'Specification', 'Quantity', 'Unit', 'Rate (AUD)', 'Total (AUD)', 'Notes'],
  ];

  // Build item rows from Step 3 extracted data
  const itemRows: any[][] = [];
  if (dbLineItems.length > 0) {
    let currentCategory = '';
    dbLineItems.forEach((it) => {
      const cat = it.category || 'Uncategorized';
      // Add category header row
      if (cat !== currentCategory) {
        itemRows.push([cat, '', '', '', '', '', '', '']);
        currentCategory = cat;
      }
      // Add item detail row
      itemRows.push([
        '',
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
    // Fallback if no line items extracted
    itemRows.push(['No line items extracted', 'Please upload construction drawings in Step 3', '', '', '', '', '', '']);
  }

  // Totals section with formulas
  const totalsRows: any[][] = [
    [''],
    [''],
    ['', '', '', '', '', 'Subtotal:', '', ''],
    ['', '', '', '', '', 'GST (10%):', '', ''],
    ['', '', '', '', '', 'Grand Total (AUD):', '', ''],
    [''],
    [''],
    ['Builder Details'],
    ['Company Name:', ''],
    ['ABN:', ''],
    ['Contact Person:', ''],
    ['Email:', ''],
    ['Phone:', ''],
    [''],
    ['Signature:', '', '', 'Date:', ''],
  ];

  const allRows = [...headerRows, ...itemRows, ...totalsRows];
  const ws = XLSX.utils.aoa_to_sheet(allRows);

  // Enhanced column widths for better presentation
  ws['!cols'] = [
    { wch: 28 },  // Category
    { wch: 40 },  // Item Description
    { wch: 50 },  // Specification
    { wch: 12 },  // Quantity
    { wch: 12 },  // Unit
    { wch: 15 },  // Rate
    { wch: 15 },  // Total
    { wch: 30 },  // Notes
  ];

  // Formulas for line totals and summary
  const startDataRow = headerRows.length + 1; // 1-based Excel row index for first item row
  const endDataRow = headerRows.length + itemRows.length; // 1-based Excel row index for last item row

  for (let i = startDataRow; i <= endDataRow; i++) {
    const totalCell = XLSX.utils.encode_cell({ r: i - 1, c: 6 }); // G column
    const qtyRef = XLSX.utils.encode_cell({ r: i - 1, c: 3 }); // D
    const rateRef = XLSX.utils.encode_cell({ r: i - 1, c: 5 }); // F
    (ws as any)[totalCell] = {
      f: `IF(AND(ISNUMBER(${qtyRef}),ISNUMBER(${rateRef})),${qtyRef}*${rateRef},"")`,
      t: 'n'
    };
  }

  // Summary formulas
  const subtotalRowR = headerRows.length + itemRows.length + 1; // zero-based+1 -> will convert below
  const gstRowR = subtotalRowR + 1;
  const grandRowR = subtotalRowR + 2;

  const subtotalCell = XLSX.utils.encode_cell({ r: subtotalRowR, c: 6 });
  const totalStart = XLSX.utils.encode_cell({ r: headerRows.length, c: 6 });
  const totalEnd = XLSX.utils.encode_cell({ r: headerRows.length + itemRows.length - 1, c: 6 });
  (ws as any)[subtotalCell] = { f: `SUM(${totalStart}:${totalEnd})`, t: 'n', z: '$#,##0.00' };

  const gstCell = XLSX.utils.encode_cell({ r: gstRowR, c: 6 });
  (ws as any)[gstCell] = { f: `${subtotalCell}*0.10`, t: 'n', z: '$#,##0.00' };

  const grandCell = XLSX.utils.encode_cell({ r: grandRowR, c: 6 });
  (ws as any)[grandCell] = { f: `${subtotalCell}+${gstCell}`, t: 'n', z: '$#,##0.00' };

  // Merge title cells and set some row heights
  (ws as any)['!merges'] = [
    { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 7 } },
  ];
  (ws as any)['!rows'] = [
    { hpt: 30 },
    { hpt: 25 },
    { hpt: 18 },
    { hpt: 18 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Quote Template');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};

