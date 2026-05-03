<template>
  <div class="notice">
    <DetailSection header="预定须知">
    <div class="notices">
      <template v-for="(item, index) in notices" :key="index">
        <div class="content">
          <div class="left">
            <div class="title">{{ item.title }}</div>
            <div class="desc">{{ item.introduction }}</div>
          </div>
          <div class="right" v-if="item.tips">
            查看说明
          </div>
        </div>
      </template>
    </div>
    </DetailSection>
  </div>
</template>

<script setup>
import DetailSection from '@/components/detail-section/detail-section.vue';
defineProps({
  notices: {
    type: Array,
    default: () => []
  }
})




</script>


<style scoped lang="less">
.notices {
  display: flex;
  flex-direction: column;
  gap: 20px;

  // 使用float来布局
  // .content {
  //   height: 25px;
  //   line-height:25px;
  //   .left {
  //     float: left;
  //     justify-content: flex-start;
  //     color: #555;
  //     font-size: 13px;
  //     // width: 100%; // 这里不能100%,否则会把right挤到下面去了
  //     .title {
  //       float:left;
  //       width: 60px;
  //       color: #333; 
  //     }
  //     .desc {
  //       float:left;
  //       margin-left: 10px;
  //     }
  //   }
  //   .right {
  //     float: right;
  //   height: 25px;
  //   }
  // }

  // 使用flex布局
  .content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    .left {
      display: flex;
      flex: 1;
      color: #555;
      font-size: 13px;
      .title {
        // width: 20%;
        width: 60px;
        color: #333; 
      }
      .desc {
        flex:1;
        margin-left: 10px;
      }
    }
    // .right {
    //   position: absolute;
    //   right: 20px;
    // }
  }
}
</style>