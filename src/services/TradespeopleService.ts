import { supabase } from "@/integrations/supabase/client";

export interface ExternalTradesperson {
  id: string;
  name: string;
  business_name: string;
  role: string;
  address: string;
  phone?: string;
  email?: string;
  website?: string;
  rating?: number;
  reviews_count?: number;
  latitude: number;
  longitude: number;
  distance_km?: number;
  source: 'google_places' | 'qbcc' | 'vba' | 'hipages' | 'mock';
}

// Mock data for demonstration - in production this would call real APIs
const MOCK_TRADESPEOPLE: ExternalTradesperson[] = [
  {
    id: 'mock_1',
    name: 'Melbourne Building Co',
    business_name: 'Melbourne Building Co',
    role: 'builder',
    address: '123 Collins Street, Melbourne VIC 3000',
    phone: '(03) 9123 4567',
    email: 'contact@melbournebuild.com.au',
    website: 'https://melbournebuild.com.au',
    rating: 4.8,
    reviews_count: 127,
    latitude: -37.8136,
    longitude: 144.9631,
    source: 'mock'
  },
  {
    id: 'mock_2', 
    name: 'Precision Plumbing Services',
    business_name: 'Precision Plumbing Services',
    role: 'contractor',
    address: '456 Swanston Street, Melbourne VIC 3000',
    phone: '(03) 9234 5678',
    email: 'info@precisionplumbing.com.au',
    rating: 4.6,
    reviews_count: 89,
    latitude: -37.8080,
    longitude: 144.9633,
    source: 'mock'
  },
  {
    id: 'mock_3',
    name: 'Elite Electrical Solutions',
    business_name: 'Elite Electrical Solutions', 
    role: 'contractor',
    address: '789 Chapel Street, South Yarra VIC 3141',
    phone: '(03) 9345 6789',
    email: 'hello@eliteelectrical.com.au',
    website: 'https://eliteelectrical.com.au',
    rating: 4.9,
    reviews_count: 203,
    latitude: -37.8467,
    longitude: 144.9880,
    source: 'mock'
  },
  {
    id: 'mock_4',
    name: 'Heritage Carpentry Works',
    business_name: 'Heritage Carpentry Works',
    role: 'builder',
    address: '321 Johnston Street, Fitzroy VIC 3065',
    phone: '(03) 9456 7890',
    email: 'craft@heritagecarpentry.com.au',
    rating: 4.7,
    reviews_count: 156,
    latitude: -37.7983,
    longitude: 144.9784,
    source: 'mock'
  },
  {
    id: 'mock_5',
    name: 'Citywide Roofing Specialists',
    business_name: 'Citywide Roofing Specialists',
    role: 'contractor',
    address: '654 High Street, Prahran VIC 3181',
    phone: '(03) 9567 8901',
    email: 'roof@citywideroof.com.au',
    website: 'https://citywideroof.com.au',
    rating: 4.5,
    reviews_count: 98,
    latitude: -37.8500,
    longitude: 144.9900,
    source: 'mock'
  },
  {
    id: 'mock_6',
    name: 'Modern Architecture Studio',
    business_name: 'Modern Architecture Studio',
    role: 'architect',
    address: '987 Bourke Street, Melbourne VIC 3000',
    phone: '(03) 9678 9012',
    email: 'design@modernarch.com.au',
    website: 'https://modernarch.com.au',
    rating: 4.8,
    reviews_count: 74,
    latitude: -37.8142,
    longitude: 144.9560,
    source: 'mock'
  },
  {
    id: 'mock_7',
    name: 'Reliable Tiling Services',
    business_name: 'Reliable Tiling Services',
    role: 'contractor',
    address: '147 Bridge Road, Richmond VIC 3121',
    phone: '(03) 9789 0123',
    email: 'tiles@reliabletiling.com.au',
    rating: 4.4,
    reviews_count: 112,
    latitude: -37.8197,
    longitude: 144.9850,
    source: 'mock'
  },
  {
    id: 'mock_8',
    name: 'Premier Painting Solutions',
    business_name: 'Premier Painting Solutions',
    role: 'contractor',
    address: '258 Smith Street, Collingwood VIC 3066',
    phone: '(03) 9890 1234',
    email: 'paint@premierpainting.com.au',
    website: 'https://premierpainting.com.au',
    rating: 4.6,
    reviews_count: 145,
    latitude: -37.8030,
    longitude: 144.9890,
    source: 'mock'
  }
];

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Fetch tradespeople from external sources based on project locations
 */
export async function fetchExternalTradespeople(
  projectLatitudes: number[], 
  projectLongitudes: number[],
  radiusKm: number = 25
): Promise<ExternalTradesperson[]> {
  
  if (projectLatitudes.length === 0 || projectLongitudes.length === 0) {
    return [];
  }

  // Calculate center point of all projects
  const centerLat = projectLatitudes.reduce((sum, lat) => sum + lat, 0) / projectLatitudes.length;
  const centerLng = projectLongitudes.reduce((sum, lng) => sum + lng, 0) / projectLongitudes.length;

  // In production, this would call real APIs:
  // 1. Google Places API for contractors/builders near location
  // 2. QBCC Licensed Contractors Register (Queensland)
  // 3. VBA Building Practitioner Register (Victoria) 
  // 4. ServiceNSW API for licensed contractors
  // 5. Hipages API (if available)

  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Filter mock data by distance and add distance calculation
    const tradespeopleWithDistance = MOCK_TRADESPEOPLE
      .map(tp => ({
        ...tp,
        distance_km: calculateDistance(centerLat, centerLng, tp.latitude, tp.longitude)
      }))
      .filter(tp => tp.distance_km <= radiusKm)
      .sort((a, b) => a.distance_km - b.distance_km);

    console.log(`Found ${tradespeopleWithDistance.length} tradespeople within ${radiusKm}km`);
    return tradespeopleWithDistance;

  } catch (error) {
    console.error('Error fetching external tradespeople:', error);
    return [];
  }
}

/**
 * Fetch tradespeople from Google Places API (production implementation)
 */
async function fetchGooglePlacesTradespeople(
  lat: number, 
  lng: number, 
  radius: number
): Promise<ExternalTradesperson[]> {
  // This would require a Google Places API key
  // const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
  
  // In production, you would:
  // 1. Set up Google Places API key in environment variables
  // 2. Make requests to Places Nearby Search API
  // 3. Filter for construction-related business types
  // 4. Transform the response to ExternalTradesperson format
  
  return []; // Placeholder for production implementation
}

/**
 * Fetch licensed contractors from Queensland QBCC register
 */
async function fetchQBCCContractors(): Promise<ExternalTradesperson[]> {
  // This would call the QBCC Open Data API
  // const QBCC_API_URL = 'https://www.data.qld.gov.au/api/3/action/datastore_search';
  
  // In production, you would:
  // 1. Call QBCC Licensed Contractors Register API
  // 2. Filter by location and license status
  // 3. Transform to ExternalTradesperson format
  
  return []; // Placeholder for production implementation
}

/**
 * Get all available tradespeople (internal + external)
 */
export async function getAllTradespeople(
  projectIds: string[],
  projectCoordinates: { lat: number; lng: number }[]
): Promise<{
  internal: any[]; // From project teams
  external: ExternalTradesperson[];
}> {
  
  // Fetch internal tradespeople from project teams
  let internal: any[] = [];
  if (projectIds.length > 0) {
    try {
      const { data: projectUsers } = await supabase
        .from('project_users')
        .select(`
          user_id,
          role,
          profiles!inner(
            id,
            name,
            company_name,
            company_address,
            phone,
            user_id
          )
        `)
        .in('project_id', projectIds)
        .in('role', ['contractor', 'builder', 'architect'])
        .not('profiles.company_address', 'is', null);

      // Deduplicate by user_id
      internal = projectUsers?.reduce((acc: any[], curr: any) => {
        const existing = acc.find((t: any) => t.user_id === curr.user_id);
        if (!existing && curr.profiles?.company_address) {
          acc.push({
            id: curr.profiles.id,
            name: curr.profiles.name,
            role: curr.role,
            company_name: curr.profiles.company_name,
            company_address: curr.profiles.company_address,
            phone: curr.profiles.phone,
            user_id: curr.user_id,
            source: 'internal'
          });
        }
        return acc;
      }, []) || [];
    } catch (error) {
      console.error('Error fetching internal tradespeople:', error);
    }
  }

  // Fetch external tradespeople
  const external = projectCoordinates.length > 0 
    ? await fetchExternalTradespeople(
        projectCoordinates.map(c => c.lat),
        projectCoordinates.map(c => c.lng)
      )
    : [];

  return { internal, external };
}