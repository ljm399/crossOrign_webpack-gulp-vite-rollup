<template>
   <div class="swiper">
      <van-swipe>
        <template v-for="(item, index) in housePics" :key="index">
          <van-swipe-item>
            <img :src="item.url" alt="">
          </van-swipe-item>
        </template>
        <!-- 指示器可以和轮播图分开 -->
        <template #indicator="{ active, total }">
          <div class="custom-indicator" >
            <template  v-for="(value,key,index) in hyHousePics" :key="key">
              <div :class="{active: housePics[active]?.enumPictureCategory == key}">
                {{ reviseName(value[0].title) }}
                <span v-if="housePics[active]?.enumPictureCategory == key">{{ getHyIndex(housePics[active]) }}/{{ value.length }}</span>
              </div>
            </template>
          </div>
        </template>
      </van-swipe>
     </div>
</template>

<script setup>
import { defineProps } from 'vue'
const props = defineProps({
  housePics: {
    type: Array,
    default: () => []
  }
})

const hyHousePics = {}
for (const item of props.housePics) {
    let arr = hyHousePics[item.enumPictureCategory]
    if(!arr) {
      hyHousePics[item.enumPictureCategory] = []
      arr = hyHousePics[item.enumPictureCategory]
    }
    arr.push(item)
}

// 对hyHousePics数据的text的处理
const nameReg = /【(.*?)】/i
const reviseName = (name) => {
  // 方式一
  // return name.replace('【','').replace('】','').replace('：','')

  // 方式二
  const results = nameReg.exec(name)
  // console.log(results)
  return results[1]
}

// 获取当前图片在hyHousePics中的序号
const getHyIndex = (item) => {
  return hyHousePics[item.enumPictureCategory].findIndex(data=> data === item) + 1
}
</script>


<style scoped lang="less">
  .swiper {
    img {
      width:100%
    }

    .custom-indicator {
      display: flex;
      position: absolute;
      right: 5px;
      bottom: 5px;
      padding: 2px 3px;
      font-size: 12px;
      background: rgba(0, 0, 0, 0.9);
      color: #fff;

      div{
        margin: 0 6px;
      }
      .active {
        background-color: #fff;
        color: #000;
        padding: 0px 6px;
        border-radius: 12px;
      }
    }
  }
</style>