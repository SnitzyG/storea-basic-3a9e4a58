import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';
import { encode as b64encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const lineItemsRequestSchema = z.object({
  fileUrl: z.string().url().optional(),
  fileName: z.string().max(500).trim(),
  bucket: z.string().max(100).optional(),
  filePath: z.string().max(1000).optional(),
  imageUrls: z.array(z.string().url()).max(20).optional()
});

const CONSTRUCTION_CATEGORIES = [
  'Preliminaries',
  'Termite Protection',
  'Demolition',
  'Concrete Works',
  'Structural Steel',
  'Masonry',
  'Carpentry',
  'Façade Works',
  'Roofing',
  'Plumbing',
  'Mechanical',
  'Electrical',
  'Lift',
  'Plastering, Insulation & Sarking',
  'Stair Works',
  'Painting / Rendering',
  'Joinery',
  'Stone',
  'Floor Finishes',
  'Tiling',
  'Shower Screens & Mirrors',
  'Builders Clean',
  'Caulking',
  'External Landscape',
  'Rooftop Terrace',
  'Additional Budgets / Provisional Sums'
];

interface LineItem {
  line_number: number;
  item_description: string;
  specification: string;
  unit_of_measure: string;
  quantity: number;
  unit_price: number;
  total: number;
  category: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required', lineItems: [] }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate input
    const body = await req.json();
    const { fileUrl, fileName, bucket, filePath, imageUrls } = lineItemsRequestSchema.parse(body);
    
    console.log('Analyzing construction drawing:', fileName);
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Service temporarily unavailable', lineItems: [] }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine MIME type (for hinting)
    const fileExt = fileName.toLowerCase().split('.').pop();
    const mimeTypes: Record<string, string> = {
      'pdf': 'application/pdf',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'webp': 'image/webp'
    };
    const mimeType = mimeTypes[fileExt || 'pdf'] || 'application/pdf';

    const systemPrompt = `You are an expert construction quantity surveyor analyzing architectural and construction drawings with precision.

Your task is to carefully examine ONLY what is shown in the provided construction drawing and extract SPECIFIC line items based on the actual content.

CRITICAL INSTRUCTIONS:
1. ANALYZE THE ACTUAL DRAWING - Don't use templates or generic lists
2. Extract ONLY items that are CLEARLY VISIBLE or SPECIFIED in the drawing
3. Look for:
   - Dimensions and measurements (walls, slabs, areas, volumes)
   - Materials specified in notes or legends
   - Structural elements (beams, columns, footings)
   - Finishes and fixtures shown
   - Quantities that can be calculated from plans
   - Specifications in text annotations
   - Details in sections and elevations

4. For each item you identify, provide:
   - Line number (sequential)
   - Clear item description (what it is + where it is)
   - Detailed specification (material, size, grade, finish)
   - Unit of measure (m², m³, m, no., sum, kg, etc.)
   - Calculated quantity based on drawing dimensions
   - Estimated unit price (Australian construction rates)
   - Total cost (quantity × unit price)
   - Category from the approved list

5. QUALITY OVER QUANTITY:
   - Better to extract 20 accurate items than 100 generic ones
   - Each line item must reference something visible in the drawing
   - Include dimensions/locations where visible
   - If drawings show multiple pages, analyze ALL pages

6. Categories MUST be from this exact list: ${CONSTRUCTION_CATEGORIES.join(', ')}

EXAMPLE OUTPUT FORMAT:
- Line 1: "Excavation for footings (as per foundation plan detail A)" | Spec: "Bulk excavation, 600mm depth, 300mm width" | Unit: m³ | Qty: 45.2
- Line 2: "N12 reinforcement bars in slab (zone 1-3)" | Spec: "Grade 500N steel, 200mm spacing" | Unit: kg | Qty: 2,340`;

    const userPrompt = `Analyze this specific construction drawing in detail. 

STEP-BY-STEP PROCESS:
1. First, identify what type of drawing this is (floor plan, elevation, section, detail, etc.)
2. Look for dimensions, measurements, and scale
3. Read all text annotations, notes, and specifications
4. Identify materials specified in legends or notes
5. Calculate quantities from dimensions shown
6. Extract ONLY items that are clearly shown or specified

Return a comprehensive bill of quantities with ONLY items that you can verify from the drawing content.
If the drawing is unclear or lacks detail, extract what you can see and note in specifications what information is missing.`;

    // Build multimodal content from provided images or file URL
    let userContent: any[] = [{ type: 'text', text: userPrompt }];
    
    if (Array.isArray(imageUrls) && imageUrls.length > 0) {
      console.log(`Using ${imageUrls.length} pre-rendered image(s) from client`);
      for (const url of imageUrls) {
        userContent.push({ type: 'image_url', image_url: { url } });
      }
    } else {
      const signedUrl = fileUrl && (fileUrl.startsWith('http') ? fileUrl : `${Deno.env.get('SUPABASE_URL')}${fileUrl}`);
      if (signedUrl) {
        if (mimeType === 'application/pdf') {
          console.log('Fetching PDF for base64 encoding...');
          const resp = await fetch(signedUrl);
          if (!resp.ok) {
            console.warn('PDF fetch failed, passing URL instead:', resp.status, resp.statusText);
            userContent.push({ type: 'image_url', image_url: { url: signedUrl } });
          } else {
            const ab = await resp.arrayBuffer();
            const base64 = b64encode(new Uint8Array(ab));
            userContent.push({ type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } });
          }
        } else {
          userContent.push({ type: 'image_url', image_url: { url: signedUrl } });
        }
      } else {
        console.warn('No imageUrls or fileUrl provided in request body');
      }
    }

    console.log('Sending to AI for analysis...');

    // Call Lovable AI with vision capabilities
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro', // Using Pro for better accuracy with construction drawings
        messages: [
          { 
            role: 'system', 
            content: systemPrompt 
          },
          { 
            role: 'user', 
            content: userContent
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_line_items',
              description: 'Extract construction line items from the drawing',
              parameters: {
                type: 'object',
                properties: {
                  line_items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        line_number: { type: 'number' },
                        item_description: { type: 'string' },
                        specification: { type: 'string' },
                        unit_of_measure: { type: 'string' },
                        quantity: { type: 'number' },
                        unit_price: { type: 'number' },
                        total: { type: 'number' },
                        category: { 
                          type: 'string',
                          enum: CONSTRUCTION_CATEGORIES
                        }
                      },
                      required: ['line_number', 'item_description', 'specification', 'unit_of_measure', 'quantity', 'unit_price', 'total', 'category'],
                      additionalProperties: false
                    }
                  }
                },
                required: ['line_items'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'extract_line_items' } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');

    // Extract line items from tool call
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || !toolCall.function?.arguments) {
      console.error('No tool call in response:', JSON.stringify(aiData));
      throw new Error('AI did not return structured line items');
    }

    const parsedArgs = JSON.parse(toolCall.function.arguments);
    const lineItems: LineItem[] = parsedArgs.line_items || [];

    console.log(`Extracted ${lineItems.length} line items from drawing`);

    return new Response(
      JSON.stringify({ lineItems }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input data',
          details: error.errors,
          lineItems: []
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    console.error('Error parsing line items:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        lineItems: [] // Return empty array as fallback
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
