import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';
import { encode as b64encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    const { fileUrl, fileName, bucket, filePath } = await req.json();
    
    console.log('Analyzing construction drawing:', fileName);
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
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

    // We will pass the signed URL directly to the AI instead of inlining the file
    const fullUrl = fileUrl.startsWith('http') ? fileUrl : `${Deno.env.get('SUPABASE_URL')}${fileUrl}`;

    console.log('Sending to AI for analysis using URL...');

    console.log('Sending to AI for analysis...');

    const systemPrompt = `You are a construction cost estimator analyzing architectural and construction drawings. 
Your task is to carefully examine the provided construction drawing and extract ALL line items needed for construction.

For each item you identify, provide:
- A sequential line number
- Clear item description
- Detailed specification
- Unit of measure (e.g., m², m³, m, no., sum)
- Estimated quantity based on the drawing
- Estimated unit price (use Australian construction rates)
- Total cost (quantity × unit price)
- Category from the approved list

IMPORTANT: 
- Be thorough and extract ALL visible construction items from the drawing
- Use standard Australian construction terminology
- Provide realistic quantity estimates based on what you can see
- Use current Australian market rates for pricing
- Categories MUST be from this exact list: ${CONSTRUCTION_CATEGORIES.join(', ')}`;

    const userPrompt = `Please analyze this construction drawing thoroughly and extract ALL line items needed for the project. 
Include everything you can identify from the drawing including materials, labor, and equipment.
Return a comprehensive bill of quantities.`;

    // Build multimodal content based on file type
    const fullUrl = fileUrl.startsWith('http') ? fileUrl : `${Deno.env.get('SUPABASE_URL')}${fileUrl}`;
    let userContent: any[] = [{ type: 'text', text: userPrompt }];
    if (mimeType === 'application/pdf') {
      console.log('Fetching PDF for base64 encoding...');
      const resp = await fetch(fullUrl);
      if (!resp.ok) {
        console.warn('PDF fetch failed, passing URL instead:', resp.status, resp.statusText);
        userContent.push({ type: 'image_url', image_url: { url: fullUrl } });
      } else {
        const ab = await resp.arrayBuffer();
        const base64 = b64encode(new Uint8Array(ab));
        userContent.push({ type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } });
      }
    } else {
      userContent.push({ type: 'image_url', image_url: { url: fullUrl } });
    }

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
