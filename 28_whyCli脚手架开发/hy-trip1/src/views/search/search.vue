<template>
  <div class="search-bar">
    <van-icon name="arrow-left" @click="back"/>
    <img src="@/assets/img/home/icon-right-menu.png" alt="" class="icon">
    <div class="content">
    <div class="left">
      <div class="city">广州</div>
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
      <div class="input">
        <input type="text" placeholder="关键字/位置/民宿sdfsdfsdfsdfsdf">
      </div>
    </div>

    </div>
  </div>
</template>

<script setup>
import { useMainStore } from '@/stores/modules/main'
import { storeToRefs } from 'pinia'
import { formatTime } from '@/utils/formatTime'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
const mainStore = useMainStore()
const { startDate, endDate } = storeToRefs(mainStore)
const startDateStr = computed(()=> formatTime(startDate.value, 'MM.DD'))
const endDateStr = computed(()=> formatTime(endDate.value, 'MM.DD'))

const router = useRouter()
const back = () => {
  router.back()
}
</script>

<style scoped lang="less">
.search-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9;
  padding: 15px 60px;
  background-color: #fff;

  .van-icon-arrow-left {
    position: absolute;
    left: 15px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 20px;  
    color: var(--primary-color);
  }

  .icon {
    position: absolute;
    right: 15px;
    top: 50%;
    transform: translateY(-50%);
    width: 20px;
    height: 20px;
    
  }

  .content {
    height: 45px;
    display: flex;
    padding: 0 10px;
    background-color: #eee;

    .left {
      display: flex;
      flex:1;
      overflow: hidden;
      .city {
        flex-shrink: 0;
        width: 60px;
        height: 45px;
        line-height: 45px;
        text-align: center;
      }
      .stayTime {
        display: flex;
        flex-shrink: 0;
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
      .input {
        overflow: hidden;
        flex: 1;
        line-height: 45px;
        margin-left: 10px;
        input {
        width: 100%;
        border: none;
        outline: none;
        background-color: transparent;
        text-overflow: ellipsis;     /* 超出显示省略号 */
        white-space: nowrap;         /* 不换行 */
        overflow: hidden;            /* 超出部分隐藏 */
        }
        input::placeholder {
          text-overflow: ellipsis;
          white-space: nowrap;
          overflow: hidden;
        }
        }
     
    }
  }
}
</style>