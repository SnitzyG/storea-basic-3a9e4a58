import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const ProjectJoin = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [projectInfo, setProjectInfo] = useState<any>(null)
  const { projectId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    handleProjectJoin()
  }, [user, projectId])

  const handleProjectJoin = async () => {
    try {
      if (!user) {
        // User needs to authenticate first - this will happen automatically via Supabase magic link
        setError('Please complete the authentication process to join the project')
        setLoading(false)
        return
      }

      if (!projectId) {
        throw new Error('Invalid project link')
      }

      // Get project information
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id, name, description')
        .eq('id', projectId)
        .maybeSingle()

      if (projectError || !project) {
        throw new Error('Project not found or invalid')
      }

      setProjectInfo(project)

      // Get user metadata from auth to find role and invitation info
      const { data: userData } = await supabase.auth.getUser()
      const userMetadata = userData.user?.user_metadata

      if (!userMetadata?.project_id || userMetadata.project_id !== projectId) {
        throw new Error('Invalid invitation link for this project')
      }

      const role = userMetadata.role
      const inviterName = userMetadata.inviter_name

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('project_users')
        .select('id, role')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (existingMember) {
        toast({
          title: "Already a member",
          description: `You're already a member of ${project.name} as a ${existingMember.role}.`
        })
        navigate('/projects')
        return
      }

      // Add user to project team
      const { error: memberError } = await supabase
        .from('project_users')
        .insert([{
          project_id: projectId,
          user_id: user.id,
          role: (role === 'architect' || role === 'builder') ? 'lead_contractor' : (role === 'homeowner' ? 'client' : 'lead_contractor'),
          invited_by: userMetadata.inviter_id || null,
          joined_at: new Date().toISOString()
        }])

      if (memberError) {
        throw new Error('Failed to add you to the project: ' + memberError.message)
      }

      // Update any pending invitations to accepted status
      const { error: updateError } = await supabase
        .from('invitations')
        .update({ 
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('project_id', projectId)
        .eq('email', user.email)

      if (updateError) {
        console.warn('Failed to update invitation status:', updateError)
      }

      setSuccess(true)
      
      toast({
        title: "Welcome to the team!",
        description: `You've successfully joined ${project.name} as a ${role}.`
      })

      // Redirect to project after 2 seconds
      setTimeout(() => {
        navigate('/projects')
      }, 2000)

    } catch (err: any) {
      console.error('Project join error:', err)
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
            <h1 className="text-xl font-semibold mb-2">Joining project...</h1>
            <p className="text-muted-foreground">Please wait while we add you to the team.</p>
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
            <h1 className="text-xl font-semibold text-destructive mb-4">Unable to Join Project</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <div className="space-y-2">
              <Button onClick={() => navigate('/auth')} variant="default">
                Sign In / Sign Up
              </Button>
              <Button onClick={() => navigate('/projects')} variant="outline">
                Go to Projects
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success && projectInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-green-600 mb-4">Welcome to the Team!</h1>
            <p className="text-muted-foreground mb-6">
              You've successfully joined <strong>{projectInfo.name}</strong>.
            </p>
            <p className="text-sm text-muted-foreground">Redirecting you to projects...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}

export default ProjectJoin