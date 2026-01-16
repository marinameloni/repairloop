<template>
  <div class="chat">
    <h2>Chat</h2>
    <div class="messages">
      <p v-for="msg in messages" :key="msg.id">{{ msg.content }}</p>
    </div>
    <input v-model="newMessage" type="text" placeholder="Type message..." />
    <button @click="sendMessage">Send</button>
  </div>
</template>

<script setup>
const messages = ref([])
const newMessage = ref('')

const sendMessage = () => {
  if (newMessage.value.trim()) {
    // Send message to backend
    newMessage.value = ''
  }
}
</script>

<style scoped>
</style>
