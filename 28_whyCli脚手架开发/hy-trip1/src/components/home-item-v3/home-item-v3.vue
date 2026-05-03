<template>
  <div class="home-item-v3">
    <div class="item-inner">
      <div class="cover">
        <img :src="itemData.image.url" alt="">
      </div>
      <div class="content">
        <div class="locaition">
          <img src="@/assets/img/home/location.png" alt="">
          <span>{{  itemData.location }}</span>
        </div>
        <div class="houseName">{{ itemData.houseName }}</div>
        <div class="summaryText">{{ itemData.summaryText }}</div>
        <div class="comment">
          <div class="finalPrice">¥{{ itemData.finalPrice }}</div>
          <div class="productPrice">¥{{ itemData.productPrice }}</div>
          <div class="text" v-if="itemData.priceTipBadge">{{ itemData.priceTipBadge.text }}</div>
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
.home-item-v3 {
  width: 50%;
  position: relative;
  .item-inner {
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
      bottom: -5px;
      color: #000;
      padding: 0 15px 5px 5px;
      font-size: 13px;
      .locaition {
        display: flex;
        align-items: center;
        img {
          width: 16px;
          height: 16px;
        }
      }
      .houseName {
        padding-top: 6px;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        overflow: hidden;
        text-overflow: ellipsis;
        line-height: 1.2;
      }
      .summaryText {
        padding: 6px 0;
      }
      .comment {
        display: flex;
        .finalPrice {
          color: #ff5f56;
          font-size: 18px;
        }
        .productPrice {
          color: #999;
          font-size: 13px;
          line-height: 16px;
          text-decoration: line-through;
          padding: 0 2px;
        }
        .text {
          background-color: #ff5f56;
          color: #fff;
          font-size: 16px;
          line-height: 18px;
          border-radius: 10px;
          padding: 0 5px;
        }
      }
    }
  }
}
</style>