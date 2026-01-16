-- Initialize world state
INSERT INTO world_state (phase, global_resources) VALUES
(
  'tuto',
  '{"trees_planted": 0, "world_fixed_percent": 0, "total_actions": 0}'
);

-- Insert sample players
INSERT INTO players (username, avatar_type, x, y, target_x, target_y, direction, action) VALUES
('Alice', 'girl', 0, 0, 0, 0, 'down', 'idle'),
('Bob', 'boy', 5, 5, 5, 5, 'down', 'idle'),
('Charlie', 'boy', 10, 10, 10, 10, 'down', 'idle');

-- Insert sample world tiles
INSERT INTO world_tiles (x, y, type, state, is_walkable) VALUES
-- Factory area (polluted)
(0, 0, 'factory', 'polluted', 1),
(1, 0, 'factory', 'polluted', 1),
(2, 0, 'factory', 'polluted', 1),

-- Empty fields (repaired)
(0, 1, 'empty', 'repaired', 1),
(1, 1, 'empty', 'repaired', 1),
(2, 1, 'empty', 'repaired', 1),

-- Village (embellished)
(5, 5, 'village', 'embellished', 1),
(6, 5, 'village', 'embellished', 1),

-- Fields (normal)
(10, 10, 'field', 'normal', 1),
(11, 10, 'field', 'normal', 1),
(12, 10, 'field', 'normal', 1),

-- Water areas (watered)
(3, 3, 'water', 'watered', 0),
(4, 3, 'water', 'watered', 0),

-- Forest areas (planted)
(7, 7, 'forest', 'planted', 1),
(8, 7, 'forest', 'planted', 1),
(9, 7, 'forest', 'planted', 1);

-- Insert sample action logs
INSERT INTO action_logs (player_id, tile_id, action_type, direction, effect) VALUES
(1, 1, 'repair', 'down', '{"damage_reduction": 50}'),
(2, 5, 'water', 'right', '{"hydration_level": 80}'),
(3, 11, 'plant', 'up', '{"trees_added": 5}');

-- Insert sample events
INSERT INTO events (title, description, trigger_condition, effect) VALUES
(
  'Tuto Phase Complete',
  'Tutorial phase has been completed by enough players',
  '{"type": "player_count", "threshold": 1}',
  '{"phase_change": "repairLoop", "message": "Welcome to the Repair Loop phase!"}'
),
(
  'World Repair Milestone',
  'World has reached 50% repair status',
  '{"type": "world_fixed_percent", "threshold": 50}',
  '{"reward_type": "global_bonus", "bonus_value": 100}'
),
(
  'Forest Growth',
  'Trees have been planted in the forest',
  '{"type": "trees_planted", "threshold": 10}',
  '{"world_effect": "increase_biodiversity", "value": 5}'
);

-- Insert sample chat messages
INSERT INTO chat_messages (player_id, message, channel) VALUES
(1, 'Hello everyone! Just started playing!', 'global'),
(2, 'Welcome! Nice to meet you!', 'global'),
(3, 'Let us know if you need help with repairs.', 'global'),
(1, 'Thanks! I am near the factory at (0,0)', 'local');
