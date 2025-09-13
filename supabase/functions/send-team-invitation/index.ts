import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InvitationRequest {
  projectId: string;
  email: string;
  role: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { projectId, email, role }: InvitationRequest = await req.json()
    
    // Validate inputs
    if (!projectId || !email || !role) {
      throw new Error('Missing required fields: projectId, email, role')
    }

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No authorization header')
    
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) throw new Error('Unauthorized')

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, created_by')
      .eq('id', projectId)
      .eq('created_by', user.id)
      .single()

    if (projectError || !project) throw new Error('Project not found or access denied')

    // Check if user is already a team member by checking their actual user ID, not current user
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const existingUser = authUsers?.users?.find((u: any) => u.email === email)
    
    if (existingUser) {
      // Check if already a team member
      const { data: isTeamMember } = await supabase
        .from('project_users')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', existingUser.id)
        .single()

      if (isTeamMember) {
        throw new Error('User is already a team member')
      }
    }

    // Check for existing pending invitation
    const { data: existingInvite } = await supabase
      .from('invitations')
      .select('id')
      .eq('project_id', projectId)
      .eq('email', email)
      .eq('status', 'pending')
      .maybeSingle()

    if (existingInvite) throw new Error('Invitation already sent to this email')

    // Generate invitation
    const inviteToken = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    // Create invitation record
    const { data: invitation, error: inviteError } = await supabase
      .from('invitations')
      .insert({
        project_id: projectId,
        inviter_id: user.id,
        email: email,
        role: role,
        token: inviteToken,
        expires_at: expiresAt.toISOString(),
        status: 'pending'
      })
      .select()
      .single()

    if (inviteError) throw new Error('Failed to create invitation: ' + inviteError.message)

    // Send email via Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) throw new Error('Resend API key not configured')

    const appUrl = Deno.env.get('SITE_URL') || 'https://bd2e83dc-1d1d-4a73-96c2-6279990f514d.sandbox.lovable.dev'
    
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Team Invitations <onboarding@resend.dev>',
        to: [email],
        subject: `You've been invited to join ${project.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">Team Invitation</h1>
            <p style="font-size: 16px; line-height: 1.5;">You've been invited to join <strong style="color: #007bff;">${project.name}</strong> as a <strong>${role}</strong>.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${appUrl}/accept-invitation?token=${inviteToken}" 
                 style="background-color: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">
                🎉 Accept Invitation
              </a>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #495057;">Project Details:</h3>
              <p style="margin: 5px 0;"><strong>Project:</strong> ${project.name}</p>
              <p style="margin: 5px 0;"><strong>Your Role:</strong> ${role}</p>
              <p style="margin: 5px 0;"><strong>Invited By:</strong> Project Owner</p>
            </div>
            
            <p style="color: #666; font-size: 14px; border-top: 1px solid #dee2e6; padding-top: 15px;">
              ⏰ This invitation expires in 7 days.<br>
              🔗 If the button doesn't work, copy and paste this link: <br>
              <code style="background-color: #f1f3f4; padding: 2px 4px; border-radius: 3px;">${appUrl}/accept-invitation?token=${inviteToken}</code>
            </p>
          </div>
        `
      })
    })

    if (!emailResponse.ok) {
      const emailError = await emailResponse.text()
      console.error('Resend error:', emailError)
      
      await supabase
        .from('invitations')
        .update({ status: 'failed' })
        .eq('id', invitation.id)
      
      throw new Error('Failed to send email: ' + emailError)
    }

    const emailResult = await emailResponse.json()
    console.log('✅ Email sent successfully:', emailResult)

    return new Response(
      JSON.stringify({ 
        success: true, 
        invitation,
        emailId: emailResult.id,
        message: 'Invitation sent successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('❌ Function error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})