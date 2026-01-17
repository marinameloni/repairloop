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
    reconnectionAttempts: 5
  })

  socket.on('connect', () => {
    console.log('Connected to server')
  })

  socket.on('disconnect', () => {
    console.log('Disconnected from server')
  })

  return {
    provide: {
      socket
    }
  }
})
