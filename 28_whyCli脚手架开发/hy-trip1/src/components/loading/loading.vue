<template>
  <div class="loading" v-if="isShowLoading" @click="hideLoading">
    <div class="bg">
      <div class="icon"></div>
    </div>
  </div>
</template>

<script setup>
import { useMainStore } from '@/stores/modules/main'
import { storeToRefs } from 'pinia'
const mainStore = useMainStore()
const { isShowLoading } = storeToRefs(mainStore)
const hideLoading = () => {
  mainStore.isShowLoading = false
}
</script>

<style scoped lang="less">
.loading {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 99;
  background-color: rgba(0, 0, 0, .5);
  display: flex;  
  justify-content: center;
  align-items: center;
  .bg {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100px;
    height: 100px;
    background-color: #fff;
    .icon {
      width: 100%;
      height: 100%;
      background-image: url('@/assets/img/home/full-screen-loading.gif');
      background-size: cover;
    }
  }
}
</style>