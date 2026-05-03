<template>
  <div class="tab-bar">
    <template v-for="(item, index) in tabBarData" :key="index">
      <div class="item" @click="pushClick(item.path, index)">
        <img v-if="currentIndex === index" :src="item.active" alt="">
        <img v-else :src="item.image" alt="">
        <span>{{ item.text }}</span>
      </div>
    </template>
  </div>
</template>

<script setup>
  import tabBarData from '@/assets/localData'
  import { useRouter } from 'vue-router'
  import { ref } from 'vue'
  // console.log(tabBarData)//
  const router = useRouter()
  let currentIndex = ref(0)
  const pushClick = (path, index) => {
    router.push(path)
    currentIndex.value = index  
  }

</script>

<style lang="less" scoped>
.tab-bar {
  display: flex;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding-bottom: 10px;
  .item {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    img {
      width: 35px;
    }
  }
}
</style>