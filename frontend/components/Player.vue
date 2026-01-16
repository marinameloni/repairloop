<template>
  <div class="player">
    <h2>Player Info</h2>
    <p v-if="player">Position: {{ player.x }}, {{ player.y }}</p>
  </div>
</template>

<script setup>
const player = ref(null)

onMounted(() => {
  // Load player data from backend
})
</script>

<style scoped>
</style>
