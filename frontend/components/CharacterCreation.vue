<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <h1>Repair Loop</h1>
        <p class="subtitle">Répare le monde et réenchante le :)</p>
      </div>

      <div class="auth-content">
        <!-- Avatar Selection -->
        <div class="form-group">
          <label>Choose Your Avatar</label>
          <div class="avatar-selector">
            <div
              class="avatar-option"
              :class="{ selected: form.avatarType === 'girl' }"
              @click="form.avatarType = 'girl'"
            >
              <span class="avatar-icon">👧</span>
              <span class="avatar-label">Girl</span>
            </div>
            <div
              class="avatar-option"
              :class="{ selected: form.avatarType === 'boy' }"
              @click="form.avatarType = 'boy'"
            >
              <span class="avatar-icon">👦</span>
              <span class="avatar-label">Boy</span>
            </div>
          </div>
        </div>

        <!-- Username Input -->
        <div class="form-group">
          <label for="username">Username</label>
          <input
            id="username"
            v-model="form.username"
            type="text"
            placeholder="Enter your username"
            maxlength="20"
          />
          <span class="char-count">{{ form.username.length }}/20</span>
        </div>

        <!-- Password Input -->
        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            placeholder="Enter your password"
            minlength="6"
          />
        </div>

        <!-- Password Confirm Input -->
        <div class="form-group">
          <label for="password-confirm">Confirm Password</label>
          <input
            id="password-confirm"
            v-model="form.passwordConfirm"
            type="password"
            placeholder="Confirm your password"
            minlength="6"
            @keyup.enter="createAccount"
          />
        </div>

        <!-- Error Message -->
        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <!-- Create Account Button -->
        <button
          @click="createAccount"
          :disabled="!form.username || loading"
          class="btn-create"
        >
          <span v-if="!loading">🚀 Start Playing</span>
          <span v-else>Loading...</span>
        </button>

        <!-- Info Section -->
        <div class="info-section">
          <h3>What awaits you?</h3>
          <ul>
            <li>🌍 Explore a massive polluted world</li>
            <li>🔧 Repair factories and infrastructure</li>
            <li>💧 Water the fields</li>
            <li>🌱 Plant forests</li>
            <li>🤝 Collaborate with other players</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const form = ref({
  username: '',
  password: '',
  passwordConfirm: '',
  avatarType: 'girl'
})

const error = ref('')
const loading = ref(false)

const createAccount = async () => {
  if (!form.value.username.trim()) {
    error.value = 'Please enter a username'
    return
  }

  if (form.value.username.length < 3) {
    error.value = 'Username must be at least 3 characters'
    return
  }

  if (!form.value.password) {
    error.value = 'Please enter a password'
    return
  }

  if (form.value.password.length < 6) {
    error.value = 'Password must be at least 6 characters'
    return
  }

  if (form.value.password !== form.value.passwordConfirm) {
    error.value = 'Passwords do not match'
    return
  }

  loading.value = true
  error.value = ''

  try {
    // Create player
    const response = await fetch('http://localhost:3001/api/players', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: form.value.username,
        password: form.value.password,
        password_confirm: form.value.passwordConfirm,
        avatar_type: form.value.avatarType,
        x: 0,
        y: 0,
        target_x: 0,
        target_y: 0,
        direction: 'down',
        action: 'idle'
      })
    })

    if (!response.ok) {
      throw new Error('Failed to create account')
    }

    const player = await response.json()

    // Store player in sessionStorage or state management
    sessionStorage.setItem('playerId', player.id)
    sessionStorage.setItem('playerName', player.username)
    sessionStorage.setItem('avatarType', player.avatar_type)

    // Navigate to game
    router.push('/game')
  } catch (err) {
    error.value = err.message || 'Failed to create account. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
</style>
