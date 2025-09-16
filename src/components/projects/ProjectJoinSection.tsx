import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  UserPlus, 
  Clock, 
  CheckCircle, 
  XCircle, 
  MessageSquare,
  Calendar,
  Send
} from 'lucide-react';
import { useProjectJoinRequests } from '@/hooks/useProjectJoinRequests';
import { formatDistanceToNow } from 'date-fns';

interface ProjectJoinSectionProps {
  className?: string;
}

export const ProjectJoinSection: React.FC<ProjectJoinSectionProps> = ({ className }) => {
  const [projectCode, setProjectCode] = useState('');
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const { 
    joinRequests, 
    loading, 
    submitJoinRequest, 
    respondToJoinRequest 
  } = useProjectJoinRequests();

  const handleSubmitRequest = async () => {
    if (!projectCode.trim() || !name.trim() || !role) return;
    
    setSubmitting(true);
    const success = await submitJoinRequest(
      projectCode.trim(), 
      message.trim(),
      name.trim(),
      company.trim(),
      role
    );
    if (success) {
      setProjectCode('');
      setMessage('');
      setName('');
      setCompany('');
      setRole('');
    }
    setSubmitting(false);
  };

  const handleRespondToRequest = async (requestId: string, action: 'approve' | 'reject') => {
    await respondToJoinRequest(requestId, action);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const pendingRequests = joinRequests.filter(req => req.status === 'pending' && !req.requester_id);
  const myRequests = joinRequests.filter(req => req.requester_id);
  const requestsForMyProjects = joinRequests.filter(req => req.project?.name && !req.requester_id);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Join Project Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Join a Project
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Project ID *</label>
            <Input
              placeholder="Enter 15-character project ID (e.g., ABC123XYZ789DEF)"
              value={projectCode}
              onChange={(e) => setProjectCode(e.target.value.toUpperCase())}
              maxLength={15}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Ask the project creator for their unique Project ID
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Name *</label>
              <Input
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Company</label>
              <Input
                placeholder="Your company name"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Role *</label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contractor">Contractor</SelectItem>
                <SelectItem value="subcontractor">Subcontractor</SelectItem>
                <SelectItem value="consultant">Consultant</SelectItem>
                <SelectItem value="engineer">Engineer</SelectItem>
                <SelectItem value="surveyor">Surveyor</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Message</label>
            <Textarea
              placeholder="Add a message to introduce yourself..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
          
          <Button 
            onClick={handleSubmitRequest}
            disabled={!projectCode.trim() || !name.trim() || !role || submitting}
            className="w-full"
          >
            <Send className="h-4 w-4 mr-2" />
            {submitting ? 'Sending Request...' : 'Request to Join'}
          </Button>
        </CardContent>
      </Card>

      {/* Pending Requests for My Projects */}
      {pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Pending Join Requests ({pendingRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingRequests.map((request) => (
              <div key={request.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={request.requester?.avatar_url} />
                      <AvatarFallback>
                        {request.requester_name?.charAt(0) || request.requester_email?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {request.requester_name || request.requester_email}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {request.company && <span>from {request.company} • </span>}
                        {request.role && <span>Role: {request.role} • </span>}
                        wants to join • {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                  <Badge className={getStatusColor(request.status)}>
                    {getStatusIcon(request.status)}
                    <span className="ml-1 capitalize">{request.status}</span>
                  </Badge>
                </div>
                
                {request.message && (
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-sm">{request.message}</p>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => handleRespondToRequest(request.id, 'approve')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleRespondToRequest(request.id, 'reject')}
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* My Join Requests */}
      {myRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Project Join Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {myRequests.map((request) => (
              <div key={request.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium">
                      {request.project?.name || 'Unknown Project'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Code: {request.project_code} • {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                    </div>
                  </div>
                  <Badge className={getStatusColor(request.status)}>
                    {getStatusIcon(request.status)}
                    <span className="ml-1 capitalize">{request.status}</span>
                  </Badge>
                </div>
                
                {request.message && (
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-sm">{request.message}</p>
                  </div>
                )}
                
                {request.status === 'pending' && (
                  <p className="text-sm text-muted-foreground">
                    Waiting for project creator to respond...
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* No Requests State */}
      {!loading && joinRequests.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No join requests</h3>
            <p className="text-muted-foreground">
              Enter a Project ID above to request access to join a project.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};