import { io } from 'socket.io-client'

export default defineNuxtPlugin(() => {
  // Only initialize on client side
  if (process.server) {
    return
  }

  // Use the current origin (will go through Nginx)
  const socketUrl = typeof window !== 'undefined' ? window.location.origin : ''
  
  const socket = io(socketUrl, {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  })

  socket.on('connect', () => {
    console.log('Connected to server')
  })

  socket.on('disconnect', () => {
    console.log('Disconnected from server')
  })

  socket.on('error', (error) => {
    console.error('Socket error:', error)
  })

  return {
    provide: {
      socket,
    },
  }
})
