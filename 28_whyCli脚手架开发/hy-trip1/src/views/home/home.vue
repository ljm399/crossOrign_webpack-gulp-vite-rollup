<template>
  <div class="home" ref="homeRef">
    <Header></Header>
    <div class="banner">
      <img src="@/assets/img/home/banner.webp" alt="">
    </div>
    <HeaderSearchBox :hotSuggests="hotSuggests"></HeaderSearchBox>
    <SearchBar v-if="isShowSearchBar"></SearchBar>
    <HomeContent></HomeContent>

    <!-- <button @click="loadMore">加载更多</button> -->
  </div>
</template>

<script setup>
import Header from './cpns/header-bar.vue'
import HeaderSearchBox from './cpns/header-search-box.vue'
import {useHomeStore} from '@/stores/modules/home'
import {storeToRefs} from 'pinia'
import HomeContent from './cpns/home-content.vue'
import SearchBar from '@/components/search-bar/search-bar.vue'
// import {onMounted, onUnmounted} from 'vue'
import useScroll from '@/hooks/useScroll'
import {watch, computed, onActivated, ref} from 'vue'

// 获取位置信息
const getLocation = () => {
  navigator.geolocation.getCurrentPosition(res=>{
    console.log(res);
  },err=>{
    console.log(err);
  })
}

const homeStore = useHomeStore()
homeStore.fetchHotSuggests()
homeStore.fetchHomeCategories()
homeStore.fetchHomeHouselist()
const {hotSuggests} = storeToRefs(homeStore)

const loadMore = () => {
  homeStore.fetchHomeHouselist()
}

// // 监听滚动
// const scrollHandler = () => {
//   const clientHeight = document.documentElement.clientHeight
//   const scrollHeight = document.documentElement.scrollHeight
//   const scrollTop = document.documentElement.scrollTop
//   // console.log(clientHeight, scrollHeight, scrollTop) // 667 2962 2295
//   if(clientHeight + scrollTop >= scrollHeight) {
//     homeStore.fetchHomeHouselist()
//   }
// }

// // 取消监听, 防止其他页面也触发
// const cancelScrollHandler = () => {
//   window.removeEventListener('scroll', scrollHandler)
// }
// onMounted(() => {
//   window.addEventListener('scroll', scrollHandler)
// })
// onUnmounted(() => {
//   cancelScrollHandler()
// })

// 方式一:
// useScroll(() => {
//   homeStore.fetchHomeHouselist()
//   console.log('滚动了');
// },() => {
//   console.log('取消了');
// })

// 方式二:
const homeRef = ref(null)
const { isReachBottom, scrollTop } = useScroll(homeRef)
watch(isReachBottom, () => {
  homeStore.fetchHomeHouselist().then(() => {
    console.log('执行了')
    isReachBottom.value = false
  })
})

// 这里使用computed的好处是: 
// 1. 只要依赖的数据发生变化, computed就会重新计算
// 2. computed是响应式的, 会自动追踪依赖
// 3. 当处理的逻辑比较复制使用watch, 简单就直接使用computed
const isShowSearchBar = computed(() => {
  return scrollTop.value > 350
})
// watch(scrollTop, ()=> {
//   if(scrollTop.value > 350) {
//     isShowSearchBar.value = true
//   }else {
//     isShowSearchBar.value = false
//   }
// })

onActivated(() => {
  homeRef?.value.scrollTo({
    top: scrollTop.value
  })
})
</script>


<style lang="less" scoped>
.home {
  position: relative;
  padding-bottom: 50px;
  height: 100vh;
  overflow-y: scroll;
  .banner {
    img {
      width: 100%;
    }
  }
}
</style>