<template>
  <div class="cities top-page">
    <div class="top">
      <!-- 搜索框 -->
      <van-search 
        v-model="value" 
        placeholder="城市/区域/位置"
        show-action
        action-text="返回"
        @cancel="onCancel"
        />
      <!-- 标签页 -->
       <!-- v-model:active的:active不能省略,原理: v-on:active=''-->
      <van-tabs v-model:active="active" color="var(--primary-color)">
        <template v-for="(value,key,index) in allCities" :key="key">
          <!-- name: v-model:active和标签页的name对应 -->
          <van-tab :title="value.title" :name="key"></van-tab> 
        </template>
      </van-tabs>
    </div>

    <div class="content">
      <template v-for="(value,key,index) in allCities" :key="key">
        <!-- <div>{{ value }}</div> key对应的值,然后你通过value.cities拿到具体的值,而不是key.cities -->
        <!-- <hr> -->
        <!-- <div>{{ key }}</div> cities, hotCities,title -->
        <!-- <hr></hr> -->
        <!-- <div>{{ index }}</div> -->
        <CitiesGroup v-show="active === key" :citiesGroup="value.cities" :hotCities="value.hotCities"/>


        <!-- <van-index-bar>
          <template v-for="(item,index) in value.cities">
            <van-index-anchor :index="item.group" />
            <template v-for="city in item.cities">
              <van-cell :title="city.cityName" />
            </template>
          </template>
        </van-index-bar> -->
      </template>
    </div>
  </div>
</template>

<script setup>
  import {ref,computed} from 'vue'
  import { useRouter } from 'vue-router'
  import {useCityStore} from '@/stores/modules/city'
  import {storeToRefs} from 'pinia'
  import CitiesGroup from './cpns/cities-group.vue'

  const value = ref('')
  const router = useRouter()
  const onCancel = () => {
    router.back()
  }
  
  //网络请求
  // const getCitiesData = async () => {
  //   const res = await getCities()
  //   console.log(res)
  // }
  // getCitiesData()
  // 优化: 因为网络请求多次,占位置, 而且网络请求代码不应该写在组件中 (solve: 使用pinia)
  const cityStore = useCityStore()
  cityStore?.fetchAllCities()
  const {allCities} = storeToRefs(cityStore)

  const active = ref(0)
  const currentCityGroup = computed(() => allCities.value[active.value])
  console.log(typeof currentCityGroup, currentCityGroup)
</script>


<style scoped lang="less">
.cities {
  --van-tab-line-height:50px;
  // position: relative;
  // z-index: 9;
  // height: 100vh;
  // background: #fff;
  // overflow-y: auto;

  // 缺点: 左边的滚动条和内容不对应
  // .top {
  //   position: fixed;
  //   top: 0;
  //   left: 0;
  //   right: 0;
  //   z-index: 9;
  // }
  // .content {
  //   margin-top: 100px;
  // }

  //改进:
  .content {
    height: calc(100vh - 100px); // 100px是top的高度
    overflow-y: auto;
  }

  // 滚动时tab标签内容会消失
  .top {
    position: relative; // 作用可以设置z-index
    z-index: 9;
  }
}
</style>