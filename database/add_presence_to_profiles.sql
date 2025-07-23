-- Add online presence fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS online_status VARCHAR(10) DEFAULT 'offline' CHECK (online_status IN ('online', 'away', 'offline', 'studying'));

-- Add indexes for efficient online status queries
CREATE INDEX IF NOT EXISTS idx_profiles_online_status ON profiles (online_status);
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON profiles (last_seen);

-- Update existing profiles to have default values
UPDATE profiles 
SET 
  last_seen = NOW(),
  online_status = 'offline'
WHERE last_seen IS NULL OR online_status IS NULL;

-- Create a function to update last_seen automatically
CREATE OR REPLACE FUNCTION update_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_seen = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update last_seen when online_status changes
DROP TRIGGER IF EXISTS trigger_update_last_seen ON profiles;
CREATE TRIGGER trigger_update_last_seen
  BEFORE UPDATE OF online_status ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_last_seen();

-- Ensure users can update their own online status
-- (This policy might already exist, but we ensure it covers online status fields)
DROP POLICY IF EXISTS "Users can update own presence" ON profiles;
CREATE POLICY "Users can update own presence" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
