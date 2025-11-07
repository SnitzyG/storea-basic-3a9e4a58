import { TenderBidSubmissionWizard } from './TenderBidSubmissionWizard';
import { Tender } from '@/hooks/useTenders';
import { TenderLineItem } from '@/hooks/useTenderLineItems';

interface BidSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tender: Tender | null;
  lineItems?: TenderLineItem[];
  onSuccess?: () => void;
}

export const BidSubmissionDialog = ({ open, onOpenChange, tender, lineItems = [], onSuccess }: BidSubmissionDialogProps) => {
  if (!tender) return null;

  return (
    <TenderBidSubmissionWizard
      open={open}
      onOpenChange={onOpenChange}
      tender={tender}
      lineItems={lineItems}
      onSuccess={onSuccess}
    />
  );
};
