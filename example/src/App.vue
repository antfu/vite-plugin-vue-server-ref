<template>
  <input v-model="state.input" @keydown.enter="add" />
  <button @click="add">
    OK
  </button>
  <ul>
    <li v-for="item in state.items">
      {{ item }}
    </li>
  </ul>
</template>

<script setup lang="ts">
import state from 'server-ref:state'

function add() {
  state.value.items = state.value.items || []
  state.value.items.push(state.value.input)
  state.value.input = ''
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
