export const useWorld = () => {
  const tiles = ref([])
  const loading = ref(false)
  const error = ref(null)

  const loadTiles = async () => {
    loading.value = true
    try {
      const { data } = await useFetch('/api/tiles')
      tiles.value = data.value
    } catch (e) {
      error.value = e
    } finally {
      loading.value = false
    }
  }

  const updateTile = async (tileId, updates) => {
    try {
      const { data } = await useFetch(`/api/tiles/${tileId}`, {
        method: 'PUT',
        body: updates
      })
      const index = tiles.value.findIndex(t => t.id === tileId)
      if (index !== -1) {
        tiles.value[index] = data.value
      }
    } catch (e) {
      error.value = e
    }
  }

  onMounted(() => {
    loadTiles()
  })

  return {
    tiles: readonly(tiles),
    loading: readonly(loading),
    error: readonly(error),
    loadTiles,
    updateTile
  }
}
