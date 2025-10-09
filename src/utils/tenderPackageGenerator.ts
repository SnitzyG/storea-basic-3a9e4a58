import jsPDF from 'jspdf';
import { Tender } from '@/hooks/useTenders';

import JSZip from 'jszip';
import { saveAs } from 'file-saver';

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
  if (tender.requirements?.project_overview) {
    addSectionHeader('3. Project Overview');
    const overview = tender.requirements.project_overview;
    
    if (overview.project_type) addField('Project Type', overview.project_type);
    if (overview.total_area) addField('Total Area', `${overview.total_area} sqm`);
    if (overview.number_of_levels) addField('Number of Levels', overview.number_of_levels.toString());
    if (overview.estimated_duration) addField('Estimated Duration', `${overview.estimated_duration} months`);
    if (overview.key_features) addField('Key Features', overview.key_features, true);
    
    yPos += 5;
  }

  // STEP 4: Project Scope
  if (tender.requirements?.scope) {
    addSectionHeader('4. Project Scope');
    
    const addScopeItems = (subtitle: string, items: string[] | undefined) => {
      if (!items || items.length === 0) return;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.text(subtitle, marginLeft, yPos);
      yPos += 6;
      
      doc.setFont('helvetica', 'normal');
      items.forEach(item => {
        if (yPos > pageHeight - 20) {
          doc.addPage();
          yPos = 25;
        }
        const itemLines = doc.splitTextToSize('• ' + item, contentWidth - 10);
        doc.text(itemLines, marginLeft + 3, yPos);
        yPos += itemLines.length * 5;
      });
      yPos += 3;
    };
    
    addScopeItems('Inclusions', tender.requirements.scope.inclusions);
    addScopeItems('Exclusions', tender.requirements.scope.exclusions);
    yPos += 5;
  }

  // STEP 5: Requirements & Compliance
  if (tender.requirements?.compliance) {
    addSectionHeader('5. Requirements & Compliance');
    const compliance = tender.requirements.compliance;
    
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

  // STEP 6: Contractor Requirements  
  if (tender.requirements?.contractor_requirements) {
    addSectionHeader('6. Contractor Requirements');
    const contractorReqs = tender.requirements.contractor_requirements;
    
    if (contractorReqs.experience_years) addField('Minimum Experience', `${contractorReqs.experience_years} years`);
    if (contractorReqs.team_size) addField('Required Team Size', contractorReqs.team_size);
    if (contractorReqs.equipment) addField('Equipment Requirements', contractorReqs.equipment, true);
    if (contractorReqs.licenses) addField('Required Licenses', contractorReqs.licenses, true);
    
    yPos += 5;
  }

  // STEP 7: Environmental Targets
  if (tender.requirements?.environmental_targets) {
    addSectionHeader('7. Environmental Targets');
    const envTargets = tender.requirements.environmental_targets;
    
    if (envTargets.energy_rating) addField('Target Energy Rating', envTargets.energy_rating);
    if (envTargets.water_efficiency) addField('Water Efficiency', envTargets.water_efficiency);
    if (envTargets.waste_management) addField('Waste Management', envTargets.waste_management, true);
    if (envTargets.materials) addField('Sustainable Materials', envTargets.materials, true);
    
    yPos += 5;
  }

  // STEP 8: Communication & Objectives
  if (tender.requirements?.objectives) {
    addSectionHeader('8. Communication & Project Objectives');
    const objectives = tender.requirements.objectives;
    
    if (objectives.quality_standards) addField('Quality Standards', objectives.quality_standards, true);
    if (objectives.sustainability_goals?.length) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Sustainability Goals:', marginLeft, yPos);
      yPos += 6;
      doc.setFont('helvetica', 'normal');
      objectives.sustainability_goals.forEach((goal: string) => {
        const goalLines = doc.splitTextToSize('• ' + goal, contentWidth - 10);
        doc.text(goalLines, marginLeft + 3, yPos);
        yPos += goalLines.length * 5;
      });
      yPos += 3;
    }
    if (objectives.performance_targets) addField('Performance Targets', objectives.performance_targets, true);
    
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
  // Reuse existing Excel generation but return blob instead of saving
  const selectedItemIds = prepareTenderConstructionItems(tender);
  
  // Import XLSX dynamically
  const XLSX = await import('xlsx');
  
  // Prepare data similar to existing function
  const today = new Date().toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const headerRows: any[][] = [
    [''],
    ['Residential Building Quotation'],
    [tender.title],
    [`Date: ${today}`],
    [''],
    [`Title: ${tender.title}`],
    [`Deadline: ${new Date(tender.deadline).toLocaleDateString()}`],
    [''],
    [`Created: ${today}`],
    [''],
    ['Section', 'Item', 'Description', 'Quantity', 'Unit', 'Rate', 'Total', 'Notes'],
  ];

  // Add construction items
  const dataRows: any[][] = [];
  if (tender.construction_items && Array.isArray(tender.construction_items)) {
    let currentSection = '';
    
    tender.construction_items.forEach((item: any) => {
      if (item.section !== currentSection) {
        dataRows.push([item.section, '', '', '', '', '', '', '']);
        currentSection = item.section;
      }
      
      dataRows.push([
        '',
        item.item || '',
        item.description || '',
        '',
        item.unit || '',
        '',
        '',
        ''
      ]);
    });
  }

  // Add spacing and totals
  dataRows.push(['', '', '', '', '', '', '', '']);
  dataRows.push(['', '', '', '', '', 'Subtotal:', '', '']);
  dataRows.push(['', '', '', '', '', 'GST (10%):', '', '']);
  dataRows.push(['', '', '', '', '', 'Grand Total:', '', '']);

  const allRows = [...headerRows, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(allRows);

  ws['!cols'] = [
    { wch: 20 },
    { wch: 25 },
    { wch: 40 },
    { wch: 10 },
    { wch: 8 },
    { wch: 12 },
    { wch: 12 },
    { wch: 25 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Quote Template');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};
