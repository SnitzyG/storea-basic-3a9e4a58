import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory rate limiter
const rateLimits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, maxRequests = 10, windowMs = 60000): boolean {
  const now = Date.now();
  const limit = rateLimits.get(ip);
  
  if (!limit || now > limit.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  
  if (limit.count >= maxRequests) {
    return false;
  }
  
  limit.count++;
  return true;
}

// Input validation schema
const securityNotificationSchema = z.object({
  type: z.enum(['login_success', 'password_change', 'suspicious_activity']),
  userId: z.string().uuid('Invalid user ID format'),
  metadata: z.object({
    ip: z.string().max(45).optional(), // IPv6 max length
    userAgent: z.string().max(500).optional(),
    location: z.string().max(200).optional(),
    device: z.string().max(200).optional()
  }).optional()
});

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(ip)) {
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      return new Response(
        JSON.stringify({ error: 'Service temporarily unavailable' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // Validate input
    const body = await req.json();
    const { type, userId, metadata } = securityNotificationSchema.parse(body);

    // Get user profile for notification
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('name')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to send notification' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create notification message based on type
    let title: string;
    let message: string;
    let notificationType: string;

    switch (type) {
      case 'login_success':
        title = 'New Login Detected';
        message = `Hi ${profile.name}, a successful login was detected on your account.`;
        if (metadata?.location) {
          message += ` Location: ${metadata.location}.`;
        }
        if (metadata?.device) {
          message += ` Device: ${metadata.device}.`;
        }
        message += ' If this wasn\'t you, please contact support immediately.';
        notificationType = 'security_login';
        break;

      case 'password_change':
        title = 'Password Changed';
        message = `Hi ${profile.name}, your password was successfully changed. If you didn't make this change, please contact support immediately.`;
        notificationType = 'security_password';
        break;

      case 'suspicious_activity':
        title = 'Suspicious Activity Detected';
        message = `Hi ${profile.name}, we detected unusual activity on your account. Please review your recent activity and contact support if you notice anything suspicious.`;
        notificationType = 'security_suspicious';
        break;

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid notification type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    // Create notification in database
    const { error: notificationError } = await supabaseClient
      .from('notifications')
      .insert({
        user_id: userId,
        type: notificationType,
        title,
        message,
        data: {
          security_event: type,
          metadata: metadata || {}
        }
      });

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
      return new Response(
        JSON.stringify({ error: 'Failed to create notification' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // In a production environment, you would also send an email here
    // For now, we'll just log the event
    console.log(`Security notification sent to user ${userId}: ${type}`);

    return new Response(
      JSON.stringify({ success: true, message: 'Security notification sent' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input data',
          details: error.errors 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    console.error('Error in security-notifications function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);