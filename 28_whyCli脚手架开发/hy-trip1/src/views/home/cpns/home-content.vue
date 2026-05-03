<template>
  <div class="content">
    <h2>热门精选</h2>
    <div class="list" v-if="homeHouselist.length">
      <template v-for="(item,index) in homeHouselist" :key="item.data.houseId">
          <HomeItemV3 v-if="item.discoveryContentType === 3" :item-data="item.data" @click="pushToDetail(item.data)"></HomeItemV3>
          <HomeItemV9 v-if="item.discoveryContentType === 9" :item-data="item.data" @click="pushToDetail(item.data)"></HomeItemV9>        
      </template>
    </div>
  </div>
</template>

<script setup>
import {useHomeStore} from '@/stores/modules/home'
import {storeToRefs} from 'pinia'
import HomeItemV3 from '@/components/home-item-v3/home-item-v3.vue'
import HomeItemV9 from '@/components/home-item-v9/home-item-v9.vue'
import { useRouter } from 'vue-router'

const homeStore = useHomeStore()
const {homeHouselist} = storeToRefs(homeStore)


const router = useRouter()
const pushToDetail = (item) => {
  router.push(`/detail/${item.houseId}`)
}
</script>


<style scoped lang="less">
  .content {
    padding: 15px;
    .list {
      display: flex;
      flex-wrap: wrap;
    }
  }
</style>