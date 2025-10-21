import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const SITE_URL = Deno.env.get("SITE_URL") || "";
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    const origin = req.headers.get("origin") || undefined;
    const redirectBase = origin || SITE_URL;

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ error: "Supabase server environment not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!redirectBase) {
      console.error("Missing redirect base: neither Origin header nor SITE_URL available");
      return new Response(
        JSON.stringify({ error: "Password reset redirect URL is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Email service is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize admin client
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Generate a password recovery link
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: email.toLowerCase().trim(),
      options: {
        redirectTo: `${redirectBase}/auth?reset=true`,
      },
    });

    let actionLink = data?.action_link;

    if (error || !actionLink) {
      // Fallback without redirectTo if not allowed or not configured
      console.warn("Primary recovery link generation failed or missing action_link. Falling back without redirect.", { origin, SITE_URL });
      const { data: data2, error: error2 } = await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email: email.toLowerCase().trim(),
      });

      if (error2) {
        const status = (error2 as any)?.status || (error2 as any)?.code;
        if (status === 404 || status === 'user_not_found') {
          console.warn('Password reset requested for non-existent user. Returning 200 for privacy.');
          return new Response(
            JSON.stringify({ success: true }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        console.error("Failed to generate recovery link (fallback):", error2);
        return new Response(
          JSON.stringify({ error: "Failed to generate recovery link" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      actionLink = data2?.action_link;
    }

    if (!actionLink) {
      console.error("No action link generated for password reset after fallback.");
      return new Response(
        JSON.stringify({ error: "Failed to generate recovery link" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resetUrl = actionLink;

    // Send via Resend
    const resend = new Resend(RESEND_API_KEY);

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; line-height: 1.5;">
        <h2 style="color:#111827;margin-bottom:16px;">Reset your password</h2>
        <p style="color:#374151;">We received a request to reset the password for your account.</p>
        <p style="color:#374151;">Click the button below to choose a new password. This link will expire shortly for security.</p>
        <p style="margin:24px 0;">
          <a href="${resetUrl}" style="background-color:#111827;color:#ffffff;padding:12px 18px;border-radius:8px;text-decoration:none;display:inline-block;">Reset Password</a>
        </p>
        <p style="color:#6b7280;font-size:12px;">If the button doesn't work, copy and paste this URL into your browser:</p>
        <p style="word-break:break-all;color:#6b7280;font-size:12px;">${resetUrl}</p>
        <p style="color:#6b7280;font-size:12px;margin-top:24px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `;

    const fromAddress = "Lovable App <onboarding@resend.dev>"; // Use a verified domain if configured

    const { error: sendError } = await resend.emails.send({
      from: fromAddress,
      to: [email],
      subject: "Password reset instructions",
      html,
    });

    if (sendError) {
      console.error("Failed to send password reset email:", sendError);
      return new Response(
        JSON.stringify({ error: "Failed to send password reset email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error in send-password-reset:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});