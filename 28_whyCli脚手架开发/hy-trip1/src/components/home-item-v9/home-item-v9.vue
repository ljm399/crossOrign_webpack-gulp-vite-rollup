<template>
  <div class="home-item-v9">
    <div class="item-inner">
      <div class="cover">
        <img :src="itemData.image.url" alt="">
      </div>
      <div class="content">
        <div class="summaryText">{{ itemData.summaryText }}</div>
        <div class="houseName">{{ itemData.houseName }}</div>
        <div class="comment">
          <van-rate
            :model-value="Number(itemData.commentScore)"
            size="15"
            color="#ffd21e"
            void-icon="star"
            readonly allow-half
          />
          <div class="finalPrice">{{ itemData.finalPrice }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  itemData: {
    type: Object,
    default: () => ({})
  }
})
</script>


<style scoped lang="less">
.home-item-v9 {
  width: 50%;
  .item-inner {
    position: relative;
    padding: 15px 15px 0 0;
    
    .cover {
      border-radius: 10px;
      overflow: hidden;
      img {
        width: 100%;
      }
    }
    .content {
      position: absolute;
      // background-color: #fff;
      bottom: 0;
      color: #fff;
      padding: 0 15px 5px 5px;
      font-size: 14px;

      .houseName {
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        overflow: hidden;
        text-overflow: ellipsis;
        line-height: 1.5;
        margin: 6px 0;
      }
      
      .comment {
        display: flex;
        justify-content: space-between;
        padding-right: 10px;
      }
    }
  }
}
</style>