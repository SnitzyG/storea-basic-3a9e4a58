import { TenderBidSubmissionWizard } from './TenderBidSubmissionWizard';
import { Tender } from '@/hooks/useTenders';

interface BidSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tender: Tender | null;
  onSuccess?: () => void;
}

export const BidSubmissionDialog = ({ open, onOpenChange, tender, onSuccess }: BidSubmissionDialogProps) => {
  if (!tender) return null;

  return (
    <TenderBidSubmissionWizard
      open={open}
      onOpenChange={onOpenChange}
      tender={tender}
      onSuccess={onSuccess}
    />
  );
};
