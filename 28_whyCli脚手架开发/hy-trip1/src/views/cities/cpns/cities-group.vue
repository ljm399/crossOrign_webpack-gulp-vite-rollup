<template>
  <div class="cities-group">
    <!-- 记得sticky 前面要加 : -->
    <van-index-bar  :sticky="false" :index-list="indexList">
      <!-- 热门城市 -->
      <van-index-anchor index="热门城市" />
      <div class="list">
        <template v-for="hotCity in hotCities">
          <span class="city" @click="cityClick(hotCity)">{{ hotCity.cityName }}</span>
        </template>
        <span class="city">#</span>
        <!-- <span class="station"></span>
        <span class="station"></span>
        <span class="station"></span> -->
      </div>
      
      <!-- 全部城市 -->
      <template v-for="(item,index) in citiesGroup">
        <van-index-anchor :index="item.group" />
        <template v-for="city in item.cities">
          <van-cell :title="city.cityName" @click="cityClick(city)" />
        </template>
      </template>
    </van-index-bar>
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import { useCityStore } from '@/stores/modules/city'
  import { useRouter } from 'vue-router'

  const props = defineProps({
  citiesGroup: {
    type: Array,
    default: () => []
  },
  hotCities: {
    type: Array,
    default: () => []
  }
  })

  const indexList = computed(() => {
    const cityIndex = props.citiesGroup.map(item => item.group)
    cityIndex.unshift('#')
    return cityIndex
  })

  const cityStore = useCityStore()
  const router = useRouter()
  const cityClick = (city) => {
    cityStore.currentCity = city
    router.back()
  }
</script>


<style scoped lang="less">
  .list {
    display: flex;
    // justify-content: space-around;
    justify-content: flex-start;
    flex-wrap: wrap;
    padding: 10px 10px;
    padding-right: 20px;
    .city {
      width: 21%;
      height: 25px;
      line-height: 25px;
      margin-right: 13px;
      text-align: center;
      background-color: pink;
      border-radius: 10px;
      margin-bottom: 10px;
    }
    .station {
      width:21%
    }
  }
</style>