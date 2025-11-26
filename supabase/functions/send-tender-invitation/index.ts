import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'npm:resend@2.0.0';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple in-memory rate limiter
const rateLimits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string, maxRequests = 30, windowMs = 60000): boolean {
  const now = Date.now();
  const limit = rateLimits.get(userId);
  
  if (!limit || now > limit.resetAt) {
    rateLimits.set(userId, { count: 1, resetAt: now + windowMs });
    return true;
  }
  
  if (limit.count >= maxRequests) {
    return false;
  }
  
  limit.count++;
  return true;
}

// Input validation schema
const tenderInvitationSchema = z.object({
  tender_id: z.string().uuid('Invalid tender ID format'),
  recipient_emails: z.array(
    z.string().email('Invalid email format').max(255).trim()
  ).min(1, 'At least one recipient email required').max(100, 'Maximum 100 recipients allowed'),
  message: z.string().max(5000).trim().optional()
});

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      return new Response(
        JSON.stringify({ error: 'Service temporarily unavailable' }),
        { status: 503, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user authentication and get user ID
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Rate limiting by user
    if (!checkRateLimit(user.id)) {
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate input
    const body = await req.json();
    const { tender_id, recipient_emails, message } = tenderInvitationSchema.parse(body);

    // Get tender details
    const { data: tender, error: tenderError } = await supabase
      .from('tenders')
      .select(`
        *,
        projects!inner(name)
      `)
      .eq('id', tender_id)
      .single();

    if (tenderError || !tender) {
      console.error('Error fetching tender:', tenderError);
      return new Response(
        JSON.stringify({ error: 'Failed to process invitation' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify user has permission to invite to this tender
    if (tender.issued_by !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get tender issuer profile separately
    const { data: issuerProfile } = await supabase
      .from('profiles')
      .select('name')
      .eq('user_id', tender.issued_by)
      .single();

    const siteUrl = Deno.env.get('SITE_URL') || 'https://storea.com.au';
    
    // Generate proper authentication token for each recipient
    const generateTenderToken = (tenderId: string, email: string) => {
      return btoa(`${tenderId}:${email}:${Date.now()}`);
    };

    // Send invitation emails with proper error handling
    const emailPromises = recipient_emails.map(async (email) => {
      try {
        const tenderToken = generateTenderToken(tender_id, email);
        const tenderUrl = `${siteUrl}/tender/${tender_id}?token=${encodeURIComponent(tenderToken)}&email=${encodeURIComponent(email)}`;
        
        const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; border-bottom: 2px solid #0070f3; padding-bottom: 10px;">
            Tender Invitation: ${tender.title}
          </h1>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #0070f3; margin-top: 0;">Project Details</h2>
            <p><strong>Project:</strong> ${tender.projects?.name || 'Unknown Project'}</p>
            <p><strong>Tender:</strong> ${tender.title}</p>
            <p><strong>Description:</strong> ${tender.description}</p>
            ${tender.budget ? `<p><strong>Budget:</strong> $${tender.budget.toLocaleString()}</p>` : ''}
            <p><strong>Submission Deadline:</strong> ${new Date(tender.deadline).toLocaleDateString()}</p>
            <p><strong>Issued by:</strong> ${issuerProfile?.name || 'Unknown'}</p>
          </div>

          ${message ? `
            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1976d2; margin-top: 0;">Personal Message</h3>
              <p style="white-space: pre-wrap;">${message}</p>
            </div>
          ` : ''}

          <div style="text-align: center; margin: 30px 0;">
            <a href="${tenderUrl}" 
               style="background: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              View Tender & Submit Bid
            </a>
          </div>

          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h3 style="color: #856404; margin-top: 0;">How to Submit Your Bid</h3>
            <ol style="color: #856404; margin: 10px 0; padding-left: 20px;">
              <li>Click the button above to access the tender</li>
              <li>Create a free account or sign in to Store A</li>
              <li>Review the complete tender details</li>
              <li>Submit your competitive bid</li>
            </ol>
            <p style="color: #856404; margin: 10px 0 0 0;">
              <strong>Note:</strong> This invitation is unique to you and can only be accessed with your email address.
            </p>
          </div>

          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px;">
            <p>This invitation was sent from the Construction Management Platform.</p>
            <p>If you weren't expecting this invitation, you can safely ignore this email.</p>
          </div>
        </div>
      `;

        const result = await resend.emails.send({
          from: "Store A Tenders <onboarding@resend.dev>",
          to: [email],
          subject: `Tender Invitation: ${tender.title}`,
          html: emailHtml,
          text: `Tender Invitation: ${tender.title}\n\nYou have been invited to submit a bid for "${tender.title}".\n\nProject: ${tender.projects?.name || 'Unknown Project'}\nDeadline: ${new Date(tender.deadline).toLocaleDateString()}\n\nView tender and submit bid: ${tenderUrl}\n\n${message ? `Message: ${message}\n\n` : ''}This invitation was sent from Store A Construction Management Platform.`,
        });

        console.log(`Email sent successfully to ${email}:`, result);
        return { email, success: true, id: result.data?.id };
      } catch (error: any) {
        console.error(`Failed to send email to ${email}:`, error);
        return { email, success: false, error: error.message };
      }
    });

    const emailResults = await Promise.all(emailPromises);
    
    // Log the invitations
    const logPromises = emailResults.map((result) => {
      return supabase.from('activity_log').insert({
        user_id: tender.issued_by,
        project_id: tender.project_id,
        entity_type: 'tender',
        entity_id: tender_id,
        action: 'invited',
        description: `Sent tender invitation to ${result.email}`,
        metadata: {
          email: result.email,
          success: result.success,
          tender_title: tender.title,
          error: result.success ? null : result.error
        }
      });
    });

    await Promise.allSettled(logPromises);

    const successCount = emailResults.filter(r => r.success).length;
    const failureCount = emailResults.length - successCount;

    console.log(`Tender invitations sent - Success: ${successCount}, Failed: ${failureCount}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        sent: successCount,
        failed: failureCount,
        results: emailResults.map(r => ({
          email: r.email,
          success: r.success,
          error: r.success ? null : r.error
        }))
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input data',
          details: error.errors 
        }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }
    
    console.error("Error in send-tender-invitation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

Deno.serve(handler);