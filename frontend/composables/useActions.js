import { ref, computed } from 'vue'

export function useActions() {
  const selectedAction = ref(null)

  const allActions = [
    {
      id_action: 1,
      name: 'Détruire usine',
      target_state: 'ruined',
      required_clicks: 300,
      progress_per_click: 0.33,
      is_cooperative: true,
    },
    {
      id_action: 2,
      name: 'Nettoyer débris',
      target_state: 'cleaned',
      required_clicks: 120,
      progress_per_click: 0.83,
      is_cooperative: true,
    },
    {
      id_action: 3,
      name: 'Arroser zone',
      target_state: 'green',
      required_clicks: 20,
      progress_per_click: 5,
      is_cooperative: false,
    },
    {
      id_action: 4,
      name: 'Construire maison',
      target_state: 'buildable',
      required_clicks: 200,
      progress_per_click: 0.5,
      is_cooperative: true,
    },
  ]

  const availableActions = computed(() => allActions)

  const selectAction = (action) => {
    selectedAction.value = selectedAction.value?.id_action === action.id_action ? null : action
  }

  const isActionSelected = (action) => {
    return selectedAction.value?.id_action === action.id_action
  }

  const performClick = async (tile, action, currentPlayer) => {
    if (!tile || !action) return

    // Calculer la progression ajoutée
    const progressAdded = action.progress_per_click

    // Mettre à jour la tile
    const newProgress = Math.min(100, tile.progress + progressAdded)
    tile.progress = newProgress

    // Vérifier si l'action est complète
    if (newProgress >= 100) {
      tile.state = action.target_state
      tile.progress = 0
      tile.is_blocked = false

      console.log(`✓ Action complétée: ${action.name} sur (${tile.x}, ${tile.y})`)
      // Déclencher callback de complétion
    }

    // Enregistrer le clic en base (à implémenter)
    // await registerClick(currentPlayer.id_player, tile.id_tile, action.id_action)

    console.log(`Clic: ${action.name} | Progression: ${newProgress.toFixed(1)}%`)
  }

  return {
    availableActions,
    selectedAction,
    selectAction,
    isActionSelected,
    performClick,
  }
}
