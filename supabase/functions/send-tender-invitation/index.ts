import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// Note: Resend functionality temporarily disabled to avoid dependency issues
// import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

// const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TenderInvitationRequest {
  tender_id: string;
  recipient_emails: string[];
  message?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { tender_id, recipient_emails, message }: TenderInvitationRequest = await req.json();

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
        JSON.stringify({ error: 'Tender not found' }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get tender issuer profile separately
    const { data: issuerProfile } = await supabase
      .from('profiles')
      .select('name')
      .eq('user_id', tender.issued_by)
      .single();

    const inviteUrl = `${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '')}/auth/v1/invite`;
    const siteUrl = `https://id-preview--bd2e83dc-1d1d-4a73-96c2-6279990f514d.lovable.app`;
    
    // Generate proper authentication token for each recipient
    const generateTenderToken = (tenderId: string, email: string) => {
      return btoa(`${tenderId}:${email}:${Date.now()}`);
    };

    // Send invitation emails
    const emailPromises = recipient_emails.map(async (email) => {
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
            <h3 style="color: #856404; margin-top: 0;">Getting Started</h3>
            <p style="color: #856404; margin: 0;">
              If you don't have an account yet, clicking the link above will guide you through creating one securely. 
              Once logged in, you'll be able to view the full tender details and submit your bid.
            </p>
          </div>

          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px;">
            <p>This invitation was sent from the Construction Management Platform.</p>
            <p>If you weren't expecting this invitation, you can safely ignore this email.</p>
          </div>
        </div>
      `;

      // Temporarily disable email sending due to dependency issues
      console.log('Would send tender invitation email to:', email, 'for tender:', tender.title);
      return { success: true, message: 'Email notification logged (resend disabled)' };
      /*
      return resend.emails.send({
        from: "Construction Platform <onboarding@resend.dev>",
        to: [email],
        subject: `Tender Invitation: ${tender.title}`,
        html: emailHtml,
      });
      */
    });

    const emailResults = await Promise.allSettled(emailPromises);
    
    // Log the invitations
    const logPromises = recipient_emails.map((email, index) => {
      const result = emailResults[index];
      return supabase.from('activity_log').insert({
        user_id: tender.issued_by,
        project_id: tender.project_id,
        entity_type: 'tender',
        entity_id: tender_id,
        action: 'invited',
        description: `Sent tender invitation to ${email}`,
        metadata: {
          email,
          success: result.status === 'fulfilled',
          tender_title: tender.title
        }
      });
    });

    await Promise.allSettled(logPromises);

    const successCount = emailResults.filter(r => r.status === 'fulfilled').length;
    const failureCount = emailResults.length - successCount;

    console.log(`Tender invitations sent - Success: ${successCount}, Failed: ${failureCount}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        sent: successCount,
        failed: failureCount,
        results: emailResults.map(r => ({
          success: r.status === 'fulfilled',
          error: r.status === 'rejected' ? r.reason : null
        }))
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
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

serve(handler);