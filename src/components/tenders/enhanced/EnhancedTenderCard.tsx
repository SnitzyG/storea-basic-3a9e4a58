import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, 
  DollarSign, 
  Users, 
  MessageSquare, 
  FileEdit, 
  Package,
  Clock,
  Award,
  AlertTriangle,
  CheckCircle,
  Eye,
  Edit,
  Play,
  Trophy,
  Mail,
  Trash2
} from 'lucide-react';
import { EnhancedTender } from '@/hooks/useEnhancedTenders';
import { formatDistanceToNow } from 'date-fns';
import { useTenderStatus } from '@/hooks/useTenderStatus';

interface EnhancedTenderCardProps {
  tender: EnhancedTender;
  userRole: string;
  onSelect?: (id: string, selected: boolean) => void;
  isSelected?: boolean;
  onView?: (tender: EnhancedTender) => void;
  onEdit?: (tender: EnhancedTender) => void;
  onPublish?: (tender: EnhancedTender) => void;
  onAward?: (tender: EnhancedTender) => void;
  onInvite?: (tender: EnhancedTender) => void;
  onDelete?: (tender: EnhancedTender) => void;
  onDiscussion?: (tender: EnhancedTender) => void;
  onEvaluate?: (tender: EnhancedTender) => void;
}

const typeColors = {
  standard: 'bg-blue-50 text-blue-700',
  design: 'bg-purple-50 text-purple-700',
  construction: 'bg-orange-50 text-orange-700',
  consulting: 'bg-green-50 text-green-700',
};

export const EnhancedTenderCard = ({ 
  tender, 
  userRole, 
  onSelect,
  isSelected = false,
  onView,
  onEdit,
  onPublish,
  onAward,
  onInvite,
  onDelete,
  onDiscussion,
  onEvaluate
}: EnhancedTenderCardProps) => {
  const [showDetails, setShowDetails] = useState(false);
  const { getStatusColor, getStatusLabel } = useTenderStatus();
  
  const deadline = new Date(tender.deadline);
  const isExpired = deadline < new Date();
  const isExpiringSoon = !isExpired && deadline.getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000;
  
  // Calculate tender progress based on workflow stage
  const getWorkflowProgress = () => {
    const stages = ['draft', 'published', 'bidding', 'evaluation', 'award'];
    const currentIndex = stages.findIndex(stage => 
      stage === tender.workflow_stage || 
      (tender.status === 'open' && stage === 'bidding') ||
      (tender.status === 'closed' && stage === 'evaluation') ||
      (tender.status === 'awarded' && stage === 'award')
    );
    return ((currentIndex + 1) / stages.length) * 100;
  };

  const canBid = tender.status === 'open' && !isExpired && 
                 ['contractor', 'builder'].includes(userRole) && 
                 !tender.my_bid;
  const canEdit = tender.status === 'draft' && userRole === 'architect';
  const canPublish = tender.status === 'draft' && userRole === 'architect';
  const canAward = tender.status === 'closed' && userRole === 'architect' && tender.bid_count! > 0;
  const canEvaluate = tender.status === 'closed' && userRole === 'architect';

  return (
    <Card className={`hover:shadow-lg transition-all duration-200 ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {onSelect && (
              <Checkbox 
                checked={isSelected}
                onCheckedChange={(checked) => onSelect(tender.id, !!checked)}
                className="mt-1"
              />
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-lg line-clamp-2 pr-2">
                  {tender.title}
                </h3>
                {isExpiringSoon && (
                  <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                )}
              </div>
              
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge className={getStatusColor(tender.status as any)}>
                  {getStatusLabel(tender.status as any)}
                </Badge>
                
                <Badge variant="outline" className={typeColors[tender.tender_type as keyof typeof typeColors] || 'bg-gray-50 text-gray-700'}>
                  {tender.tender_type}
                </Badge>
                
                {tender.package && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Package className="w-3 h-3" />
                    {tender.package.name}
                  </Badge>
                )}
                
                {tender.status === 'awarded' && tender.awarded_to_profile && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    Awarded to {tender.awarded_to_profile.name}
                  </Badge>
                )}
                
                {isExpired && tender.status === 'open' && (
                  <Badge className="bg-red-500/10 text-red-700 border-red-500/20">
                    Expired
                  </Badge>
                )}
              </div>

              {/* Workflow Progress */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Progress</span>
                  <span className="text-xs text-muted-foreground">{Math.round(getWorkflowProgress())}%</span>
                </div>
                <Progress value={getWorkflowProgress()} className="h-2" />
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2">
            {tender.description}
          </p>

          {/* Key Information Grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {/* Budget */}
            {tender.budget && (
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">
                  ${tender.budget.toLocaleString()}
                </span>
              </div>
            )}

            {/* Deadline */}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span className={isExpiringSoon ? 'text-orange-600 font-medium' : ''}>
                {deadline.toLocaleDateString()}
              </span>
            </div>

            {/* Bid Count */}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{tender.bid_count || 0} bid(s)</span>
            </div>

            {/* Time to Deadline */}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className={isExpired ? 'text-red-600' : isExpiringSoon ? 'text-orange-600' : ''}>
                {isExpired ? 'Expired' : formatDistanceToNow(deadline, { addSuffix: true })}
              </span>
            </div>
          </div>

          {/* Issued by */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Avatar className="w-5 h-5">
              <AvatarFallback className="text-xs">
                {tender.issued_by_profile?.name?.charAt(0) || 'A'}
              </AvatarFallback>
            </Avatar>
            <span>
              Issued by {tender.issued_by_profile?.name || 'Unknown'}
            </span>
          </div>

          {/* Engagement Stats */}
          {(tender.discussions_count! > 0 || tender.amendments_count! > 0) && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {tender.discussions_count! > 0 && (
                <div className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  <span>{tender.discussions_count} discussions</span>
                </div>
              )}
              {tender.amendments_count! > 0 && (
                <div className="flex items-center gap-1">
                  <FileEdit className="w-3 h-3" />
                  <span>{tender.amendments_count} amendments</span>
                </div>
              )}
            </div>
          )}

          {/* My Bid Status */}
          {tender.my_bid && (
            <div className="p-2 bg-blue-50 rounded-md">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">My Bid</span>
                <Badge variant="outline" className={
                  tender.my_bid.status === 'accepted' ? 'border-green-500 text-green-700' :
                  tender.my_bid.status === 'rejected' ? 'border-red-500 text-red-700' :
                  'border-blue-500 text-blue-700'
                }>
                  {tender.my_bid.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                ${tender.my_bid.bid_amount.toLocaleString()}
              </p>
            </div>
          )}

          {/* Compliance and Evaluation Indicators */}
          {tender.status === 'closed' && userRole === 'architect' && (
            <div className="flex items-center gap-2 text-xs">
              {tender.bid_count! > 0 && (
                <>
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span className="text-green-700">Ready for evaluation</span>
                </>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => onView?.(tender)}>
              <Eye className="w-4 h-4 mr-1" />
              View
            </Button>
            
            {canBid && (
              <Button size="sm">
                Submit Bid
              </Button>
            )}
            
            {canEdit && onEdit && (
              <Button variant="outline" size="sm" onClick={() => onEdit(tender)}>
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
            )}
            
            {canPublish && onPublish && (
              <Button size="sm" onClick={() => onPublish(tender)}>
                <Play className="w-4 h-4 mr-1" />
                Publish
              </Button>
            )}
            
            {canAward && onAward && (
              <Button size="sm" onClick={() => onAward(tender)}>
                <Trophy className="w-4 h-4 mr-1" />
                Award
              </Button>
            )}

            {canEvaluate && onEvaluate && (
              <Button variant="outline" size="sm" onClick={() => onEvaluate(tender)}>
                <Award className="w-4 h-4 mr-1" />
                Evaluate
              </Button>
            )}
            
            {(tender.status === 'draft' || tender.status === 'open') && userRole === 'architect' && onInvite && (
              <Button variant="outline" size="sm" onClick={() => onInvite(tender)}>
                <Mail className="w-4 h-4 mr-1" />
                Invite
              </Button>
            )}

            {onDiscussion && (
              <Button variant="outline" size="sm" onClick={() => onDiscussion(tender)}>
                <MessageSquare className="w-4 h-4 mr-1" />
                Discuss
              </Button>
            )}
            
            {userRole === 'architect' && tender.status === 'draft' && onDelete && (
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => onDelete(tender)}>
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};