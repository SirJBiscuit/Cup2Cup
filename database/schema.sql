-- Cup2Cup Database Schema
-- PostgreSQL 14+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (for account owners)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  -- SoundCloud OAuth
  soundcloud_connected BOOLEAN DEFAULT false,
  soundcloud_user_id VARCHAR(255),
  soundcloud_access_token TEXT,
  soundcloud_refresh_token TEXT,
  soundcloud_token_expires TIMESTAMP,
  -- Spotify OAuth
  spotify_connected BOOLEAN DEFAULT false,
  spotify_user_id VARCHAR(255),
  spotify_access_token TEXT,
  spotify_refresh_token TEXT,
  spotify_token_expires TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);

-- Phrase codes (rooms)
CREATE TABLE phrase_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  phrase_code VARCHAR(64) UNIQUE NOT NULL,
  is_persistent BOOLEAN DEFAULT true,
  password_hash VARCHAR(255),
  max_participants INTEGER DEFAULT 10,
  created_at TIMESTAMP DEFAULT NOW(),
  last_regenerated_at TIMESTAMP DEFAULT NOW(),
  last_activity TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- Connection history (includes guests)
CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phrase_code_id UUID REFERENCES phrase_codes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  display_name VARCHAR(255) NOT NULL,
  is_guest BOOLEAN DEFAULT false,
  connected_at TIMESTAMP DEFAULT NOW(),
  disconnected_at TIMESTAMP
);

-- Ban list
CREATE TABLE bans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phrase_code_id UUID REFERENCES phrase_codes(id) ON DELETE CASCADE,
  banned_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  banned_ip VARCHAR(45),
  reason TEXT,
  banned_at TIMESTAMP DEFAULT NOW(),
  banned_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Room permissions
CREATE TABLE room_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phrase_code_id UUID REFERENCES phrase_codes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  can_kick BOOLEAN DEFAULT false,
  can_ban BOOLEAN DEFAULT false,
  can_mute BOOLEAN DEFAULT false,
  is_moderator BOOLEAN DEFAULT false,
  granted_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(phrase_code_id, user_id)
);

-- Chat messages (ephemeral, cleared on room empty)
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phrase_code_id UUID REFERENCES phrase_codes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  display_name VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  sent_at TIMESTAMP DEFAULT NOW()
);

-- Music queue with voting
CREATE TABLE music_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phrase_code_id UUID REFERENCES phrase_codes(id) ON DELETE CASCADE,
  track_url VARCHAR(500) NOT NULL,
  track_title VARCHAR(255),
  track_service VARCHAR(20) CHECK (track_service IN ('soundcloud', 'spotify')),
  added_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  added_by_display_name VARCHAR(255),
  vote_count INTEGER DEFAULT 1,
  position INTEGER,
  added_at TIMESTAMP DEFAULT NOW()
);

-- Music votes
CREATE TABLE music_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  queue_item_id UUID REFERENCES music_queue(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id VARCHAR(255),
  vote_type VARCHAR(10) CHECK (vote_type IN ('up', 'down')),
  voted_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(queue_item_id, user_id, session_id)
);

-- User preferences
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  theme VARCHAR(10) DEFAULT 'dark' CHECK (theme IN ('dark', 'light')),
  notification_sound BOOLEAN DEFAULT true,
  auto_mute_music BOOLEAN DEFAULT true,
  allow_soundcloud_in_rooms BOOLEAN DEFAULT true,
  allow_spotify_in_rooms BOOLEAN DEFAULT true,
  preferred_music_service VARCHAR(20) DEFAULT 'soundcloud' CHECK (preferred_music_service IN ('soundcloud', 'spotify')),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_phrase_codes_owner ON phrase_codes(owner_id);
CREATE INDEX idx_phrase_codes_code ON phrase_codes(phrase_code);
CREATE INDEX idx_connections_phrase_code ON connections(phrase_code_id);
CREATE INDEX idx_connections_user ON connections(user_id);
CREATE INDEX idx_bans_phrase_code ON bans(phrase_code_id);
CREATE INDEX idx_bans_user ON bans(banned_user_id);
CREATE INDEX idx_chat_messages_phrase_code ON chat_messages(phrase_code_id);
CREATE INDEX idx_music_queue_phrase_code ON music_queue(phrase_code_id);
CREATE INDEX idx_music_votes_queue_item ON music_votes(queue_item_id);

-- Trigger to create user preferences on user creation
CREATE OR REPLACE FUNCTION create_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_preferences (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_user_preferences
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION create_user_preferences();

-- Function to clean up expired rooms
CREATE OR REPLACE FUNCTION cleanup_expired_rooms()
RETURNS void AS $$
BEGIN
  DELETE FROM phrase_codes
  WHERE expires_at IS NOT NULL
  AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to update room activity
CREATE OR REPLACE FUNCTION update_room_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE phrase_codes
  SET last_activity = NOW()
  WHERE id = NEW.phrase_code_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_room_activity_connection
AFTER INSERT ON connections
FOR EACH ROW
EXECUTE FUNCTION update_room_activity();

CREATE TRIGGER trigger_update_room_activity_chat
AFTER INSERT ON chat_messages
FOR EACH ROW
EXECUTE FUNCTION update_room_activity();
