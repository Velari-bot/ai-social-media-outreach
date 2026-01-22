// Database model types
export type Platform = 'instagram' | 'tiktok' | 'youtube';

export interface Creator {
  id: string | number; // Firestore ID
  platform: Platform;
  handle: string;
  verality_id: string | null; // Mapped from external ID if useful, or alias for id
  has_basic_profile: boolean;
  has_detailed_profile: boolean;
  detailed_profile_fetched_at: string | null;
  email_found: boolean;
  clay_enriched_at: string | null;
  enrichment_status?: 'pending' | 'processing' | 'enriched' | 'failed';
  basic_profile_data: Record<string, any> | null;
  detailed_profile_data: Record<string, any> | null;
  email: string | null;
  email_source?: 'youtube_about' | 'youtube_description' | 'youtube_links' | 'clay' | 'none'; // Track where email came from
  name?: string | null;
  full_name?: string | null;
  followers?: number;
  engagement_rate?: number;
  picture?: string | null;
  location?: string | null;
  phone?: string | null;
  bio?: string | null;
  website?: string | null;
  niche?: string | null;
  avg_views?: number;
  insight_tag?: string;
  ranking_score?: number;
  source?: string | 'influencers_club';
  created_at: string;
  updated_at: string;
}

/**
 * New Firestore Creator Schema
 * Primary Key: verality_id
 */
export interface FirestoreCreator {
  verality_id: string; // REQUIRED (primary key)
  full_name: string;
  company: string;
  title: string;
  linkedin_url?: string;
  email?: string;
  other_emails?: string[]; // Array of additional emails found
  email_status?: string;
  phone?: string;
  region?: string;
  profile_url?: string; // Link to social media profile (not image)
  picture_url?: string; // PFP Image URL
  niche?: string;
  followers?: number;
  [key: string]: any;
}

export interface DiscoveryPipelineResponse {
  creators: Creator[];
  meta: {
    total_requested: number;
    internal_hits: number;
    external_fetches: number;
    credits_consumed: number;
    next_offset?: number;
    next_youtube_page_token?: string;
    next_keyword_index?: number;
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
