-- Create the friendships table
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure no duplicate relationships and no self-friending
  CONSTRAINT no_self_friendship CHECK (user_id != friend_id),
  CONSTRAINT unique_friendship UNIQUE (user_id, friend_id)
);

-- Create indexes for efficient querying
CREATE INDEX idx_friendships_user_id ON friendships (user_id);
CREATE INDEX idx_friendships_friend_id ON friendships (friend_id);
CREATE INDEX idx_friendships_status ON friendships (status);
CREATE INDEX idx_friendships_user_status ON friendships (user_id, status);

-- Enable Row Level Security
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view friendships where they are involved
CREATE POLICY "Users can view their friendships" ON friendships
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Users can insert friend requests they initiate
CREATE POLICY "Users can send friend requests" ON friendships
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update friendships where they are the recipient (to accept/decline)
CREATE POLICY "Users can respond to friend requests" ON friendships
    FOR UPDATE USING (auth.uid() = friend_id);

-- Users can delete friendships they are involved in (unfriend)
CREATE POLICY "Users can delete their friendships" ON friendships
    FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);
