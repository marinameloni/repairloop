<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <h1>Repair Loop</h1>
        <p class="subtitle">Répare le monde et réenchante le :)</p>
      </div>

      <div class="mode-toggle">
        <button :class="{ active: isLoginMode }" @click="isLoginMode = true" class="toggle-btn">
          🎮 LOGIN
        </button>
        <button :class="{ active: !isLoginMode }" @click="isLoginMode = false" class="toggle-btn">
          🚀 SIGN UP
        </button>
      </div>

      <div class="auth-content">
        <!-- SIGN UP MODE -->
        <template v-if="!isLoginMode">
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
        </template>

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

        <!-- Password Confirm Input (Sign Up Only) -->
        <div v-if="!isLoginMode" class="form-group">
          <label for="password-confirm">Confirm Password</label>
          <input
            id="password-confirm"
            v-model="form.passwordConfirm"
            type="password"
            placeholder="Confirm your password"
            minlength="6"
            @keyup.enter="isLoginMode ? login() : createAccount()"
          />
        </div>

        <!-- Error Message -->
        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <!-- Buttons -->
        <button
          @click="isLoginMode ? login() : createAccount()"
          :disabled="!form.username || loading"
          class="btn-create"
        >
          <span v-if="!loading">{{ isLoginMode ? '🎮 Login' : '🚀 Start Playing' }}</span>
          <span v-else>Loading...</span>
        </button>

        <!-- Info Section (Sign Up Only) -->
        <div v-if="!isLoginMode" class="info-section">
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
const isLoginMode = ref(false)
const form = ref({
  username: '',
  password: '',
  passwordConfirm: '',
  avatarType: 'girl'
})

const error = ref('')
const loading = ref(false)

const login = async () => {
  if (!form.value.username.trim()) {
    error.value = 'Please enter a username'
    return
  }

  if (!form.value.password) {
    error.value = 'Please enter a password'
    return
  }

  loading.value = true
  error.value = ''

  try {
    // Always use relative path in production, absolute in development
    const apiPath = '/api/players/login'
    console.log('🔐 Logging in to:', apiPath)
    const response = await fetch(apiPath, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: form.value.username,
        password: form.value.password
      })
    })

    console.log('📡 Response status:', response.status)
    console.log('📡 Response headers:', response.headers)
    
    const responseText = await response.text()
    console.log('📡 Response body (raw):', responseText)
    
    if (!response.ok) {
      try {
        const errorData = JSON.parse(responseText)
        throw new Error(errorData.error || 'Invalid username or password')
      } catch (e) {
        throw new Error('Invalid username or password')
      }
    }

    const player = JSON.parse(responseText)
    console.log('✅ Login successful:', player)

    sessionStorage.setItem('playerId', player.player.id)
    sessionStorage.setItem('playerName', player.player.username)
    sessionStorage.setItem('avatarType', player.player.avatar_type)
    sessionStorage.setItem('token', player.token)
    localStorage.setItem('playerUsername', player.player.username)

    router.push('/game')
  } catch (err) {
    console.error('❌ Login error:', err)
    error.value = err.message || 'Failed to login. Please try again.'
  } finally {
    loading.value = false
  }
}

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
    // Always use relative path in production, absolute in development
    const apiPath = '/api/players'
    const response = await fetch(apiPath, {
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
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to create account')
    }

    const player = await response.json()

    sessionStorage.setItem('playerId', player.player.id)
    sessionStorage.setItem('playerName', player.player.username)
    sessionStorage.setItem('avatarType', player.player.avatar_type)
    sessionStorage.setItem('token', player.token)
    localStorage.setItem('playerUsername', player.player.username)

    router.push('/game')
  } catch (err) {
    console.error('Account creation error:', err)
    error.value = err.message || 'Failed to create account. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.mode-toggle {
  display: flex;
  gap: 10px;
  margin-top: 15px;
  justify-content: center;
}

.mode-toggle button {
  padding: 8px 20px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s;
}

.mode-toggle button.active {
  background: #4CAF50;
  border-color: #45a049;
}

.mode-toggle button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.mode-toggle button.active:hover {
  background: #45a049;
}
</style>
