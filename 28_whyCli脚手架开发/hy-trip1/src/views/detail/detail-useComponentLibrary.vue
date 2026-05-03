<template>
  <div class="detail">
     <div class="mainPart" v-if="mainPart">
      <van-tabs v-model:active="active" scrollspy sticky :offset-top="0" :class="{'hide-header': !showHeader}">
        <van-tab title="顶部" name="top">
          <van-nav-bar
            title="房屋详情"
            left-text="旅途"
            left-arrow
            @click-left="onClickLeft"
          />
        </van-tab>
        <van-tab title="图片" name="swiper">
          <Swiper :housePics="housePics" v-if="housePics?.length"/>
        </van-tab>
        <van-tab title="概述" name="infos">
          <Infos :houseInfo="mainPart.topModule"/>
        </van-tab>
        <van-tab title="设施" name="facility">
          <Facility :houseFacility="mainPart.dynamicModule.facilityModule.houseFacility"/>
        </van-tab>
        <van-tab title="房东" name="landlord">
          <LandLord :landlord="mainPart.dynamicModule.landlordModule"/>
        </van-tab>
        <van-tab title="评价" name="comments">
          <Comments :comments="mainPart.dynamicModule.commentModule"/>
        </van-tab>
        <van-tab title="须知" name="notice">
          <Notice :notices="mainPart.dynamicModule.rulesModule.orderRules"/>
        </van-tab>
        <van-tab title="周边" name="map">
          <Map :position="mainPart.dynamicModule.positionModule" />
        </van-tab>
        <van-tab title="价格说明" name="price">
          <PriceIntro :introduction="mainPart.introductionModule"/>
        </van-tab>        
      </van-tabs>
     </div>

  </div>
</template>

<script setup>
import { useRouter,useRoute } from 'vue-router'
import {getDetailInfos} from '@/service/modules/detail'
import { ref,computed,watch } from 'vue'
import Swiper from './cpns/detail_01-swiper.vue'
import Infos from './cpns/detail_02-infos.vue'
import Facility from './cpns/detail_03-facility.vue'
import LandLord from './cpns/detail_04-landlord.vue'
import Comments from './cpns/detail_05-comments.vue'
import Notice from './cpns/detail_06-notice.vue'
import Map from './cpns/detail_07-map.vue'
import PriceIntro from './cpns/detail_08-priceIntro.vue'

const router = useRouter()
const onClickLeft = () => {
  router.back()
}

const route = useRoute()
const houseId = route.params.id

//发送网络请求,并保持数据到本地, 方便就不保存到pinia
const detailInfos = ref({})
// 拿到res里面的具体数据
  // 开始时detailInfos.value为空,但mainPart不报错,因为computed 属性是惰性求值的，这意味着它只会在实际被访问时才会执行计算函数
  getDetailInfos(houseId).then(res => {
    detailInfos.value = res.data
  })
  
  
// 数据处理
const mainPart = computed(() => detailInfos.value?.mainPart)
// 对录播图数据的处理
const housePics = computed(() => mainPart.value?.topModule?.housePicture?.housePics)

// 当前激活的 tab 索引
const active = ref('top')
// 使用 computed 自动计算是否显示标签栏
const showHeader = computed(() => active.value !== 'top')

// 调试：监听 active 变化
watch(active, (newVal) => {
  console.log('当前 tab:', newVal)
  console.log('显示标签栏:', showHeader.value)
  
})  
</script>


<style scoped>
/* 使用 CSS 隐藏标签栏，而不是改变 DOM 结构 */
.hide-header :deep(.van-tabs__wrap) {
  opacity: 0;
  pointer-events: none;
  transition: opcity 0.3s;
  height: 0;

  /* 优化性能属性 */
}

/* 显示标签栏 */
:deep(.van-tabs__wrap) {
  opacity: 1;
  pointer-events: auto;
  transition: opacity 0.3s;
}
</style>