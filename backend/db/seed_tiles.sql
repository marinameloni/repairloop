-- Seed tiles for all maps (20x15 grid)
-- Map 1 (Industrial)
INSERT OR IGNORE INTO world_tiles (world_state_id, x, y, type, state, is_walkable, is_blocked)
SELECT 1, x.val as x, y.val as y, 'factory', 'normal', 1, 0
FROM (SELECT 0 as val UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15 UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19) x
CROSS JOIN (SELECT 0 as val UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14) y;

-- Add some blocked tiles to Map 1 (factories)
UPDATE world_tiles SET is_blocked = 1, block_type = 'factory' WHERE (x, y) IN (
  (2, 2), (3, 2), (4, 2),
  (2, 3), (3, 3), (4, 3),
  (2, 4), (3, 4), (4, 4),
  (10, 5), (11, 5), (12, 5),
  (10, 6), (11, 6), (12, 6),
  (15, 10), (16, 10), (17, 10)
);

-- Add debris tiles
UPDATE world_tiles SET is_blocked = 1, block_type = 'debris' WHERE (x, y) IN (
  (7, 7), (8, 7),
  (7, 8), (8, 8),
  (14, 2), (15, 2),
  (14, 3)
);
