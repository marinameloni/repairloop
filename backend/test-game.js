/**
 * Repair Loop - Simple Test Version
 * A 2D top-down MMO game with a tile-based world and player actions
 */

// ============================================================================
// WORLD MAP - 32 tiles in an 8x4 grid
// ============================================================================

function initializeMap() {
  const tiles = [];
  const tileTypes = ['factory', 'empty', 'field', 'village'];
  let id = 1;

  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 8; x++) {
      tiles.push({
        id: id++,
        x,
        y,
        type: tileTypes[Math.floor(Math.random() * tileTypes.length)],
        state: 'polluted',
        isWalkable: true
      });
    }
  }

  return tiles;
}

// ============================================================================
// PLAYER
// ============================================================================

const player = {
  id: 1,
  username: 'TestPlayer',
  avatarType: 'girl',
  x: 0,
  y: 0,
  targetX: 0,
  targetY: 0,
  direction: 'down',
  action: 'idle'
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get tile at coordinates (x, y)
 */
function getTileAt(tiles, x, y) {
  return tiles.find(tile => tile.x === x && tile.y === y);
}

/**
 * Print the entire map with player position marked
 */
function printMap(tiles, player) {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║           REPAIR LOOP - MAP STATE          ║');
  console.log('╚════════════════════════════════════════════╝\n');

  for (let y = 0; y < 4; y++) {
    let row = '';
    for (let x = 0; x < 8; x++) {
      const tile = getTileAt(tiles, x, y);
      let cellDisplay = '';

      if (player.x === x && player.y === y) {
        // Player position
        cellDisplay = player.avatarType === 'girl' ? '👧' : '👦';
      } else {
        // Tile type
        switch (tile.type) {
          case 'factory':
            cellDisplay = tile.state === 'polluted' ? '🏭' : '🔧';
            break;
          case 'empty':
            cellDisplay = tile.state === 'repaired' ? '⬜' : '🔲';
            break;
          case 'field':
            cellDisplay = tile.state === 'planted' ? '🌾' : '🌱';
            break;
          case 'village':
            cellDisplay = tile.state === 'embellished' ? '🏘️ ' : '🏠';
            break;
          default:
            cellDisplay = '?';
        }
      }

      row += cellDisplay + ' ';
    }
    console.log(row);
  }

  console.log();
}

/**
 * Print player status
 */
function printPlayerStatus(player) {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║           PLAYER STATUS                    ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log(`Username:   ${player.username}`);
  console.log(`Avatar:     ${player.avatarType}`);
  console.log(`Position:   (${player.x}, ${player.y})`);
  console.log(`Target:     (${player.targetX}, ${player.targetY})`);
  console.log(`Direction:  ${player.direction}`);
  console.log(`Action:     ${player.action}`);
  console.log();
}

/**
 * Print tile information
 */
function printTileInfo(tile) {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║           TILE INFORMATION                 ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log(`Tile ID:    ${tile.id}`);
  console.log(`Position:   (${tile.x}, ${tile.y})`);
  console.log(`Type:       ${tile.type}`);
  console.log(`State:      ${tile.state}`);
  console.log(`Walkable:   ${tile.isWalkable ? 'Yes' : 'No'}`);
  console.log();
}

// ============================================================================
// GAME FUNCTIONS
// ============================================================================

/**
 * Move player to a target position
 */
function movePlayer(tiles, targetX, targetY) {
  console.log(`\n🚀 Moving player to (${targetX}, ${targetY})...`);

  const targetTile = getTileAt(tiles, targetX, targetY);

  if (!targetTile) {
    console.log('❌ Target position is outside the map!');
    return false;
  }

  if (!targetTile.isWalkable) {
    console.log('❌ Target tile is not walkable!');
    return false;
  }

  // Update player position and target
  player.x = targetX;
  player.y = targetY;
  player.targetX = targetX;
  player.targetY = targetY;
  player.action = 'idle';

  console.log(`✅ Player moved successfully!`);
  printPlayerStatus(player);
  printMap(tiles, player);

  return true;
}

/**
 * Perform an action on a tile
 */
function performAction(tiles, tileId, actionType) {
  console.log(`\n⚙️  Performing action '${actionType}' on tile ${tileId}...`);

  const tile = tiles.find(t => t.id === tileId);

  if (!tile) {
    console.log('❌ Tile not found!');
    return false;
  }

  // Check if player is adjacent or on the tile
  const distance = Math.max(Math.abs(player.x - tile.x), Math.abs(player.y - tile.y));
  if (distance > 1) {
    console.log('❌ Player is too far from the tile! (must be adjacent or on it)');
    return false;
  }

  // Update tile state based on action
  let newState = tile.state;
  switch (actionType) {
    case 'repair':
      newState = 'repaired';
      break;
    case 'water':
      newState = 'watered';
      break;
    case 'plant':
      newState = 'planted';
      break;
    default:
      console.log(`❌ Unknown action type: ${actionType}`);
      return false;
  }

  // Update tile and player
  tile.state = newState;
  player.action = actionType;
  player.direction = getDirection(player.x, player.y, tile.x, tile.y);

  console.log(`✅ Action completed! Tile ${tileId} state changed to '${newState}'`);
  printTileInfo(tile);
  printPlayerStatus(player);
  printMap(tiles, player);

  return true;
}

/**
 * Determine direction based on relative position
 */
function getDirection(fromX, fromY, toX, toY) {
  const dx = toX - fromX;
  const dy = toY - fromY;

  if (dy < 0) return 'up';
  if (dy > 0) return 'down';
  if (dx < 0) return 'left';
  if (dx > 0) return 'right';
  return 'down';
}

// ============================================================================
// TEST SCENARIOS
// ============================================================================

function runTests() {
  console.log('\n\n');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║         REPAIR LOOP - GAME TEST                          ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  // Initialize the map
  const tiles = initializeMap();

  // Initial state
  console.log('\n\n📍 INITIAL STATE:');
  printPlayerStatus(player);
  printMap(tiles, player);

  // Test 1: Move player right
  console.log('\n\n=== TEST 1: Move Player Right ===');
  movePlayer(tiles, 3, 0);

  // Test 2: Perform repair action on current tile
  console.log('\n\n=== TEST 2: Repair Current Tile ===');
  const currentTile = getTileAt(tiles, 3, 0);
  performAction(tiles, currentTile.id, 'repair');

  // Test 3: Move player down
  console.log('\n\n=== TEST 3: Move Player Down ===');
  movePlayer(tiles, 3, 2);

  // Test 4: Water adjacent tile
  console.log('\n\n=== TEST 4: Water Adjacent Tile ===');
  const adjacentTile = getTileAt(tiles, 3, 1);
  performAction(tiles, adjacentTile.id, 'water');

  // Test 5: Plant on another adjacent tile
  console.log('\n\n=== TEST 5: Plant on Adjacent Tile ===');
  const anotherAdjacentTile = getTileAt(tiles, 2, 2);
  performAction(tiles, anotherAdjacentTile.id, 'plant');

  // Test 6: Move to top-left corner
  console.log('\n\n=== TEST 6: Move to Top-Left Corner ===');
  movePlayer(tiles, 0, 0);

  // Test 7: Invalid move - outside map
  console.log('\n\n=== TEST 7: Invalid Move - Outside Map ===');
  movePlayer(tiles, 10, 10);

  // Test 8: Invalid action - too far
  console.log('\n\n=== TEST 8: Invalid Action - Too Far ===');
  const farTile = getTileAt(tiles, 7, 3);
  performAction(tiles, farTile.id, 'repair');

  // Final map state
  console.log('\n\n\n📊 FINAL MAP STATE:');
  printMap(tiles, player);

  // Summary statistics
  console.log('╔════════════════════════════════════════════╗');
  console.log('║           SUMMARY STATISTICS               ║');
  console.log('╚════════════════════════════════════════════╝');
  const repaired = tiles.filter(t => t.state === 'repaired').length;
  const watered = tiles.filter(t => t.state === 'watered').length;
  const planted = tiles.filter(t => t.state === 'planted').length;
  const polluted = tiles.filter(t => t.state === 'polluted').length;

  console.log(`Total Tiles:      ${tiles.length}`);
  console.log(`Polluted:         ${polluted}`);
  console.log(`Repaired:         ${repaired}`);
  console.log(`Watered:          ${watered}`);
  console.log(`Planted:          ${planted}`);
  console.log(`Progress:         ${Math.round((100 * (repaired + watered + planted)) / tiles.length)}%`);
  console.log();
}

// ============================================================================
// RUN TESTS
// ============================================================================

runTests();
