import * as XLSX from 'xlsx';
import { BUILDING_SECTIONS, ConstructionItem } from '@/components/tenders/ConstructionItemSelector';

interface CompanyInfo {
  name: string;
  logoUrl?: string;
  address?: string;
  phone?: string;
}

interface ExportOptions {
  tenderTitle: string;
  companyInfo: CompanyInfo;
  selectedItemIds: string[];
  includeGST?: boolean;
  gstRate?: number;
}

export const generateProfessionalQuoteTemplate = async (options: ExportOptions) => {
  const {
    tenderTitle,
    companyInfo,
    selectedItemIds,
    includeGST = true,
    gstRate = 0.10, // 10% GST default
  } = options;

  // Get selected items
  const selectedItems = BUILDING_SECTIONS.filter(item => 
    selectedItemIds.includes(item.id)
  );

  // Create workbook
  const wb = XLSX.utils.book_new();

  // Prepare data for Excel
  const today = new Date().toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Header rows
  const headerRows: any[][] = [
    [''], // Row for logo placeholder
    ['Residential Building Quotation'],
    [companyInfo.name],
    [`Date: ${today}`],
    [''],
    ['Section', 'Item', 'Description', 'Quantity', 'Unit', 'Rate', 'Total', 'Notes'],
  ];

  // Data rows grouped by section
  const dataRows: any[][] = [];
  let currentSection = '';
  let rowIndex = headerRows.length;

  selectedItems.forEach((item) => {
    if (item.section !== currentSection) {
      // Add section header row
      dataRows.push([item.section, '', '', '', '', '', '', '']);
      currentSection = item.section;
      rowIndex++;
    }
    
    // Add item row with formula for Total column (G = Quantity * Rate)
    const itemRow = [
      '', // Section (blank for sub-items)
      item.item,
      item.description,
      '', // Quantity (to be filled by builder)
      item.unit,
      '', // Rate (to be filled by builder)
      '', // Total will have formula
      '', // Notes
    ];
    dataRows.push(itemRow);
    rowIndex++;
  });

  // Add spacing before totals
  dataRows.push(['', '', '', '', '', '', '', '']);
  const subtotalRow = rowIndex + dataRows.length - headerRows.length;
  
  // Subtotal, GST, and Grand Total rows
  dataRows.push(['', '', '', '', '', 'Subtotal:', '', '']);
  
  if (includeGST) {
    dataRows.push(['', '', '', '', '', `GST (${(gstRate * 100).toFixed(0)}%):`, '', '']);
    dataRows.push(['', '', '', '', '', 'Grand Total:', '', '']);
  } else {
    dataRows.push(['', '', '', '', '', 'Total:', '', '']);
  }

  // Combine all rows
  const allRows = [...headerRows, ...dataRows];

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(allRows);

  // Set column widths
  ws['!cols'] = [
    { wch: 20 }, // Section
    { wch: 25 }, // Item
    { wch: 40 }, // Description
    { wch: 10 }, // Quantity
    { wch: 8 },  // Unit
    { wch: 12 }, // Rate
    { wch: 12 }, // Total
    { wch: 25 }, // Notes
  ];

  // Add formulas for Total column and summary rows
  const startDataRow = headerRows.length + 1; // First data row after headers
  const endDataRow = rowIndex - 3; // Before the spacing row and totals

  // Add formulas for each item's Total (column G = D * F)
  for (let i = startDataRow; i <= endDataRow; i++) {
    const cellRef = XLSX.utils.encode_cell({ r: i - 1, c: 6 }); // Column G (Total)
    const qtyRef = XLSX.utils.encode_cell({ r: i - 1, c: 3 }); // Column D (Quantity)
    const rateRef = XLSX.utils.encode_cell({ r: i - 1, c: 5 }); // Column F (Rate)
    
    ws[cellRef] = { 
      f: `IF(AND(ISNUMBER(${qtyRef}),ISNUMBER(${rateRef})),${qtyRef}*${rateRef},"")`,
      t: 'n'
    };
  }

  // Add Subtotal formula (sum of all Total cells)
  const subtotalCell = XLSX.utils.encode_cell({ r: subtotalRow, c: 6 });
  const totalColStart = XLSX.utils.encode_cell({ r: startDataRow - 1, c: 6 });
  const totalColEnd = XLSX.utils.encode_cell({ r: endDataRow - 1, c: 6 });
  ws[subtotalCell] = {
    f: `SUM(${totalColStart}:${totalColEnd})`,
    t: 'n',
    z: '$#,##0.00'
  };

  if (includeGST) {
    // GST formula
    const gstCell = XLSX.utils.encode_cell({ r: subtotalRow + 1, c: 6 });
    ws[gstCell] = {
      f: `${subtotalCell}*${gstRate}`,
      t: 'n',
      z: '$#,##0.00'
    };

    // Grand Total formula
    const grandTotalCell = XLSX.utils.encode_cell({ r: subtotalRow + 2, c: 6 });
    ws[grandTotalCell] = {
      f: `${subtotalCell}+${gstCell}`,
      t: 'n',
      z: '$#,##0.00'
    };
  } else {
    // Total formula (without GST)
    const totalCell = XLSX.utils.encode_cell({ r: subtotalRow + 1, c: 6 });
    ws[totalCell] = {
      f: `${subtotalCell}`,
      t: 'n',
      z: '$#,##0.00'
    };
  }

  // Apply styles (note: basic XLSX doesn't support all styling, but we can set some)
  // Merge cells for title
  ws['!merges'] = [
    { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } }, // Title row
    { s: { r: 2, c: 0 }, e: { r: 2, c: 7 } }, // Company name row
  ];

  // Set row heights
  ws['!rows'] = [
    { hpt: 30 }, // Logo row
    { hpt: 25 }, // Title row
    { hpt: 18 }, // Company row
    { hpt: 18 }, // Date row
  ];

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Quote Template');

  // Generate filename
  const filename = `${tenderTitle.replace(/[^a-z0-9]/gi, '_')}_Quote_Template_${new Date().toISOString().split('T')[0]}.xlsx`;

  // Write file
  XLSX.writeFile(wb, filename);

  return filename;
};

export const getCompanyInfoFromProfile = (profile: any, company: any): CompanyInfo => {
  return {
    name: company?.name || profile?.company_name || 'Your Company',
    logoUrl: company?.settings?.logo_url || profile?.company_logo_url,
    address: profile?.company_address || company?.address,
    phone: profile?.phone,
  };
};
