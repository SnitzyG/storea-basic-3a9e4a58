import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RFINotificationRequest {
  recipientEmail: string;
  recipientName: string;
  rfiNumber: string;
  rfiSubject: string;
  rfiQuestion: string;
  senderName: string;
  projectName: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      recipientEmail,
      recipientName,
      rfiNumber,
      rfiSubject,
      rfiQuestion,
      senderName,
      projectName,
      dueDate,
      priority
    }: RFINotificationRequest = await req.json();

    const priorityColor = {
      'low': '#22c55e',
      'medium': '#f59e0b', 
      'high': '#ef4444',
      'critical': '#dc2626'
    }[priority] || '#f59e0b';

    const emailResponse = await resend.emails.send({
      from: "StoreAli RFI System <notifications@resend.dev>",
      to: [recipientEmail],
      subject: `New RFI Action Required: ${rfiNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">New RFI Action Required</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
              Hello ${recipientName},
            </p>
            
            <p style="font-size: 16px; color: #374151; margin-bottom: 30px;">
              You have received a new Request for Information (RFI) that requires your attention and response.
            </p>
            
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
              <h2 style="color: #1f2937; margin: 0 0 15px 0; font-size: 20px;">RFI Details</h2>
              
              <div style="margin-bottom: 15px;">
                <strong style="color: #374151;">RFI Number:</strong>
                <span style="color: #6b7280; margin-left: 10px;">${rfiNumber}</span>
              </div>
              
              <div style="margin-bottom: 15px;">
                <strong style="color: #374151;">Priority:</strong>
                <span style="background: ${priorityColor}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-left: 10px; text-transform: uppercase;">${priority}</span>
              </div>
              
              <div style="margin-bottom: 15px;">
                <strong style="color: #374151;">Project:</strong>
                <span style="color: #6b7280; margin-left: 10px;">${projectName}</span>
              </div>
              
              <div style="margin-bottom: 15px;">
                <strong style="color: #374151;">From:</strong>
                <span style="color: #6b7280; margin-left: 10px;">${senderName}</span>
              </div>
              
              ${dueDate ? `
                <div style="margin-bottom: 15px;">
                  <strong style="color: #374151;">Due Date:</strong>
                  <span style="color: #6b7280; margin-left: 10px;">${new Date(dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              ` : ''}
              
              ${rfiSubject ? `
                <div style="margin-bottom: 15px;">
                  <strong style="color: #374151;">Subject:</strong>
                  <span style="color: #6b7280; margin-left: 10px;">${rfiSubject}</span>
                </div>
              ` : ''}
              
              <div>
                <strong style="color: #374151;">Question:</strong>
                <div style="color: #6b7280; margin-top: 8px; padding: 15px; background: white; border: 1px solid #e5e7eb; border-radius: 6px;">
                  ${rfiQuestion}
                </div>
              </div>
            </div>
            
            <div style="text-align: center; margin-bottom: 30px;">
              <a href="https://inibugusrzfihldvegrb.lovableproject.com/rfis" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                View and Respond to RFI
              </a>
            </div>
            
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; font-size: 14px; color: #6b7280;">
              <p style="margin: 0 0 10px 0;">
                <strong>Action Required:</strong> Please log into the system to review and respond to this RFI.
              </p>
              <p style="margin: 0;">
                If you have any questions, please contact ${senderName} or reply to this email.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding: 20px; color: #6b7280; font-size: 12px;">
            <p style="margin: 0;">
              This is an automated message from the StoreAli RFI Management System.<br>
              Please do not reply directly to this email.
            </p>
          </div>
        </div>
      `,
    });

    console.log("RFI notification email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-rfi-notification function:", error);
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