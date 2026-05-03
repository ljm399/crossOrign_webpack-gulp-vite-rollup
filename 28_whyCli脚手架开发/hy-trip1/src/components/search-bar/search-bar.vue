<template>
  <div class="search-bar">
    <div class="content">
    <div class="left">
      <div class="stayTime">
        <div class="liveTime">
          <span>住</span>{{ startDateStr }}
        </div>
        <div class="leaveTime">
          <span>离</span>
          <span class="leaveTimeText">
            {{ endDateStr }}
            <span class="icon"></span>
          </span>
        </div>
      </div>
      <input type="text" placeholder="关键字/位置/民宿">
    </div>
    <div class="right">
      <div class="icon"></div>
    </div>
    </div>
  </div>
</template>

<script setup>
import { useMainStore } from '@/stores/modules/main';
import { formatTime } from '@/utils/formatTime';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

// 报错,因为(TypeError: Assignment to constant variable, 你使用const,则变量不可以修改
// const {startDate,endDate} = useMainStore()
// startDate = divByDot(startDate)
// endDate = divByDot(endDate)

// 改正: 同时可以和store里面的值有联系,即store里面值改变这里也改变
const {startDate,endDate} = storeToRefs(useMainStore())
// 不推荐
// startDate.value = formatTime(startDate.value, 'MM.DD')
// endDate.value = formatTime(endDate.value, 'MM.DD')
const startDateStr = computed(()=> formatTime(startDate.value, 'MM.DD'))
const endDateStr = computed(()=> formatTime(endDate.value, 'MM.DD'))
</script>
<style scoped>
.search-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9;
  padding: 15px;
  background-color: #fff;

  .content {
    height: 45px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 10px;
    background-color: #eee;


    .left {
      display: flex;

      .stayTime {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        .liveTime {
          margin-bottom: 3px;
          span {
            font-size: 13px;
            margin-right: 3px;
            color: rgba(0, 0, 0, .5);
          }
        }

        .leaveTime{
          span:first-child {
            font-size: 13px;
            color: rgba(0, 0, 0, .5);
          }
          .leaveTimeText {
            position: relative;
            .icon {
              position: absolute;
              right:-9px;
              bottom:0;
              width: 10px;
              height: 10px;
              display: inline-block;
              background-image: url('@/assets/img/home/home-sprite.png');
              background-position: -199px -155px;
              background-size: 207px 192px;
            }
          }
        }
      }
      input {
        margin-left: 10px;
        border: none;
        outline: none;
        background-color: transparent;
      }
    }
    .right {
      width: 25px;
      height: 25px;
      background-image: url('@/assets/img/home/home-sprite.png');
      background-position: -31px -151px;
      background-size: 207px 192px;
    }
  }
}
</style>