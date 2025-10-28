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
  
  // Look for tabular data with columns: Section, Item, Description, Quantity, Unit, Rate, Total, Notes
  const numberPattern = /[\d,]+(?:\.\d{2})?/;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.length < 10) continue;
    
    // Split by multiple spaces or tabs to detect columns
    const parts = line.split(/\s{2,}|\t+/).map(p => p.trim()).filter(p => p);
    
    if (parts.length >= 4) {
      // Potential line item row detected
      let section = '';
      let itemName = '';
      let description = '';
      let quantity: number | undefined;
      let unit = '';
      let rate: number | undefined;
      let total = 0;
      let notes = '';
      
      // Try to parse the structure
      if (parts.length >= 7) {
        // Full format: Section | Item | Description | Quantity | Unit | Rate | Total | Notes
        section = parts[0];
        itemName = parts[1];
        description = parts[2];
        
        const qtyStr = parts[3].replace(/[^0-9.]/g, '');
        if (qtyStr) quantity = parseFloat(qtyStr);
        
        unit = parts[4];
        
        const rateStr = parts[5].replace(/[^0-9.]/g, '');
        if (rateStr) rate = parseFloat(rateStr);
        
        const totalStr = parts[6].replace(/[^0-9.]/g, '');
        if (totalStr) total = parseFloat(totalStr);
        
        if (parts.length > 7) notes = parts.slice(7).join(' ');
      } else if (parts.length >= 3) {
        // Simplified format: try to identify columns
        let currentIdx = 0;
        
        // First column is likely section or item
        const firstCol = parts[currentIdx++];
        if (firstCol.match(/^[A-Za-z\s]+$/)) {
          section = firstCol;
          if (currentIdx < parts.length) itemName = parts[currentIdx++];
        } else {
          itemName = firstCol;
        }
        
        // Look for numeric columns
        while (currentIdx < parts.length) {
          const col = parts[currentIdx];
          const numMatch = col.match(numberPattern);
          
          if (numMatch && col.replace(/[^0-9.]/g, '')) {
            const num = parseFloat(col.replace(/[^0-9.]/g, ''));
            if (num > 0) {
              // Determine if it's quantity, rate, or total
              if (!quantity && num < 10000) {
                quantity = num;
              } else if (!rate && num < 100000) {
                rate = num;
              } else if (!total) {
                total = num;
              }
            }
          } else if (!description && !col.match(/^\d/)) {
            description = col;
          } else if (!unit && col.length < 10 && !col.match(/^\d/)) {
            unit = col;
          }
          
          currentIdx++;
        }
      }
      
      // Validate and add item
      if (itemName && itemName.length > 2 && total > 0) {
        const category = section ? section : categorizeItem(itemName, description);
        
        lineItems.push({
          item_name: itemName,
          description: description || undefined,
          category,
          quantity,
          unit: unit || undefined,
          rate,
          total,
          notes: notes || undefined,
        });
      }
    }
  }
  
  // If no items found with the structured approach, fall back to simple extraction
  if (lineItems.length === 0) {
    const budgetPatterns = [
      /\$?[\d,]+(?:\.\d{2})?/g,
    ];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const matches = line.match(budgetPatterns[0]);
      if (matches && matches.length > 0) {
        const lastMatch = matches[matches.length - 1];
        const amount = parseFloat(lastMatch.replace(/[$,]/g, ''));
        
        if (amount > 0 && amount < 10000000) {
          const textBeforeAmount = line.substring(0, line.lastIndexOf(lastMatch)).trim();
          const parts = textBeforeAmount.split(/\s{2,}|\t+/).filter(p => p.trim());
          
          if (parts.length > 0) {
            const itemName = parts[parts.length - 1];
            const category = parts.length > 1 ? parts[0] : categorizeItem(itemName);
            
            if (itemName && itemName.length > 3) {
              lineItems.push({
                item_name: itemName,
                category,
                total: amount,
              });
            }
          }
        }
      }
    }
  }
  
  // Remove duplicates
  const uniqueItems: LineItem[] = [];
  for (const item of lineItems) {
    const isDuplicate = uniqueItems.some(existing => 
      existing.item_name.toLowerCase() === item.item_name.toLowerCase()
    );
    
    if (!isDuplicate) {
      uniqueItems.push(item);
    }
  }
  
  return uniqueItems;
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
