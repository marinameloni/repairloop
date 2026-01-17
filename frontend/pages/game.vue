<template>
  <div class="game-container">
    <h1>Repair Loop - Map Editor</h1>
    
    <div class="controls">
      <label>
        Current Map:
        <select v-model="currentMapId">
          <option value="1">Map 1 (Industrial)</option>
          <option value="2">Map 2</option>
          <option value="3">Map 3</option>
          <option value="4">Map 4 (Village)</option>
        </select>
      </label>
      <p>Grid size: {{ gridWidth }}x{{ gridHeight }}</p>
      <p>Click on tiles to toggle blocking status</p>
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
              :class="{ blocked: tile.is_blocked }"
              @click="toggleBlock(x, y)"
              :title="`Tile (${x}, ${y})`"
            >
              <span class="coords">{{ x }},{{ y }}</span>
              <span v-if="tile.is_blocked" class="block-icon">🚫</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="blocked-tiles-list">
      <h3>Blocked Tiles ({{ blockedTiles.length }})</h3>
      <div class="tiles-list">
        <span v-for="tile in blockedTiles" :key="`${tile.x}-${tile.y}`" class="tile-badge">
          ({{ tile.x }},{{ tile.y }})
        </span>
      </div>
      <button @click="saveTiles" class="save-btn">Save to Database</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import mapLevel1 from '~/assets/maps/maplevel1.png'
import mapLevel2 from '~/assets/maps/maplevel2.png'
import mapLevel3 from '~/assets/maps/maplevel3.png'
import mapLevel4 from '~/assets/maps/maplevel4.png'

const currentMapId = ref(1)
const gridWidth = ref(20)
const gridHeight = ref(15)
const tiles = ref([])

const mapAssets = {
  1: mapLevel1,
  2: mapLevel2,
  3: mapLevel3,
  4: mapLevel4
}

const mapAsset = computed(() => mapAssets[currentMapId.value])

const blockedTiles = computed(() => {
  const blocked = []
  tiles.value.forEach((row, y) => {
    row.forEach((tile, x) => {
      if (tile.is_blocked) {
        blocked.push({ x, y })
      }
    })
  })
  return blocked
})

onMounted(() => {
  initializeTiles()
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

const toggleBlock = (x, y) => {
  tiles.value[y][x].is_blocked = !tiles.value[y][x].is_blocked
}

const saveTiles = async () => {
  try {
    const apiBase = 'http://localhost:3001'
    const response = await fetch(`${apiBase}/api/tiles/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mapId: currentMapId.value,
        tiles: blockedTiles.value
      })
    })
    if (response.ok) {
      alert('Tiles saved!')
    } else {
      const error = await response.json()
      alert('Error: ' + (error.error || 'Failed to save'))
    }
  } catch (error) {
    console.error('Error saving tiles:', error)
    alert('Error: ' + error.message)
  }
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
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.3);
  transition: all 0.2s;
}

.grid-tile:hover {
  background: rgba(100, 150, 255, 0.2);
  color: rgba(255, 255, 255, 0.6);
}

.grid-tile.blocked {
  background: rgba(255, 0, 0, 0.3);
  border-color: rgba(255, 0, 0, 0.5);
}

.grid-tile.blocked:hover {
  background: rgba(255, 0, 0, 0.5);
}

.coords {
  font-size: 8px;
}

.block-icon {
  position: absolute;
  font-size: 14px;
}

.blocked-tiles-list {
  background: #222;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #444;
}

.blocked-tiles-list h3 {
  margin-top: 0;
}

.tiles-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 15px;
  min-height: 30px;
}

.tile-badge {
  background: #ff4444;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.save-btn {
  padding: 10px 20px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
}

.save-btn:hover {
  background: #45a049;
}
</style>
