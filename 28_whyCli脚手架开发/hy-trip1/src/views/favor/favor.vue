<template>
  <div class="favor">
    <div class="box" ref="box">
      <template v-for="item in 100" :key="item">
        <div>{{ item }}</div>
      </template>
    </div>
  </div>
</template>

<script setup>
import useScroll from '@/hooks/useScroll'
import {watch, ref} from 'vue'
const box = ref(null)
const {scrollTop} = useScroll(box)
watch(scrollTop, () => {
  console.log(scrollTop.value);
})
</script>


<style scoped>
.box {
  height: 400px;
  background-color: #ccc; 
  overflow-y: scroll;
}
</style>