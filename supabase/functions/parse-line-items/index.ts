import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LineItem {
  item_name: string;
  description?: string;
  category: string;
  quantity?: number;
  unit?: string;
  rate?: number;
  total: number;
  notes?: string;
}

const CATEGORIES = [
  'Preliminaries',
  'Demolition',
  'Excavation',
  'Concrete',
  'Steelwork',
  'Carpentry',
  'Roofing',
  'Windows & Doors',
  'Plumbing',
  'Electrical',
  'Mechanical',
  'Internal Finishes',
  'External Works',
  'General',
];

function categorizeItem(itemName: string, description?: string): string {
  const text = `${itemName} ${description || ''}`.toLowerCase();
  
  if (text.match(/prelim|setup|site establish|mobilization/i)) return 'Preliminaries';
  if (text.match(/demol|strip|remove/i)) return 'Demolition';
  if (text.match(/excavat|earth|dig/i)) return 'Excavation';
  if (text.match(/concrete|pour|slab|foundation/i)) return 'Concrete';
  if (text.match(/steel|frame|structural/i)) return 'Steelwork';
  if (text.match(/carp|timber|framing|joinery/i)) return 'Carpentry';
  if (text.match(/roof|tile|sheet/i)) return 'Roofing';
  if (text.match(/window|door|glazing/i)) return 'Windows & Doors';
  if (text.match(/plumb|pipe|drainage/i)) return 'Plumbing';
  if (text.match(/electric|wiring|light|power/i)) return 'Electrical';
  if (text.match(/hvac|mechanical|air condition|heating/i)) return 'Mechanical';
  if (text.match(/finish|paint|plaster|gypsum|floor|tile/i)) return 'Internal Finishes';
  if (text.match(/landscape|paving|external|driveway|fence/i)) return 'External Works';
  
  return 'General';
}

function extractLineItems(content: string): LineItem[] {
  const lines = content.split('\n');
  const lineItems: LineItem[] = [];
  
  // Split content into cells by looking for tab or multiple space separators
  const rows = lines.map(line => 
    line.split(/\t+|\s{2,}/).map(cell => cell.trim()).filter(cell => cell.length > 0)
  ).filter(row => row.length > 0);
  
  // Try to find header row
  let headerIndex = -1;
  let columnMapping: { [key: string]: number } = {};
  
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    const row = rows[i];
    const headerText = row.join(' ').toLowerCase();
    
    if (headerText.includes('section') || headerText.includes('item') || 
        headerText.includes('description') || headerText.includes('quantity')) {
      headerIndex = i;
      
      // Map columns based on header
      row.forEach((cell, idx) => {
        const cellLower = cell.toLowerCase();
        if (cellLower.includes('section') || cellLower.includes('category')) columnMapping.section = idx;
        if (cellLower.includes('item') && !cellLower.includes('description')) columnMapping.item = idx;
        if (cellLower.includes('description')) columnMapping.description = idx;
        if (cellLower.includes('quantity') || cellLower.includes('qty')) columnMapping.quantity = idx;
        if (cellLower.includes('unit') && !cellLower.includes('quantity')) columnMapping.unit = idx;
        if (cellLower.includes('rate') && !cellLower.includes('total')) columnMapping.rate = idx;
        if (cellLower.includes('total') || cellLower.includes('amount')) columnMapping.total = idx;
        if (cellLower.includes('note')) columnMapping.notes = idx;
      });
      break;
    }
  }
  
  // Parse data rows
  const startRow = headerIndex >= 0 ? headerIndex + 1 : 0;
  let currentSection = 'General';
  
  for (let i = startRow; i < rows.length; i++) {
    const row = rows[i];
    if (row.length === 0) continue;
    
    // Check if this is a section header (single column or obvious section)
    if (row.length === 1 || (row.length === 2 && !row[1].match(/[\d.]/))) {
      const potentialSection = row[0];
      if (potentialSection && potentialSection.length > 2 && potentialSection.length < 50) {
        currentSection = potentialSection;
      }
      continue;
    }
    
    // Extract values based on column mapping or position
    let item: Partial<LineItem> = { category: currentSection };
    
    if (Object.keys(columnMapping).length > 0) {
      // Use header mapping
      if (columnMapping.section !== undefined && row[columnMapping.section]) {
        item.category = row[columnMapping.section];
        currentSection = item.category;
      }
      if (columnMapping.item !== undefined) item.item_name = row[columnMapping.item];
      if (columnMapping.description !== undefined) item.description = row[columnMapping.description];
      if (columnMapping.quantity !== undefined) {
        const qty = parseFloat(row[columnMapping.quantity]?.replace(/[,$]/g, '') || '0');
        if (qty > 0) item.quantity = qty;
      }
      if (columnMapping.unit !== undefined) item.unit = row[columnMapping.unit];
      if (columnMapping.rate !== undefined) {
        const rate = parseFloat(row[columnMapping.rate]?.replace(/[,$]/g, '') || '0');
        if (rate > 0) item.rate = rate;
      }
      if (columnMapping.total !== undefined) {
        const total = parseFloat(row[columnMapping.total]?.replace(/[,$]/g, '') || '0');
        if (total > 0) item.total = total;
      }
      if (columnMapping.notes !== undefined) item.notes = row[columnMapping.notes];
    } else {
      // Fallback: assume standard order (Section, Item, Description, Quantity, Unit, Rate, Total, Notes)
      if (row.length >= 2) item.item_name = row[1];
      if (row.length >= 3) item.description = row[2];
      if (row.length >= 4) {
        const qty = parseFloat(row[3].replace(/[,$]/g, '') || '0');
        if (qty > 0) item.quantity = qty;
      }
      if (row.length >= 5) item.unit = row[4];
      if (row.length >= 6) {
        const rate = parseFloat(row[5].replace(/[,$]/g, '') || '0');
        if (rate > 0) item.rate = rate;
      }
      if (row.length >= 7) {
        const total = parseFloat(row[6].replace(/[,$]/g, '') || '0');
        if (total > 0) item.total = total;
      }
      if (row.length >= 8) item.notes = row[7];
    }
    
    // Validate and add item
    if (item.item_name && item.item_name.length > 2 && item.total && item.total > 0) {
      // Auto-categorize if no category set
      if (!item.category || item.category === 'General') {
        item.category = categorizeItem(item.item_name, item.description);
      }
      
      lineItems.push(item as LineItem);
    }
  }
  
  return lineItems;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileUrl, fileName } = await req.json();
    
    console.log('Parsing document:', fileName);
    
    // Fetch the document
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      throw new Error('Failed to fetch document');
    }
    
    const fileBuffer = await fileResponse.arrayBuffer();
    const fileExt = fileName.toLowerCase().split('.').pop();
    
    let textContent = '';
    
    // Parse based on file type
    if (fileExt === 'pdf') {
      // For PDF, we'll need to extract text - simplified approach
      // In production, you'd use a proper PDF parsing library
      textContent = new TextDecoder().decode(fileBuffer);
    } else if (fileExt === 'xlsx' || fileExt === 'xls') {
      // For Excel, extract text representation
      textContent = new TextDecoder().decode(fileBuffer);
    } else if (fileExt === 'docx' || fileExt === 'doc') {
      // For Word documents, extract text
      textContent = new TextDecoder().decode(fileBuffer);
    } else {
      throw new Error('Unsupported file type');
    }
    
    console.log('Extracted text length:', textContent.length);
    
    // Extract line items from content
    const lineItems = extractLineItems(textContent);
    
    console.log('Found line items:', lineItems.length);
    
    return new Response(
      JSON.stringify({ lineItems }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error parsing line items:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
