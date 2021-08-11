<template>
  <input v-model="state.input" @keydown.enter="add" />
  <button @click="add">
    OK
  </button>
  <ul>
    <li v-for="item in state.items" :key="item">
      {{ item }}
    </li>
  </ul>
</template>

<script setup lang="ts">
import state from 'server-reactive:state?diff'

function add() {
  state.items = state.items || []
  state.items.push(state.input)
  state.input = ''
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
