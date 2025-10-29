import * as XLSX from 'xlsx';

interface CompanyInfo {
  name: string;
  logoUrl?: string;
  address?: string;
  phone?: string;
}

interface ProjectData {
  reference: string;
  name: string;
  id: string;
  address: string;
}

interface LineItem {
  itemDescription: string;
  specification?: string;
  unitOfMeasure?: string;
  quantity?: number;
  category?: string;
}

interface ExportOptions {
  tenderTitle: string;
  companyInfo: CompanyInfo;
  lineItems: LineItem[];
  includeGST?: boolean;
  gstRate?: number;
  deadline?: string;
  projectData?: ProjectData;
}

export const generateProfessionalQuoteTemplate = async (options: ExportOptions) => {
  const {
    tenderTitle,
    companyInfo,
    lineItems,
    includeGST = true,
    gstRate = 0.10, // 10% GST default
    deadline,
    projectData,
  } = options;

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
    [`Title: ${tenderTitle}`],
    ...(deadline ? [[`Deadline: ${deadline}`]] : []),
    [''],
    ...(projectData ? [
      ['Project Reference', 'Project Name', 'Project ID', 'Address'],
      [projectData.reference, projectData.name, projectData.id, projectData.address],
      [''],
    ] : []),
    [`Created: ${today}`],
    [''],
    ['Category', 'Item Description', 'Specification', 'Quantity', 'Unit', 'Rate', 'Total', 'Notes'],
  ];

  // Data rows grouped by category
  const dataRows: any[][] = [];
  let currentCategory = '';
  let rowIndex = headerRows.length;

  lineItems.forEach((item) => {
    const category = item.category || 'Uncategorized';
    
    if (category !== currentCategory) {
      // Add category header row
      dataRows.push([category, '', '', '', '', '', '', '']);
      currentCategory = category;
      rowIndex++;
    }
    
    // Add item row with formula for Total column (G = Quantity * Rate)
    const itemRow = [
      '', // Category (blank for sub-items)
      item.itemDescription,
      item.specification || '',
      item.quantity || '', // Pre-filled if available
      item.unitOfMeasure || '',
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
    { wch: 25 }, // Category
    { wch: 35 }, // Item Description
    { wch: 45 }, // Specification
    { wch: 10 }, // Quantity
    { wch: 10 }, // Unit
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
