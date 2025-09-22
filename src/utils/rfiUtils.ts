import { RFI } from '@/hooks/useRFIs';

/**
 * Get the display label for an RFI type
 */
export const getRFITypeLabel = (rfiType?: string): string => {
  switch (rfiType) {
    case 'general_correspondence':
      return 'General Correspondence';
    case 'request_for_information':
      return 'Request for Information';
    case 'general_advice':
      return 'General Advice';
    default:
      return 'General Correspondence';
  }
};

/**
 * Get the short type code for an RFI type (used in RFI numbers)
 */
export const getRFITypeCode = (rfiType?: string): string => {
  switch (rfiType) {
    case 'general_correspondence':
      return 'GC';
    case 'request_for_information':
      return 'RFI';
    case 'general_advice':
      return 'GA';
    default:
      return 'RFI';
  }
};

/**
 * Format the full RFI display number with type and company
 * Format: "RFI_NUMBER - Type Description from Company"
 * Example: "RGA-GC-0001 - General Correspondence from RG Architects"
 */
export const getRFIDisplayNumber = (rfi: RFI): string => {
  const rfiNumber = rfi.rfi_number || `RFI-${rfi.id.slice(0, 8)}`;
  const typeLabel = getRFITypeLabel(rfi.rfi_type);
  const companyName = rfi.raised_by_company_name || 'Unknown Company';
  return `${rfiNumber} - ${typeLabel} from ${companyName}`;
};

/**
 * Get just the RFI number with type (without company)
 * Format: "RFI_NUMBER - Type Description"
 * Example: "RGA-GC-0001 - General Correspondence"
 */
export const getRFINumberWithType = (rfi: RFI): string => {
  const rfiNumber = rfi.rfi_number || `RFI-${rfi.id.slice(0, 8)}`;
  const typeLabel = getRFITypeLabel(rfi.rfi_type);
  return `${rfiNumber} - ${typeLabel}`;
};

/**
 * Check if an RFI response is required based on its type
 */
export const isResponseRequired = (rfi: RFI): boolean => {
  return rfi.rfi_type === 'request_for_information';
};

/**
 * Get the icon color class for an RFI type
 */
export const getRFITypeIconColor = (rfiType?: string): string => {
  switch (rfiType) {
    case 'general_correspondence':
      return 'text-blue-600';
    case 'request_for_information':
      return 'text-green-600';
    case 'general_advice':
      return 'text-purple-600';
    default:
      return 'text-blue-600';
  }
};