<template>
  <div class="categories">
    <template v-for="(item,index) in categories" :key="item.id">
      <div class="item">
        <img :src="item.pictureUrl" alt="">
        <div class="title">{{ item.title }}</div>
      </div>
    </template>
  </div>
</template>

<script setup>
  import { useHomeStore } from '@/stores/modules/home';
  import { storeToRefs } from 'pinia';

  const homeStore = useHomeStore()
  const {categories} = storeToRefs(homeStore)
</script>


<style scoped lang="less">
  .categories {
    display: flex;
    overflow-x: auto;
    padding: 10px 15px;
    &::-webkit-scrollbar {
      display: none;
    }
    .item {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      flex-shrink: 0;
      margin-right: 15px;
      img {
        width: 40px;
        height: 40px;
      }
      .title {
       margin-top: 7px; 
       font-size: 12px;
      }
    }
  }

</style>