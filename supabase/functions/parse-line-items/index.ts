import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LineItem {
  item_name: string;
  description?: string;
  category: string;
  contract_budget: number;
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
  
  // Look for table-like structures with budget information
  const budgetPatterns = [
    /\$[\d,]+(?:\.\d{2})?/,  // $123,456.78
    /[\d,]+\.\d{2}/,          // 123,456.78
    /[\d,]+/,                 // 123456
  ];
  
  let currentItem: Partial<LineItem> | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Try to find budget amounts
    let budgetMatch = null;
    for (const pattern of budgetPatterns) {
      budgetMatch = line.match(pattern);
      if (budgetMatch) break;
    }
    
    if (budgetMatch) {
      // Extract amount
      const amountStr = budgetMatch[0].replace(/[$,]/g, '');
      const amount = parseFloat(amountStr);
      
      if (amount > 0 && amount < 10000000) { // Reasonable budget range
        // Look backward for item name
        const nameMatch = line.match(/^(.+?)(?:\s+\$|\s+[\d,]+)/);
        if (nameMatch) {
          const itemName = nameMatch[1].trim();
          if (itemName && itemName.length > 3 && itemName.length < 100) {
            // Look for description in surrounding lines
            let description = '';
            if (i + 1 < lines.length) {
              const nextLine = lines[i + 1].trim();
              if (nextLine && !nextLine.match(/\$[\d,]+/) && nextLine.length < 200) {
                description = nextLine;
              }
            }
            
            const category = categorizeItem(itemName, description);
            
            lineItems.push({
              item_name: itemName,
              description: description || undefined,
              category,
              contract_budget: amount,
            });
          }
        }
      }
    }
  }
  
  // Remove duplicates based on similar names
  const uniqueItems: LineItem[] = [];
  for (const item of lineItems) {
    const isDuplicate = uniqueItems.some(existing => {
      const similarity = item.item_name.toLowerCase() === existing.item_name.toLowerCase();
      return similarity;
    });
    
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
