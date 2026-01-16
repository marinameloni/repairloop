<template>
  <div class="map">
    <h2>Map</h2>
    <div class="tiles">
      <Tile v-for="tile in tiles" :key="tile.id" :tile="tile" />
    </div>
  </div>
</template>

<script setup>
import Tile from './Tile.vue'

const tiles = ref([])

onMounted(() => {
  // Load tiles from backend
})
</script>

<style scoped>
.tiles {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 4px;
}
</style>
