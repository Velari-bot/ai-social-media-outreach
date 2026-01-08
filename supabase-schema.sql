-- Create user_accounts table
CREATE TABLE IF NOT EXISTS user_accounts (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  email_quota_daily INTEGER NOT NULL DEFAULT 100,
  email_quota_monthly INTEGER NOT NULL DEFAULT 3000,
  email_used_today INTEGER NOT NULL DEFAULT 0,
  email_used_this_month INTEGER NOT NULL DEFAULT 0,
  quota_reset_date TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 day'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create creator_requests table
CREATE TABLE IF NOT EXISTS creator_requests (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  platforms TEXT[] NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'delivered', 'failed')),
  date_submitted TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  results_count INTEGER,
  criteria JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_creator_requests_user_id ON creator_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_creator_requests_created_at ON creator_requests(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_accounts
CREATE POLICY "Users can view their own account"
  ON user_accounts FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own account"
  ON user_accounts FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own account"
  ON user_accounts FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for creator_requests
CREATE POLICY "Users can view their own requests"
  ON creator_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own requests"
  ON creator_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own requests"
  ON creator_requests FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_user_accounts_updated_at
  BEFORE UPDATE ON user_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_creator_requests_updated_at
  BEFORE UPDATE ON creator_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create creators table
CREATE TABLE IF NOT EXISTS creators (
  id BIGSERIAL PRIMARY KEY,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'tiktok', 'youtube')),
  handle TEXT NOT NULL,
  modash_creator_id TEXT,
  has_basic_profile BOOLEAN NOT NULL DEFAULT false,
  has_detailed_profile BOOLEAN NOT NULL DEFAULT false,
  detailed_profile_fetched_at TIMESTAMPTZ,
  email_found BOOLEAN NOT NULL DEFAULT false,
  clay_enriched_at TIMESTAMPTZ,
  basic_profile_data JSONB,
  detailed_profile_data JSONB,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(platform, handle)
);

-- Create search_requests table
CREATE TABLE IF NOT EXISTS search_requests (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'tiktok', 'youtube')),
  filters_json JSONB NOT NULL DEFAULT '{}',
  filters_hash TEXT NOT NULL,
  requested_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create usage_counters table
CREATE TABLE IF NOT EXISTS usage_counters (
  month TEXT PRIMARY KEY, -- Format: 'YYYY-MM'
  modash_discoveries_used INTEGER NOT NULL DEFAULT 0,
  modash_reports_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create api_call_logs table for tracking
CREATE TABLE IF NOT EXISTS api_call_logs (
  id BIGSERIAL PRIMARY KEY,
  api_provider TEXT NOT NULL CHECK (api_provider IN ('modash', 'clay')),
  api_action TEXT NOT NULL,
  reason TEXT NOT NULL,
  creator_id BIGINT REFERENCES creators(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for creators table
CREATE INDEX IF NOT EXISTS idx_creators_platform_handle ON creators(platform, handle);
CREATE INDEX IF NOT EXISTS idx_creators_modash_id ON creators(modash_creator_id);
CREATE INDEX IF NOT EXISTS idx_creators_has_basic_profile ON creators(has_basic_profile);
CREATE INDEX IF NOT EXISTS idx_creators_has_detailed_profile ON creators(has_detailed_profile);

-- Create indexes for search_requests table
CREATE INDEX IF NOT EXISTS idx_search_requests_user_id ON search_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_search_requests_filters_hash ON search_requests(filters_hash);
CREATE INDEX IF NOT EXISTS idx_search_requests_platform ON search_requests(platform);

-- Create indexes for api_call_logs table
CREATE INDEX IF NOT EXISTS idx_api_call_logs_created_at ON api_call_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_call_logs_api_provider ON api_call_logs(api_provider);

-- Enable RLS on new tables
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_call_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for creators
CREATE POLICY "Users can view all creators"
  ON creators FOR SELECT
  USING (true);

CREATE POLICY "Service can insert creators"
  ON creators FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service can update creators"
  ON creators FOR UPDATE
  USING (true);

-- RLS Policies for search_requests
CREATE POLICY "Users can view their own search requests"
  ON search_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own search requests"
  ON search_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for usage_counters (read-only for users, service can update)
CREATE POLICY "Users can view usage counters"
  ON usage_counters FOR SELECT
  USING (true);

CREATE POLICY "Service can update usage counters"
  ON usage_counters FOR UPDATE
  USING (true);

CREATE POLICY "Service can insert usage counters"
  ON usage_counters FOR INSERT
  WITH CHECK (true);

-- RLS Policies for api_call_logs
CREATE POLICY "Users can view their own api call logs"
  ON api_call_logs FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Service can insert api call logs"
  ON api_call_logs FOR INSERT
  WITH CHECK (true);

-- Create trigger for creators updated_at
CREATE TRIGGER update_creators_updated_at
  BEFORE UPDATE ON creators
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for usage_counters updated_at
CREATE TRIGGER update_usage_counters_updated_at
  BEFORE UPDATE ON usage_counters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

