// Database model types
export type Platform = 'instagram' | 'tiktok' | 'youtube';

export interface Creator {
  id: number;
  platform: Platform;
  handle: string;
  modash_creator_id: string | null;
  has_basic_profile: boolean;
  has_detailed_profile: boolean;
  detailed_profile_fetched_at: string | null;
  email_found: boolean;
  clay_enriched_at: string | null;
  basic_profile_data: Record<string, any> | null;
  detailed_profile_data: Record<string, any> | null;
  email: string | null;
  created_at: string;
  updated_at: string;
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
  api_provider: 'modash' | 'clay';
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
