import * as XLSX from 'xlsx';

export interface ParsedBidLineItem {
  line_number: number;
  item_description: string;
  specification?: string;
  unit_of_measure?: string;
  quantity: number;
  unit_price: number;
  total: number;
  category: string;
  notes?: string;
  section_header?: string; // Track which section this item belongs to
}

export interface SectionHeader {
  title: string;
  rowIndex: number;
}

export interface ParsedBidData {
  lineItems: ParsedBidLineItem[];
  sectionHeaders: SectionHeader[];
  totalAmount: number;
  notes?: string;
}

/**
 * Parse an Excel file containing bid line items
 * Expected format columns:
 * #, Description, Qty, Unit Price, Total
 * 
 * Rows without a # are treated as section headers (e.g., "Cabinetry", "Provisional Sums")
 * Only rows with a # are counted as actual line items
 */
export class BidExcelParser {
  static async parseExcelFile(file: File): Promise<ParsedBidData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          
          // Get the first sheet
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            defval: '',
            blankrows: false
          }) as any[][];

          if (jsonData.length < 2) {
            throw new Error('Excel file must contain headers and at least one data row');
          }

          const headers = jsonData[0].map((h: any) => String(h).toLowerCase().trim());
          const lineItems: ParsedBidLineItem[] = [];
          const sectionHeaders: SectionHeader[] = [];

          // Find column indices - new format: #, Description, Qty, Unit Price, Total
          const getColIndex = (names: string[]) => {
            for (const name of names) {
              const idx = headers.findIndex(h => h.includes(name));
              if (idx !== -1) return idx;
            }
            return -1;
          };

          // Required columns
          const lineNumIdx = getColIndex(['#', 'line', 'number']);
          const descIdx = getColIndex(['description', 'desc', 'item']);
          const qtyIdx = getColIndex(['qty', 'quantity']);
          const priceIdx = getColIndex(['unit price', 'price', 'rate']);
          const totalIdx = getColIndex(['total']);

          let currentSection = 'General';

          // Parse data rows (skip header)
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            
            // Skip empty rows
            if (!row || row.every((cell: any) => !cell)) continue;

            const lineNumValue = lineNumIdx !== -1 ? row[lineNumIdx] : null;
            const description = descIdx !== -1 ? String(row[descIdx] || '').trim() : '';
            
            // Skip if no description
            if (!description) continue;

            // Check if this is a section header (has description but no line number)
            const hasLineNumber = lineNumValue !== null && lineNumValue !== '' && !isNaN(Number(lineNumValue));
            
            if (!hasLineNumber) {
              // This is a section header (e.g., "Cabinetry", "Supply only costs (fixed)")
              currentSection = description;
              sectionHeaders.push({
                title: description,
                rowIndex: i
              });
              continue; // Don't add section headers as line items
            }

            // This is an actual line item (has a #)
            const lineNumber = Number(lineNumValue);
            const quantity = qtyIdx !== -1 ? Number(row[qtyIdx]) || 1 : 1;
            const unitPrice = priceIdx !== -1 ? Number(row[priceIdx]) || 0 : 0;
            const total = totalIdx !== -1 ? Number(row[totalIdx]) || (quantity * unitPrice) : (quantity * unitPrice);

            lineItems.push({
              line_number: lineNumber,
              item_description: description,
              quantity,
              unit_price: unitPrice,
              total,
              category: currentSection,
              section_header: currentSection
            });
          }

          if (lineItems.length === 0) {
            throw new Error('No valid line items found in Excel file');
          }

          const totalAmount = lineItems.reduce((sum, item) => sum + item.total, 0);

          resolve({
            lineItems,
            sectionHeaders,
            totalAmount,
            notes: undefined
          });
        } catch (error: any) {
          reject(new Error(`Failed to parse Excel file: ${error.message}`));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsBinaryString(file);
    });
  }

  /**
   * Validate parsed data against tender line items
   */
  static validateAgainstTender(
    parsedItems: ParsedBidLineItem[],
    tenderLineItems: any[]
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check if all tender line items are covered
    const parsedLineNumbers = new Set(parsedItems.map(item => item.line_number));
    const tenderLineNumbers = new Set(tenderLineItems.map(item => item.line_number));

    tenderLineNumbers.forEach(lineNum => {
      if (!parsedLineNumbers.has(lineNum)) {
        errors.push(`Missing pricing for line item #${lineNum}`);
      }
    });

    // Check for invalid line items
    parsedItems.forEach(item => {
      if (!tenderLineNumbers.has(item.line_number)) {
        errors.push(`Line item #${item.line_number} not found in tender`);
      }
      if (item.unit_price <= 0) {
        errors.push(`Line item #${item.line_number} has invalid unit price`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
