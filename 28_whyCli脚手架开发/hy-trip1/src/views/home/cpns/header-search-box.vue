<template>
  <div class="header-search-box">
    <div class="location">
      <div class="city" @click="pushCities">{{ currentCity.cityName }}</div>
      <div class="myLocation" @click="getLocation">
        <span>我的位置</span>
        <img class="icon" src="@/assets/img/home/icon_location.png" alt="">
      </div>
    </div>

    <!-- 日期:入住时间 -->
    <div class="checkInTime">
        <div class="staying">
          <div class="stayPanel" @click="show = true">
            <div class="live">入住</div>
            <div class="startDate">{{ startDate }}</div>
          </div>
          <div class="during">共{{ stayDays }}晚</div>
        </div>
        <div class="leaving" @click="show = true">
          <div class="leave">离店</div>
          <div class="endDate">{{ endDate }}</div>
        </div>
    </div>
    <!-- 日期组件 -->
    <van-calendar v-model:show="show" type="range" @confirm="onConfirm" allow-same-day/>

    <!-- 价格和人数不限 -->
    <div class="unLimit section">
      <div class="price section-part1">价格不限</div>
      <div class="people section-part2">人数不限</div>
    </div>

    <!-- 关键字 -->
    <div class="keyWord section">
      <input type="text" placeholder="关键字/位置/民宿名称" style="border: none;">
    </div>

    <!-- 热门推荐 -->
     <div class="hotSuggests section">
        <template v-for="(item,index) in hotSuggests" :key="index">
          <div
            class="hotSuggest"
            :style="{
              color: item.tagText.color,
              background: item.tagText.background.color
            }"
          >{{ item.tagText.text }}</div>
        </template>
     </div>

     <!-- 搜索按钮 -->
      <div class="search-btn" @click="search">
        <span>开始搜索</span>
      </div>

      <!-- 类别 -->
      <HomeCategories/>
  </div>
</template>

<script setup>
  import { useRouter } from 'vue-router'
  import { useCityStore } from '@/stores/modules/city'
  import { storeToRefs } from 'pinia'
  import { formatTime, Add1, stayCount } from '@/utils/formatTime'
  import { ref } from 'vue'
  import HomeCategories from './home-categories.vue'
  import { useMainStore } from '@/stores/modules/main'


  const router = useRouter()
  const pushCities = () => {
    router.push('/cities')
  }

  const { currentCity } = storeToRefs(useCityStore())

  // 获取位置
  const getLocation = () => {
    navigator.geolocation.getCurrentPosition((position) => {
      console.log(position)
    })
  }

  // 日期的处理
  // 方法一: 处理31天 到 1日 而不是 32日的问题
  // const nowDate = new Date()
  // const startDate = ref(formatTime(nowDate))
  // // console.log(nowDate.getDate()) // 获取日, 2
  // // console.log(nowDate.getMonth()) // 获取月, 9
  // const newDate = nowDate.setDate(nowDate.getDate() + 1)
  // // setDate作用:使nowDate.getDate()变为时间戳模式, 不然formatTime函数里面传入个8会没效果
  // // console.log('newDate', newDate)
  // const endDate = ref(formatTime(newDate))
  // const stayDays = ref(stayCount(startDate.value, endDate.value))


  // 方法二: 去day.js里面看
  // const nowDate = new Date().getTime() // geiTime是为了获取时间戳
  // const startDate = ref(formatTime(nowDate))
  // const endDate = ref(Add1(nowDate))
  // const stayDays = ref(stayCount(startDate.value, endDate.value))

  // 方法三: 日期保存store.则全局可以用
  const mainStore = useMainStore()
  const { startDate, endDate, stayDays } = storeToRefs(mainStore)
  // console.log(startDate.value,endDate.value,stayDays.value)

  // 日期组件
  const show = ref(false)
  const onConfirm = (value) => {
    // 这里可以推荐通过action来修改store里面的数据(因为符合单项数据流)
    mainStore.startDate = formatTime(value[0])
    mainStore.endDate = formatTime(value[1])
    mainStore.stayDays = stayCount(mainStore.startDate, mainStore.endDate)
    show.value = false
  }

  // 热门推荐
  defineProps({
    hotSuggests: {
      type: Array,
      default: () => []
    }
  })

  // 搜索
  const search = () => {
    router.push({
      path: '/search',
      query: {
        startDate: mainStore.startDate,
        endDate: mainStore.endDate,
        city: currentCity.value.cityName
      }
    })
  }
</script>

<style scoped lang="less">
  .location {
    display: flex;
    height: 40px;
    padding: 5px 15px;
    .city {
      flex:1;
      line-height: 40px;
    }
    .myLocation {
      display: flex;
      justify-content: center;
      align-items: center;
      .icon {
        width: 22px;
        margin-left: 5px;
      } 
    }
  }

  .checkInTime,.section {
    display: flex;
    justify-content: space-between;
    height: 40px;
    padding: 2px 15px;
    padding-right: 30px;
    .staying,.section-part1 {
      flex: 1;
      display: flex;
      .during {
        width: 50%;
        text-align: center;
        line-height: 40px;
      }
    }
    .leaving,.section-part2 {
      display: flex;
      flex-direction: column;
      div {
        margin: 0 auto;
      }
    }
  }
  .live,.leave {
    color: #666;
    margin-bottom: 5px;
  }

  // 日历组件: 高度设置为100%
  .header-search-box {
    --van-calendar-popup-height: 100%;
  }

  // 价格和人数不限
  .unLimit {
   color: #666 ;
   .price,.people {
     line-height: 40px;
   }
  }

  // 热门推荐
  .hotSuggests {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
    height: auto;
    .hotSuggest {
      padding: 5px 10px;
      margin: 5px 2px;
    }
  }

  // 搜索按钮
  .search-btn {
    padding: 5px 15px;
    span{
      display: block;
      width: 100%; 
      text-align: center;
      line-height: 40px;
      background-image: var(--theme-linear-gradient);
      color: #fff;
      border-radius: 50px;
   }
  }
</style>