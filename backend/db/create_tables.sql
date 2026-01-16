-- WorldState table (must be created first as other tables may reference it)
CREATE TABLE IF NOT EXISTS world_state (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phase TEXT NOT NULL DEFAULT 'tuto',
  global_resources TEXT NOT NULL DEFAULT '{}',
  last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK (phase IN ('tuto', 'repairLoop', 'collaborative', 'rebirth'))
);

-- Players table
CREATE TABLE IF NOT EXISTS players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  avatar_type TEXT DEFAULT 'boy',
  x INTEGER DEFAULT 0,
  y INTEGER DEFAULT 0,
  target_x INTEGER DEFAULT 0,
  target_y INTEGER DEFAULT 0,
  direction TEXT DEFAULT 'down',
  action TEXT DEFAULT 'idle',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK (avatar_type IN ('girl', 'boy')),
  CHECK (direction IN ('up', 'down', 'left', 'right')),
  CHECK (action IN ('idle', 'walk', 'repair', 'water', 'plant', 'build'))
);

-- WorldTiles table
CREATE TABLE IF NOT EXISTS world_tiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  world_state_id INTEGER NOT NULL DEFAULT 1,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  type TEXT NOT NULL DEFAULT 'empty',
  state TEXT NOT NULL DEFAULT 'normal',
  is_walkable BOOLEAN DEFAULT 1,
  last_action_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(x, y),
  CHECK (type IN ('factory', 'empty', 'village', 'field', 'water', 'forest')),
  CHECK (state IN ('polluted', 'repaired', 'embellished', 'watered', 'planted', 'normal')),
  FOREIGN KEY (world_state_id) REFERENCES world_state(id),
  FOREIGN KEY (last_action_by) REFERENCES players(id) ON DELETE SET NULL
);

-- ActionLog table
CREATE TABLE IF NOT EXISTS action_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL,
  tile_id INTEGER NOT NULL,
  action_type TEXT NOT NULL,
  direction TEXT,
  effect TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK (action_type IN ('repair', 'water', 'plant', 'build', 'walk')),
  CHECK (direction IS NULL OR direction IN ('up', 'down', 'left', 'right')),
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
  FOREIGN KEY (tile_id) REFERENCES world_tiles(id) ON DELETE CASCADE
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  trigger_condition TEXT,
  effect TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ChatMessages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL,
  message TEXT NOT NULL,
  channel TEXT DEFAULT 'global',
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK (channel IN ('global', 'local')),
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- Create indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_players_username ON players(username);
CREATE INDEX IF NOT EXISTS idx_world_tiles_coords ON world_tiles(x, y);
CREATE INDEX IF NOT EXISTS idx_action_logs_player_id ON action_logs(player_id);
CREATE INDEX IF NOT EXISTS idx_action_logs_tile_id ON action_logs(tile_id);
CREATE INDEX IF NOT EXISTS idx_action_logs_timestamp ON action_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_chat_messages_player_id ON chat_messages(player_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel ON chat_messages(channel);
