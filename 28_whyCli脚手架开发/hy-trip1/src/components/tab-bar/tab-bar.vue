<template>
  <div class="tab-bar">
    <van-tabbar v-model="currentIndex" active-color="#ff9854" inactive-color="#000" route>
      <template v-for="(item, index) in tabBarData" :key="index"> 
        <van-tabbar-item :to="item.path">
          <template #icon>
            <img v-if="currentIndex === index" :src="item.active" alt="">
            <img v-else :src="item.image" alt="">
          </template>
          <template #default>
            <div class="text">{{ item.text }}</div>
          </template>
        </van-tabbar-item>
      </template>
    </van-tabbar>

  </div>
</template>

<script setup>
  import tabBarData from '@/assets/localData'
  import { ref, watch } from 'vue'
  import { useRoute } from 'vue-router'
  let currentIndex = ref(0)
  const route = useRoute()
  watch(route, () => {
    const index = tabBarData.findIndex(item => item.path === route.path)
    if(index === -1) return  // 作用: 防止出现-1的情况, 说明没有找到
    currentIndex.value = index
  })

</script>

<style lang="less" scoped>
.tab-bar {
  img {
    width: 30px;
  }
  .text {
    font-size: 15px;
  }
}
</style>