import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, DollarSign, Users, Award, Clock } from 'lucide-react';
import { Tender } from '@/hooks/useTenders';
import { formatDistanceToNow } from 'date-fns';

interface TenderCardProps {
  tender: Tender;
  userRole: string;
  onView: (tender: Tender) => void;
  onBid?: (tender: Tender) => void;
  onEdit?: (tender: Tender) => void;
  onPublish?: (tender: Tender) => void;
  onAward?: (tender: Tender) => void;
}

const statusColors = {
  draft: 'bg-gray-500/10 text-gray-700 border-gray-500/20',
  open: 'bg-green-500/10 text-green-700 border-green-500/20',
  closed: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
  awarded: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  cancelled: 'bg-red-500/10 text-red-700 border-red-500/20',
};

const statusLabels = {
  draft: 'Draft',
  open: 'Open for Bidding',
  closed: 'Closed',
  awarded: 'Awarded',
  cancelled: 'Cancelled',
};

export const TenderCard = ({ 
  tender, 
  userRole, 
  onView, 
  onBid, 
  onEdit, 
  onPublish, 
  onAward 
}: TenderCardProps) => {
  const deadline = new Date(tender.deadline);
  const isExpired = deadline < new Date();
  const canBid = tender.status === 'open' && !isExpired && 
                 ['contractor', 'builder'].includes(userRole) && 
                 !tender.my_bid;
  const canEdit = tender.status === 'draft' && userRole === 'architect';
  const canPublish = tender.status === 'draft' && userRole === 'architect';
  const canAward = tender.status === 'closed' && userRole === 'architect' && tender.bid_count! > 0;

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2 mb-2">
              {tender.title}
            </CardTitle>
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge className={statusColors[tender.status]}>
                {statusLabels[tender.status]}
              </Badge>
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
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2">
            {tender.description}
          </p>

          {/* Budget */}
          {tender.budget && (
            <div className="flex items-center text-sm">
              <DollarSign className="w-4 h-4 mr-2 text-muted-foreground" />
              <span className="font-medium">
                Budget: ${tender.budget.toLocaleString()}
              </span>
            </div>
          )}

          {/* Deadline */}
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="w-4 h-4 mr-2" />
            <span>
              Deadline: {deadline.toLocaleDateString()} 
              {!isExpired && (
                <span className="ml-1">
                  ({formatDistanceToNow(deadline, { addSuffix: true })})
                </span>
              )}
            </span>
          </div>

          {/* Issued by */}
          <div className="flex items-center text-sm text-muted-foreground">
            <Avatar className="w-5 h-5 mr-2">
              <AvatarFallback className="text-xs">
                {tender.issued_by_profile?.name?.charAt(0) || 'A'}
              </AvatarFallback>
            </Avatar>
            <span>
              Issued by {tender.issued_by_profile?.name || 'Unknown'}
            </span>
          </div>

          {/* Bid count */}
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="w-4 h-4 mr-2" />
            <span>{tender.bid_count || 0} bid(s) received</span>
            {tender.my_bid && (
              <Badge variant="outline" className="ml-2">
                You bid ${tender.my_bid.bid_amount.toLocaleString()}
              </Badge>
            )}
          </div>

          {/* Time info */}
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="w-4 h-4 mr-2" />
            <span>
              Created {formatDistanceToNow(new Date(tender.created_at), { addSuffix: true })}
            </span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => onView(tender)}>
              View Details
            </Button>
            
            {canBid && onBid && (
              <Button size="sm" onClick={() => onBid(tender)}>
                Submit Bid
              </Button>
            )}
            
            {canEdit && onEdit && (
              <Button variant="outline" size="sm" onClick={() => onEdit(tender)}>
                Edit
              </Button>
            )}
            
            {canPublish && onPublish && (
              <Button size="sm" onClick={() => onPublish(tender)}>
                Publish
              </Button>
            )}
            
            {canAward && onAward && (
              <Button size="sm" onClick={() => onAward(tender)}>
                Award Tender
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};