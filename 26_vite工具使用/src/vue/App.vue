<template>
  <div class="less-title">
    <h3>Vue Component</h3>
    <p>count: {{ count }}</p>
    <button @click="count++">+</button>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const count = ref(0);
</script>
