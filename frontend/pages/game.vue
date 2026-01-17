<template>
  <div class="game-container">
    <h1>Repair Loop - Game</h1>
    
    <div class="controls">
      <label>
        Map:
        <select v-model="currentMapId">
          <option value="1">Map 1 (Industrial)</option>
          <option value="2">Map 2</option>
          <option value="3">Map 3</option>
          <option value="4">Map 4 (Village)</option>
        </select>
      </label>
      <p>Player Position: ({{ playerX }}, {{ playerY }})</p>
      <p>Use arrow keys to move</p>
    </div>

    <div class="map-container">
      <div class="map-background" :style="{ backgroundImage: `url(${mapAsset})` }">
        <div class="grid">
          <div
            v-for="(row, y) in tiles"
            :key="`row-${y}`"
            class="grid-row"
          >
            <div
              v-for="(tile, x) in row"
              :key="`tile-${x}-${y}`"
              class="grid-tile"
              :class="{ blocked: tile.is_blocked, path: isOnPath(x, y) }"
              @click="moveToTile(x, y)"
              :title="`Tile (${x}, ${y})`"
            >
              <span v-if="playerX === x && playerY === y" class="player-icon">
                <div class="player-wrapper">
                  <div v-if="playerChatBubble" class="chat-bubble">{{ playerChatBubble }}</div>
                  <div class="username">{{ playerUsername }}</div>
                  <span>🧑</span>
                </div>
              </span>
              <span v-else-if="getPlayerAtPosition(x, y)" class="other-player">
                <div class="player-wrapper">
                  <div v-if="otherPlayerChatBubbles[getPlayerAtPosition(x, y).playerId]" class="chat-bubble">
                    {{ otherPlayerChatBubbles[getPlayerAtPosition(x, y).playerId] }}
                  </div>
                  <div class="username">{{ getPlayerAtPosition(x, y).username }}</div>
                  <span>👤</span>
                </div>
              </span>
              <span v-else-if="tile.is_blocked" class="block-icon">🚫</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="info-panel">
      <h3>Map {{ currentMapId }} - Test Mode</h3>
      <p>🧑 = Player | � = Other Players | 🚫 = Blocked Tile</p>
    </div>

    <div class="chat-panel">
      <input
        v-model="chatMessage"
        type="text"
        placeholder="Say something..."
        @keyup.enter="sendChatMessage"
        maxlength="100"
        class="chat-input"
      />
      <button @click="sendChatMessage" class="chat-btn">Send</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import mapLevel1 from '~/assets/maps/maplevel1.png'
import mapLevel2 from '~/assets/maps/maplevel2.png'
import mapLevel3 from '~/assets/maps/maplevel3.png'
import mapLevel4 from '~/assets/maps/maplevel4.png'

const currentMapId = ref(1)
const gridWidth = ref(20)
const gridHeight = ref(15)
const tiles = ref([])
const playerX = ref(10)
const playerY = ref(10)
const currentPath = ref([])
const isMoving = ref(false)
const tilesLoaded = ref(false)
const playerUsername = ref('Guest')
const playerId = ref(null)
const otherPlayers = ref({})
const socket = ref(null)
const chatMessage = ref('')
const playerChatBubble = ref(null)
const playerChatBubbleTimeout = ref(null)
const otherPlayerChatBubbles = ref({})

const mapAssets = {
  1: mapLevel1,
  2: mapLevel2,
  3: mapLevel3,
  4: mapLevel4
}

const mapAsset = computed(() => mapAssets[currentMapId.value])

const isOnPath = (x, y) => {
  return currentPath.value.some(p => p.x === x && p.y === y)
}

const getPlayerAtPosition = (x, y) => {
  for (const id in otherPlayers.value) {
    const player = otherPlayers.value[id]
    if (player.x === x && player.y === y && player.mapId === currentMapId.value) {
      return player
    }
  }
  return null
}

onMounted(async () => {
  // Get username and player ID from localStorage/sessionStorage
  const username = localStorage.getItem('playerUsername') || sessionStorage.getItem('playerName')
  const id = sessionStorage.getItem('playerId')
  if (username) {
    playerUsername.value = username
  }
  if (id) {
    playerId.value = id
  }
  
  // Initialize socket.io connection
  const socketPlugin = useNuxtApp().$socket
  if (socketPlugin) {
    socket.value = socketPlugin
    
    // Emit initial player join
    socket.value.emit('player:join', {
      playerId: playerId.value,
      username: playerUsername.value,
      x: playerX.value,
      y: playerY.value,
      mapId: currentMapId.value
    })
    
    // Listen for other players
    socket.value.on('player:update', (data) => {
      if (data.playerId !== playerId.value) {
        otherPlayers.value[data.playerId] = data
      }
    })
    
    socket.value.on('player:move', (data) => {
      if (data.playerId !== playerId.value) {
        otherPlayers.value[data.playerId] = {
          ...otherPlayers.value[data.playerId],
          ...data
        }
      }
    })
    
    socket.value.on('player:left', (playerId) => {
      delete otherPlayers.value[playerId]
    })
    
    socket.value.on('chat:message', (data) => {
      if (data.playerId !== playerId.value) {
        otherPlayerChatBubbles.value[data.playerId] = data.message
        setTimeout(() => {
          delete otherPlayerChatBubbles.value[data.playerId]
        }, 5000)
      }
    })
  }
  
  initializeTiles()
  await loadBlockedTiles()
})

onUnmounted(() => {
  if (socket.value) {
    socket.value.emit('player:left', playerId.value)
  }
})

watch(currentMapId, async () => {
  playerX.value = 10
  playerY.value = 10
  currentPath.value = []
  isMoving.value = false
  tilesLoaded.value = false
  initializeTiles()
  await loadBlockedTiles()
})

const initializeTiles = () => {
  tiles.value = []
  for (let y = 0; y < gridHeight.value; y++) {
    const row = []
    for (let x = 0; x < gridWidth.value; x++) {
      row.push({
        x,
        y,
        is_blocked: false,
        state: 'normal'
      })
    }
    tiles.value.push(row)
  }
}

const loadBlockedTiles = async () => {
  try {
    const apiBase = 'http://localhost:3001'
    const response = await fetch(`${apiBase}/api/tiles/map/${currentMapId.value}`)
    if (response.ok) {
      const blockedTiles = await response.json()
      console.log(`Loaded ${blockedTiles.length} blocked tiles for map ${currentMapId.value}`)
      blockedTiles.forEach(tile => {
        if (tiles.value[tile.y] && tiles.value[tile.y][tile.x]) {
          tiles.value[tile.y][tile.x].is_blocked = true
        }
      })
      tilesLoaded.value = true
    }
  } catch (error) {
    console.error('Error loading blocked tiles:', error)
    tilesLoaded.value = true
  }
}

const isBlocked = (x, y) => {
  if (x < 0 || x >= gridWidth.value || y < 0 || y >= gridHeight.value) return true
  return tiles.value[y]?.[x]?.is_blocked || false
}

// BFS pathfinding algorithm
const findPath = (startX, startY, endX, endY) => {
  if (startX === endX && startY === endY) return []
  
  const queue = [[{ x: startX, y: startY, path: [] }]]
  const visited = new Set()
  visited.add(`${startX},${startY}`)

  while (queue.length > 0) {
    const current = queue.shift()[0]
    
    // Check all 4 directions (up, down, left, right)
    const directions = [
      { x: 0, y: -1 }, // up
      { x: 0, y: 1 },  // down
      { x: -1, y: 0 }, // left
      { x: 1, y: 0 }   // right
    ]

    for (const dir of directions) {
      const newX = current.x + dir.x
      const newY = current.y + dir.y
      const key = `${newX},${newY}`

      if (!visited.has(key) && !isBlocked(newX, newY)) {
        const newPath = [...current.path, { x: newX, y: newY }]

        if (newX === endX && newY === endY) {
          return newPath
        }

        visited.add(key)
        queue.push([{ x: newX, y: newY, path: newPath }])
      }
    }
  }

  return [] // No path found
}

// Animate player movement along path
const moveAlongPath = async (path) => {
  isMoving.value = true
  for (const waypoint of path) {
    playerX.value = waypoint.x
    playerY.value = waypoint.y
    
    // Broadcast position to other players
    if (socket.value) {
      socket.value.emit('player:move', {
        playerId: playerId.value,
        username: playerUsername.value,
        x: waypoint.x,
        y: waypoint.y,
        mapId: currentMapId.value
      })
    }
    
    await new Promise(resolve => setTimeout(resolve, 150)) // 150ms per tile
  }
  currentPath.value = []
  isMoving.value = false
}

const moveToTile = (x, y) => {
  if (!tilesLoaded.value) {
    console.log('Tiles not loaded yet')
    return
  }
  if (isMoving.value) return // Don't allow new movement while moving
  if (isBlocked(x, y)) {
    console.log(`Tile (${x}, ${y}) is blocked`)
    return // Can't move to blocked tile
  }
  
  const path = findPath(playerX.value, playerY.value, x, y)
  if (path.length > 0) {
    currentPath.value = path
    moveAlongPath(path)
  } else {
    console.log(`No path found to (${x}, ${y})`)
  }
}

const sendChatMessage = () => {
  if (!chatMessage.value.trim()) return
  
  playerChatBubble.value = chatMessage.value
  
  // Clear previous timeout
  if (playerChatBubbleTimeout.value) {
    clearTimeout(playerChatBubbleTimeout.value)
  }
  
  // Hide bubble after 5 seconds
  playerChatBubbleTimeout.value = setTimeout(() => {
    playerChatBubble.value = null
  }, 5000)
  
  // Send to other players
  if (socket.value) {
    socket.value.emit('chat:message', {
      playerId: playerId.value,
      username: playerUsername.value,
      message: chatMessage.value,
      x: playerX.value,
      y: playerY.value,
      mapId: currentMapId.value
    })
  }
  
  chatMessage.value = ''
}
</script>

<style scoped>
.game-container {
  padding: 20px;
  background: #1a1a1a;
  color: #fff;
  min-height: 100vh;
  font-family: Arial, sans-serif;
}

h1 {
  text-align: center;
  margin-bottom: 20px;
}

.controls {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  align-items: center;
}

.controls select {
  padding: 8px;
  background: #333;
  color: #fff;
  border: 1px solid #666;
  border-radius: 4px;
}

.map-container {
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
  background: #000;
  padding: 10px;
  border-radius: 8px;
  overflow-x: auto;
}

.map-background {
  position: relative;
  width: 800px;
  height: 600px;
  background-size: cover;
  background-position: center;
  border: 2px solid #666;
}

.grid {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.grid-row {
  display: flex;
  flex: 1;
  width: 100%;
}

.grid-tile {
  flex: 1;
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  transition: background 0.1s;
}

.grid-tile:hover {
  background: rgba(100, 150, 255, 0.2);
}

.grid-tile.blocked {
  background: rgba(255, 0, 0, 0.3);
  border-color: rgba(255, 0, 0, 0.5);
  cursor: not-allowed;
}

.grid-tile.path {
  background: rgba(100, 200, 100, 0.3);
}

.player-icon {
  font-size: 24px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.player-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.username {
  font-size: 8px;
  color: #fff;
  background: rgba(0, 0, 0, 0.5);
  padding: 2px 4px;
  border-radius: 2px;
  white-space: nowrap;
  font-weight: bold;
}

.other-player {
  font-size: 20px;
  z-index: 9;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  opacity: 0.8;
}

.block-icon {
  font-size: 16px;
}

.info-panel {
  background: #222;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #444;
  text-align: center;
}

.info-panel h3 {
  margin-top: 0;
}

.chat-panel {
  display: flex;
  gap: 10px;
  padding: 15px;
  background: #222;
  border-radius: 8px;
  border: 1px solid #444;
  margin-top: 20px;
}

.chat-input {
  flex: 1;
  padding: 10px;
  background: #333;
  color: #fff;
  border: 1px solid #666;
  border-radius: 4px;
  font-size: 14px;
}

.chat-input::placeholder {
  color: #999;
}

.chat-btn {
  padding: 10px 20px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.chat-btn:hover {
  background: #45a049;
}

.chat-bubble {
  position: relative;
  background: #fff;
  color: #000;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 9px;
  margin-bottom: 2px;
  max-width: 80px;
  word-wrap: break-word;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.chat-bubble::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 4px solid #fff;
}
</style>
