import { io } from 'socket.io-client'

export default defineNuxtPlugin(() => {
  // Only initialize on client side
  if (process.server) {
    return
  }

  // Construct backend URL from current location
  const protocol = window.location.protocol === 'https:' ? 'https' : 'http'
  const host = window.location.hostname
  const backendUrl = `${protocol}://${host}:3001`
  
  const socket = io(backendUrl, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 10,
    // Use polling transport instead of WebSocket for better reliability
    transports: ['polling', 'websocket'],
    upgrade: false  // Don't automatically upgrade to WebSocket
  })

  socket.on('connect', () => {
    console.log('✅ Connected to server')
  })

  socket.on('disconnect', () => {
    console.log('⚠️ Disconnected from server')
  })

  socket.on('connect_error', (error) => {
    console.error('❌ Connection error:', error)
  })

  return {
    provide: {
      socket
    }
  }
})
