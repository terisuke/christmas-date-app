-- Users table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname text,
  created_at timestamp with time zone DEFAULT now(),
  game_started_at timestamp with time zone,
  total_score int DEFAULT 0,
  affection int DEFAULT 1,
  steps_today int DEFAULT 0,
  game_completed boolean DEFAULT false
);

-- Spots table
CREATE TABLE spots (
  id text PRIMARY KEY,
  name text NOT NULL,
  lat float NOT NULL,
  lng float NOT NULL,
  base_point int NOT NULL,
  is_secret boolean DEFAULT false,
  unlock_condition text,
  event_script jsonb
);

-- Checkins table
CREATE TABLE checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  spot_id text REFERENCES spots(id),
  checked_at timestamp with time zone DEFAULT now(),
  earned_points int,
  selected_choice int,
  affection_change int
);

-- Chat logs table
CREATE TABLE chat_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  role text CHECK (role IN ('user', 'assistant')),
  content text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies (匿名ユーザー用)
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own data" ON users FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own checkins" ON checkins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own checkins" ON checkins FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own chat logs" ON chat_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chat logs" ON chat_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Spots are public
CREATE POLICY "Spots are viewable by everyone" ON spots FOR SELECT USING (true);
