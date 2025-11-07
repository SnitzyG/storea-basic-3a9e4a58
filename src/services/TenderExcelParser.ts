import * as XLSX from 'xlsx';
import { TenderLineItem } from '@/hooks/useTenderLineItems';

export interface ParsedBidLineItem {
  lineNumber: number;
  itemDescription: string;
  specification?: string;
  unitOfMeasure?: string;
  quantity?: number;
  unitPrice: number;
  total: number;
  category: string;
  notes?: string;
}

export interface ParsedBidData {
  lineItems: ParsedBidLineItem[];
  subtotal: number;
  gst: number;
  grandTotal: number;
  metadata?: {
    bidderName?: string;
    date?: string;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class TenderExcelParser {
  /**
   * Parse Excel file and extract bid line items
   */
  static async parseExcelBidFile(file: File): Promise<ParsedBidData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          
          // Get first sheet
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];

          const lineItems = this.extractLineItemsFromSheet(worksheet);
          
          // Calculate totals
          const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
          const gst = subtotal * 0.10; // 10% GST
          const grandTotal = subtotal + gst;

          resolve({
            lineItems,
            subtotal,
            gst,
            grandTotal
          });
        } catch (error) {
          reject(new Error(`Failed to parse Excel file: ${error.message}`));
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsBinaryString(file);
    });
  }

  /**
   * Extract line items from worksheet
   * Expects headers in row 13: Category, Item Description, Specification, Quantity, Unit, Rate, Total, Notes
   */
  static extractLineItemsFromSheet(worksheet: XLSX.WorkSheet): ParsedBidLineItem[] {
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    const lineItems: ParsedBidLineItem[] = [];
    
    // Start reading from row 13 (header row based on tenderExportUtils template)
    const headerRow = 12; // 0-indexed, so row 13
    const dataStartRow = headerRow + 1;

    let currentCategory = 'General';
    let lineNumber = 1;

    for (let row = dataStartRow; row <= range.e.r; row++) {
      const categoryCell = worksheet[XLSX.utils.encode_cell({ r: row, c: 0 })];
      const descCell = worksheet[XLSX.utils.encode_cell({ r: row, c: 1 })];
      const specCell = worksheet[XLSX.utils.encode_cell({ r: row, c: 2 })];
      const qtyCell = worksheet[XLSX.utils.encode_cell({ r: row, c: 3 })];
      const unitCell = worksheet[XLSX.utils.encode_cell({ r: row, c: 4 })];
      const rateCell = worksheet[XLSX.utils.encode_cell({ r: row, c: 5 })];
      const totalCell = worksheet[XLSX.utils.encode_cell({ r: row, c: 6 })];
      const notesCell = worksheet[XLSX.utils.encode_cell({ r: row, c: 7 })];

      // Check if this is a category header row (has category but no description)
      if (categoryCell && categoryCell.v && !descCell?.v) {
        currentCategory = String(categoryCell.v);
        continue;
      }

      // Skip empty rows
      if (!descCell || !descCell.v) continue;

      // Skip rows without rate (builder hasn't filled in)
      if (!rateCell || !rateCell.v) continue;

      // Skip totals rows
      const desc = String(descCell.v).toLowerCase();
      if (desc.includes('subtotal') || desc.includes('gst') || desc.includes('total')) {
        break;
      }

      const quantity = qtyCell?.v ? Number(qtyCell.v) : undefined;
      const unitPrice = Number(rateCell.v);
      const total = totalCell?.v ? Number(totalCell.v) : (quantity || 1) * unitPrice;

      lineItems.push({
        lineNumber: lineNumber++,
        itemDescription: String(descCell.v),
        specification: specCell?.v ? String(specCell.v) : undefined,
        quantity,
        unitOfMeasure: unitCell?.v ? String(unitCell.v) : undefined,
        unitPrice,
        total,
        category: currentCategory,
        notes: notesCell?.v ? String(notesCell.v) : undefined
      });
    }

    return lineItems;
  }

  /**
   * Validate parsed bid line items against tender requirements
   */
  static validateBidLineItems(
    parsedData: ParsedBidData,
    tenderLineItems: TenderLineItem[]
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if all tender line items are covered
    const parsedDescriptions = new Set(
      parsedData.lineItems.map(item => item.itemDescription.trim().toLowerCase())
    );

    for (const tenderItem of tenderLineItems) {
      const tenderDesc = tenderItem.item_description.trim().toLowerCase();
      if (!parsedDescriptions.has(tenderDesc)) {
        errors.push(`Missing line item: ${tenderItem.item_description}`);
      }
    }

    // Validate individual line items
    for (const item of parsedData.lineItems) {
      // Check for positive values
      if (item.unitPrice <= 0) {
        errors.push(`Invalid unit price for "${item.itemDescription}": must be greater than 0`);
      }

      if (item.total <= 0) {
        errors.push(`Invalid total for "${item.itemDescription}": must be greater than 0`);
      }

      // Validate calculation
      if (item.quantity && Math.abs(item.total - (item.quantity * item.unitPrice)) > 0.01) {
        warnings.push(`Total mismatch for "${item.itemDescription}": expected ${item.quantity * item.unitPrice}, got ${item.total}`);
      }
    }

    // Check minimum number of items
    if (parsedData.lineItems.length === 0) {
      errors.push('No line items found in the Excel file');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}
