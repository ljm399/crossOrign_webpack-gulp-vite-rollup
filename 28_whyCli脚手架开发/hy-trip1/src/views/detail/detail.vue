<template>
  <div class="detail" ref="detailRef">
    <tab-control :title="names" class="tab-control" v-if="showTabControl" @itemClick="outItemClick" ref="tabControlRef" />
    <div class="return-top" @click="returnTop" v-if="!showReturnTop">
      <van-icon name="back-top"/>
    </div>
    <van-nav-bar
      title="房屋详情"
      left-text="旅途"
      left-arrow
      @click-left="onClickLeft"
    />
     <div class="mainPart" v-if="mainPart" v-memo="[mainPart]">      
          <Swiper :housePics="housePics" v-if="housePics?.length"/>
          <Infos name="简介" :ref="getSectionRefs" :houseInfo="mainPart.topModule"/>
          <Facility name="设施" :ref="getSectionRefs" :houseFacility="mainPart.dynamicModule.facilityModule.houseFacility"/>
          <LandLord name="房东" :ref="getSectionRefs" :landlord="mainPart.dynamicModule.landlordModule"/>
          <Comments name="评论" :ref="getSectionRefs" :comments="mainPart.dynamicModule.commentModule"/>
          <Map name="位置" :ref="getSectionRefs" :position="mainPart.dynamicModule.positionModule" />
          <Notice name="规则" :ref="getSectionRefs" :notices="mainPart.dynamicModule.rulesModule.orderRules"/>
          <PriceIntro name="价格" :ref="getSectionRefs" :introduction="mainPart.introductionModule"/>
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
import TabControl from '@/components/tab-control/tab-control.vue'
import useScroll  from '@/hooks/useScroll'
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

// -----------------------------------

// 滚动事件处理：
// 滚动到一定距离，tabControl显示
const detailRef = ref(null)
const { scrollTop } = useScroll(detailRef)
const showTabControl = computed(() => scrollTop.value >= 38)

// 点击返回顶部 和 滚动到一定距离，tabControl显示
const showReturnTop = computed(() => scrollTop.value <= 38 )
const returnTop = () => {
  detailRef.value.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}


// 点击tabControl滚动到对应位置
// const sectionRefs = ref([])
//   // 一次获取多个ref方法
// const getSectionRefs = (ref) => {
//   sectionRefs.value.push(ref)
// }
// const itemClick = (index) => {
//   const swiperElement = sectionRefs.value[index].$el
//   window.scrollTo({
//     top: swiperElement.offsetTop - 38,
//     behavior: 'smooth'
//   })
// }

// 改进：tabControl的名字和section的名字对应，且点击tabControl滚动到对应位置
const sectionRefs = ref({})
// names不会因为第一次没有值就报错，因为computed 属性是惰性求值的，这意味着它又获取到值时才会响应式变化
const names = computed(() => {
  return Object.keys(sectionRefs.value) // 返回一个数组，keys而不是key
})
const getSectionRefs = (ref) => {
  // if判断为了防止组件销毁时，ref为null，然后getAttribute报错
  if(ref) {
    //获取name属性
    const name = ref.$el.getAttribute('name')
    sectionRefs.value[name] = ref
  }
}
const currentIndex = ref(0)

// itemClickScroll作用： 因为itemClickScroll执行会滚动则下面的watch也会执行，导致出现错误
let itemClickScroll = false
const tabControlRef = ref(null)
let sectionOffsetTop = -1
const outItemClick = (index) => {
  // console.log('activity',itemClickScroll)
  const name = names.value[index]
  const swiperElement = sectionRefs.value[name].$el
  sectionOffsetTop = swiperElement.offsetTop
  itemClickScroll = true
  detailRef.value.scrollTo({
    top: swiperElement.offsetTop - 38,
    behavior: 'smooth'
  })
  currentIndex.value = index
}

// 用let和const都可以，因为ref，所以调用时是xx.value里面改
// 滚动时匹配tabControl的name
watch(scrollTop, (newVal) => {
  // console.log('scrollTop',newVal)
  // console.log('watch',itemClickScroll)
  // console.log('setino',sectionOffsetTop)
  // 证明是滚动而不是点击滑动就可以
  if(newVal === sectionOffsetTop - 38) {
    itemClickScroll = false
   }
  
  if(itemClickScroll) return

   // 常用算法
  const values = Object.keys(sectionRefs.value)
  if (!sectionRefs.value || Object.keys(sectionRefs.value).length === 0) return
  const ArrValues = values.map(name => sectionRefs.value[name].$el.offsetTop)
  if(!ArrValues.length) {return}
  // console.log(ArrValues)

  let newIndex = ArrValues.length - 1
  for(let i = 0; i < ArrValues.length; i++) {
    if(newVal < ArrValues[i] - 50 ) {
      newIndex = i > 0 ? i - 1 : 0
      break
    }
  } 

  if (newIndex !== currentIndex.value) {
    tabControlRef.value?.innerItemClick(newIndex)
    currentIndex.value = newIndex
  }
})

</script>


<style scoped>
/* 因为显示和隐藏tabControl，导致其他元素会脱离文档流，所以显示效果不好 */
/* 不要使用css，改用scrllTop滚动到顶部就行 */
.detail {
  /* position: relative; */
  height: 100vh;
  overflow-y: auto;

  .tab-control {
    position: absolute;
    top: 0px;
    left: 0px;
    right: 0px;
    z-index: 9;
    overflow-x: auto;
    &::-webkit-scrollbar {
      display: none;
    }
    /* height: auto 到 0 无法平滑过渡 - CSS 无法在 auto 和具体数值之间做动画
    缺少 overflow: hidden - 内容溢出导致视觉跳动 */
    opacity: 1;
    /* transition: opacity 0.2s ease; */
  } 
  .showByOpacity {
    opacity: 0;
  }  

  .return-top {
    position: fixed;
    bottom: 80px;
    right: 20px;
    z-index: 9;
    cursor: pointer;
    font-size: 30px;
    color: var(--primary-color);
    background-color: bisque;
    border-radius: 50%;
  }
}
</style>