export const usePlayer = () => {
  const player = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const loadPlayer = async () => {
    loading.value = true
    try {
      const { data } = await useFetch('/api/players/me')
      player.value = data.value
    } catch (e) {
      error.value = e
    } finally {
      loading.value = false
    }
  }

  const updatePlayer = async (updates) => {
    try {
      const { data } = await useFetch('/api/players/me', {
        method: 'PUT',
        body: updates
      })
      player.value = data.value
    } catch (e) {
      error.value = e
    }
  }

  onMounted(() => {
    loadPlayer()
  })

  return {
    player: readonly(player),
    loading: readonly(loading),
    error: readonly(error),
    loadPlayer,
    updatePlayer
  }
}
