import { Profile } from '@/context/AuthContext';

/**
 * Check if a user's profile is complete based on their role
 */
export const isProfileComplete = (profile: Profile | null): boolean => {
  if (!profile || !profile.name || !profile.phone) return false;
  
  // Check role-specific required fields
  const profileAny = profile as any;
  
  switch(profile.role) {
    case 'homeowner':
      return !!(profileAny.property_address && profileAny.project_type);
    case 'architect':
      return !!(profile.company_id && profileAny.professional_license_number && profileAny.years_experience !== null);
    case 'builder':
      return !!(profile.company_id && profileAny.business_registration_number && profileAny.company_address);
    case 'contractor':
      return !!(profileAny.professional_license_number && profileAny.years_experience !== null);
    default:
      return false;
  }
};
