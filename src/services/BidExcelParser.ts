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
}

export interface ParsedBidData {
  lineItems: ParsedBidLineItem[];
  totalAmount: number;
  notes?: string;
}

/**
 * Parse an Excel file containing bid line items
 * Expected format columns in exact order:
 * 1. Item Description
 * 2. Quantity
 * 3. Category
 * 4. Unit Price
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

          // Find column indices - expect exact format: Item Description, Quantity, Category, Unit Price
          const getColIndex = (names: string[]) => {
            for (const name of names) {
              const idx = headers.findIndex(h => h.includes(name));
              if (idx !== -1) return idx;
            }
            return -1;
          };

          // Required columns in order
          const descIdx = getColIndex(['item description', 'description', 'item', 'desc']);
          const qtyIdx = getColIndex(['quantity', 'qty']);
          const categoryIdx = getColIndex(['category', 'trade']);
          const priceIdx = getColIndex(['unit price', 'price', 'rate']);
          
          // Optional columns
          const lineNumIdx = getColIndex(['line', 'number', '#']);
          const specIdx = getColIndex(['specification', 'spec']);
          const uomIdx = getColIndex(['unit of measure', 'uom', 'unit']);
          const totalIdx = getColIndex(['total']);
          const notesIdx = getColIndex(['notes', 'comments']);

          // Parse data rows (skip header)
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            
            // Skip empty rows
            if (!row || row.every((cell: any) => !cell)) continue;

            // Always use row index for consistent sequential numbering
            const lineNumber = i;
            const description = descIdx !== -1 ? String(row[descIdx] || '').trim() : '';
            
            // Skip if no description
            if (!description) continue;

            const quantity = qtyIdx !== -1 ? Number(row[qtyIdx]) || 1 : 1;
            const unitPrice = priceIdx !== -1 ? Number(row[priceIdx]) || 0 : 0;
            const total = totalIdx !== -1 ? Number(row[totalIdx]) || (quantity * unitPrice) : (quantity * unitPrice);

            lineItems.push({
              line_number: lineNumber,
              item_description: description,
              specification: specIdx !== -1 ? String(row[specIdx] || '').trim() : undefined,
              unit_of_measure: uomIdx !== -1 ? String(row[uomIdx] || '').trim() : undefined,
              quantity,
              unit_price: unitPrice,
              total,
              category: categoryIdx !== -1 ? String(row[categoryIdx] || 'General').trim() : 'General',
              notes: notesIdx !== -1 ? String(row[notesIdx] || '').trim() : undefined
            });
          }

          if (lineItems.length === 0) {
            throw new Error('No valid line items found in Excel file');
          }

          const totalAmount = lineItems.reduce((sum, item) => sum + item.total, 0);

          resolve({
            lineItems,
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
