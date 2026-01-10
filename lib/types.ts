// Database model types
export type Platform = 'instagram' | 'tiktok' | 'youtube';

export interface Creator {
  id: string | number;
  platform: Platform;
  handle: string;
  modash_creator_id: string | null;
  has_basic_profile: boolean;
  has_detailed_profile: boolean;
  detailed_profile_fetched_at: string | null;
  email_found: boolean;
  clay_enriched_at: string | null;
  enrichment_status?: 'pending' | 'processing' | 'enriched' | 'failed';
  basic_profile_data: Record<string, any> | null;
  detailed_profile_data: Record<string, any> | null;
  email: string | null;
  name?: string | null;
  full_name?: string | null;
  followers?: number;
  engagement_rate?: number;
  picture?: string | null;
  location?: string | null;
  phone?: string | null;
  bio?: string | null;
  website?: string | null;
  source?: string | 'influencers_club';
  created_at: string;
  updated_at: string;
}

export interface DiscoveryPipelineResponse {
  creators: Creator[];
  meta: {
    total_requested: number;
    internal_hits: number;
    external_fetches: number;
    credits_consumed: number;
  };
}

export interface SearchRequest {
  id: number;
  user_id: string;
  platform: Platform;
  filters_json: Record<string, any>;
  filters_hash: string;
  requested_count: number;
  created_at: string;
}

export interface UsageCounters {
  month: string; // Format: 'YYYY-MM'
  modash_discoveries_used: number;
  modash_reports_used: number;
  created_at: string;
  updated_at: string;
}

export interface ApiCallLog {
  id: number;
  api_provider: 'modash' | 'clay' | 'influencer_club';
  api_action: string;
  reason: string;
  creator_id: number | null;
  user_id: string | null;
  created_at: string;
}

// Search filter types
export interface CreatorSearchFilters {
  platform: Platform;
  minFollowers?: number;
  maxFollowers?: number;
  minEngagementRate?: number;
  maxEngagementRate?: number;
  categories?: string[];
  location?: string;
  language?: string;
  [key: string]: any;
}

// Modash API response types
export interface ModashDiscoveryResult {
  creator_id: string;
  handle: string;
  platform: string;
  followers?: number;
  engagement_rate?: number;
  [key: string]: any;
}

export interface ModashDetailedProfile {
  creator_id: string;
  handle: string;
  platform: string;
  followers: number;
  engagement_rate: number;
  email?: string;
  [key: string]: any;
}

// Clay API response types
export interface ClayEnrichmentResult {
  email?: string;
  phone?: string;
  bio?: string;
  website?: string;
  full_name?: string;
  location?: string;
  social_links?: Record<string, string>;
  email_verified?: boolean;
  [key: string]: any;
}


// Booking System Types
export interface AvailabilitySlot {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // ISO string
  endTime: string; // ISO string
  isBooked: boolean;
}

export interface BookingDetails {
  name: string;
  email: string;
  company: string;
  selectedTierGuess: string;
  date: string;
  time: string;
}
