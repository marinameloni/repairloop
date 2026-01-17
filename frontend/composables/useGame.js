import { ref, computed } from 'vue'

export function useGame() {
  // État
  const player = ref({
    id_player: 1,
    username: 'Player1',
    pos_x: 5,
    pos_y: 5,
    current_map_id: 1,
  })

  const currentMap = ref({
    id_map: 1,
    name: 'Ruines Industrielles',
    level_index: 1,
    asset_name: 'maplevel1.png',
    unlocked: true,
  })

  const tiles = ref([])
  const allPlayers = ref([])
  const recentMessages = ref([])

  // Initialisation
  const initGame = async () => {
    // Générer une grille de tiles 20x20
    const mapTiles = []
    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 20; x++) {
        mapTiles.push({
          id_tile: `${x}-${y}`,
          map_id: currentMap.value.id_map,
          x,
          y,
          state: getInitialTileState(x, y),
          progress: 0,
          is_blocked: Math.random() > 0.85,
          block_type: ['factory', 'debris', 'wall', 'decor'][Math.floor(Math.random() * 4)],
          last_updated_at: new Date(),
        })
      }
    }
    tiles.value = mapTiles

    // Simuler d'autres joueurs
    allPlayers.value = [
      player.value,
      { id_player: 2, username: 'Player2', pos_x: 10, pos_y: 10, current_map_id: 1 },
      { id_player: 3, username: 'Player3', pos_x: 8, pos_y: 6, current_map_id: 1 },
    ]
  }

  const getInitialTileState = (x, y) => {
    const states = ['polluted', 'factory', 'ruined', 'cleaned']
    return states[Math.floor(Math.random() * states.length)]
  }

  // Actions
  const movePlayer = (x, y) => {
    player.value.pos_x = x
    player.value.pos_y = y
  }

  const getPlayersOnTile = (tile) => {
    return allPlayers.value.filter(p => p.pos_x === tile.x && p.pos_y === tile.y)
  }

  const getWorldProgress = () => {
    if (tiles.value.length === 0) return 0
    const totalProgress = tiles.value.reduce((sum, t) => sum + t.progress, 0)
    const maxProgress = tiles.value.length * 100
    return Math.round((totalProgress / maxProgress) * 100)
  }

  const getTileProgress = (tile) => {
    const found = tiles.value.find(t => t.id_tile === tile.id_tile)
    return found ? found.progress : 0
  }

  const updateTileProgress = (tileId, amount) => {
    const tile = tiles.value.find(t => t.id_tile === tileId)
    if (tile) {
      tile.progress = Math.min(100, tile.progress + amount)
      tile.last_updated_at = new Date()
    }
  }

  const updateTileState = (tileId, newState) => {
    const tile = tiles.value.find(t => t.id_tile === tileId)
    if (tile) {
      tile.state = newState
      tile.progress = 0
    }
  }

  return {
    player,
    currentMap,
    tiles,
    allPlayers,
    recentMessages,
    initGame,
    movePlayer,
    getPlayersOnTile,
    getWorldProgress,
    getTileProgress,
    updateTileProgress,
    updateTileState,
  }
}
