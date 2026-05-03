<template>
  <div class="app">
    <router-view v-slot="{ Component }">
      <keep-alive include="home">
        <component :is="Component"></component>
      </keep-alive>
    </router-view>
    <tab-bar v-show="!route.meta.isShowTabBar"></tab-bar>
    <loading></loading>
  </div>
</template>

<script setup>
import TabBar from './components/tab-bar/tab-bar.vue'
import { useRoute } from 'vue-router'
import Loading from './components/loading/loading.vue'
import { onMounted } from 'vue'
const route = useRoute()
onMounted(() => {
  console.log(route);
})

</script>


<style scoped lang="less">
.app {
  position: relative;
}
</style>