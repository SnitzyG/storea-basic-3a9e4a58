import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

const AcceptInvitation = () => {
  const [invitation, setInvitation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const token = searchParams.get('token')

  useEffect(() => {
    if (token) {
      handleAcceptInvitation(token)
    } else {
      setError('Invalid invitation link')
      setLoading(false)
    }
  }, [token, user])

  const handleAcceptInvitation = async (inviteToken: string) => {
    try {
      if (!user) {
        // Redirect to login with return URL
        const returnUrl = encodeURIComponent(window.location.href)
        navigate(`/auth?redirect=${returnUrl}`)
        return
      }

      // Validate and get invitation
      const { data: invite, error: inviteError } = await supabase
        .from('invitations')
        .select(`
          *,
          projects (
            id,
            name,
            description
          )
        `)
        .eq('token', inviteToken)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .maybeSingle()

      if (inviteError || !invite) {
        throw new Error('Invalid or expired invitation')
      }

      setInvitation(invite)

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('project_users')
        .select('id')
        .eq('project_id', invite.project_id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (existingMember) {
        throw new Error('You are already a member of this project')
      }

      // Add user to project_users
      const { error: memberError } = await supabase
        .from('project_users')
        .insert({
          project_id: invite.project_id,
          user_id: user.id,
          role: invite.role,
          invited_by: invite.inviter_id,
          joined_at: new Date().toISOString()
        })

      if (memberError) {
        throw new Error('Failed to add you to the project: ' + memberError.message)
      }

      // Update invitation status to accepted
      const { error: updateError } = await supabase
        .from('invitations')
        .update({ 
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', invite.id)

      if (updateError) {
        console.error('Failed to update invitation status:', updateError)
      }

      setSuccess(true)
      
      // Redirect to project after 2 seconds
      setTimeout(() => {
        navigate(`/projects`)
      }, 2000)

    } catch (err: any) {
      console.error('Invitation acceptance error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <h1 className="text-xl font-semibold mb-2">Processing your invitation...</h1>
            <p className="text-muted-foreground">Please wait while we add you to the project.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-destructive mb-4">Invitation Error</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => navigate('/projects')} variant="default">
              Go to Projects
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success && invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-green-600 mb-4">Welcome to the Team!</h1>
            <p className="text-muted-foreground mb-6">
              You've successfully joined <strong>{invitation.projects.name}</strong> as a <strong>{invitation.role}</strong>.
            </p>
            <p className="text-sm text-muted-foreground">Redirecting you to projects...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8">
            <h1 className="text-2xl font-semibold text-center mb-6">Join Project Team</h1>
            <div className="bg-muted p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-foreground">{invitation.projects.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{invitation.projects.description}</p>
              <p className="text-sm text-muted-foreground mt-2">
                <strong>Role:</strong> {invitation.role}
              </p>
            </div>
            <Button 
              onClick={() => handleAcceptInvitation(token!)}
              className="w-full"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Accept Invitation
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}

export default AcceptInvitation