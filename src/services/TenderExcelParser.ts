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
   * Expects headers: Item Description, Quantity, Category, Unit Price
   * Can also handle: Specification, Unit, Total, Notes as optional columns
   */
  static extractLineItemsFromSheet(worksheet: XLSX.WorkSheet): ParsedBidLineItem[] {
    // Convert entire worksheet to JSON to find headers dynamically
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,
      defval: '',
      blankrows: false
    }) as any[][];

    if (jsonData.length < 2) {
      return [];
    }

    // Find header row (look for "Item Description" or "Description")
    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(20, jsonData.length); i++) {
      const row = jsonData[i];
      const rowStr = row.map((cell: any) => String(cell).toLowerCase()).join('|');
      if (rowStr.includes('item description') || (rowStr.includes('description') && rowStr.includes('quantity'))) {
        headerRowIndex = i;
        break;
      }
    }

    if (headerRowIndex === -1) {
      throw new Error('Could not find header row in Excel file');
    }

    const headers = jsonData[headerRowIndex].map((h: any) => String(h).toLowerCase().trim());
    const lineItems: ParsedBidLineItem[] = [];

    // Find column indices - primary format: Item Description, Quantity, Category, Unit Price
    const getColIndex = (names: string[]) => {
      for (const name of names) {
        const idx = headers.findIndex(h => h.includes(name));
        if (idx !== -1) return idx;
      }
      return -1;
    };

    const descIdx = getColIndex(['item description', 'description', 'item']);
    const qtyIdx = getColIndex(['quantity', 'qty']);
    const categoryIdx = getColIndex(['category', 'trade']);
    const priceIdx = getColIndex(['unit price', 'price', 'rate']);
    
    // Optional columns
    const specIdx = getColIndex(['specification', 'spec']);
    const uomIdx = getColIndex(['unit of measure', 'uom', 'unit']);
    const totalIdx = getColIndex(['total']);
    const notesIdx = getColIndex(['notes', 'comments']);

    if (descIdx === -1 || priceIdx === -1) {
      throw new Error('Excel file must contain "Item Description" and "Unit Price" columns');
    }

    let lineNumber = 1;
    let currentCategory = 'General';

    // Parse data rows (skip header)
    for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      
      // Skip empty rows
      if (!row || row.every((cell: any) => !cell)) continue;

      const description = descIdx !== -1 ? String(row[descIdx] || '').trim() : '';
      
      // Skip if no description
      if (!description) continue;

      // Skip totals/subtotals rows
      const desc = description.toLowerCase();
      if (desc.includes('subtotal') || desc.includes('gst') || desc.includes('total')) {
        break;
      }

      // Get values
      const quantity = qtyIdx !== -1 && row[qtyIdx] ? Number(row[qtyIdx]) : undefined;
      const category = categoryIdx !== -1 && row[categoryIdx] ? String(row[categoryIdx]).trim() : currentCategory;
      const unitPrice = priceIdx !== -1 && row[priceIdx] ? Number(row[priceIdx]) : 0;
      
      // Skip rows without unit price (builder hasn't filled in)
      if (!unitPrice || unitPrice <= 0) continue;

      const total = totalIdx !== -1 && row[totalIdx] ? Number(row[totalIdx]) : (quantity || 1) * unitPrice;

      // Update current category if this row has one
      if (category && category !== 'General') {
        currentCategory = category;
      }

      lineItems.push({
        lineNumber: lineNumber++,
        itemDescription: description,
        specification: specIdx !== -1 ? String(row[specIdx] || '').trim() || undefined : undefined,
        quantity,
        unitOfMeasure: uomIdx !== -1 ? String(row[uomIdx] || '').trim() || undefined : undefined,
        unitPrice,
        total,
        category: currentCategory,
        notes: notesIdx !== -1 ? String(row[notesIdx] || '').trim() || undefined : undefined
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
