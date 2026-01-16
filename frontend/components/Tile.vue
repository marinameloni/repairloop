<template>
  <div class="tile" :class="tile.type">
    <p>{{ tile.id }}</p>
  </div>
</template>

<script setup>
defineProps({
  tile: {
    type: Object,
    required: true
  }
})
</script>

<style scoped>
.tile {
  width: 40px;
  height: 40px;
  border: 1px solid #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
