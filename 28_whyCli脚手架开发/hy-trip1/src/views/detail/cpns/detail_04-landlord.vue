<template>
  <div class="landlord">
    <detail-section header="房东介绍" more="查看房东主页">
      <div class="content">
        <div class="banner">
          <img :src="landlord.topScroll" alt="">        
        </div>
        <div class="infos">
          <div class="left">
            <div class="logo">
              <img :src="landlord.hotelLogo" alt="">
            </div>
            <div class="hotelInfo">
              <div class="name">{{ landlord.hotelName }}</div>
              <div class="tags">
                <template v-for="(item, index) in landlord.hotelTags" :key="index">
                  <span :style="{color: item.tagText.color}">{{ item.tagText.text }}</span>
                  <span v-if="index !== landlord.hotelTags.length - 1" class="line">|</span>
                </template>
              </div>
            </div>
          </div>
          <div class="right">
            <button>联系房东</button>
          </div>
        </div>
        <div class="comments">
          <template v-for="(item, index) in landlord.hotelSummary" :key="index">
            <div class="comment">
              <div class="title">{{ item.title }}</div>
              <div class="score">{{ item.introduction }}</div>
              <div class="tip">{{ item.tip }}</div>
            </div>
          </template>
        </div>
      </div>
    </detail-section>
  </div>
</template>

<script setup>
import detailSection from '@/components/detail-section/detail-section.vue';

defineProps({
  landlord: {
    type: Object,
    default: () => ({})
  }
})
</script>


<style scoped lang="less">
.landlord {
  .banner {
    img {
      width: 100%;
    }
  } 
  .infos {
    display: flex;
    margin: 8px 0 20px;
    .left {
      flex: 1;
      display: flex;
      .logo {
        width: 64px;
        height: 64px;
        img {
          width: 100%;
          height: 100%;
        }
      }
      .hotelInfo {
        display: flex;
        flex-direction: column;
        justify-content: space-evenly;
        .name {
          font-size: 16px;
          font-weight: bold;
        }
        .tags {
          display: flex;
          gap: 4px;
          font-size: 12px;
        }
        .line {
          color: #ccc;
        }
      }
    }
    .right {
      display: flex;
      align-items: center;
      button {
        background-image: var(--theme-linear-gradient); 
        color: #fff;
        border: none;
        border-radius: 4px;
        padding: 4px 8px;
      }
    }
  }

  .comments {
    display: flex;
    justify-content: space-between;
    .comment {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 8px;
      .title,.tip {
        font-size: 14px;
        color: #666
      }
      .score {
        font-size: 20px;
        font-weight: bold;
      }
    }
  }
}
</style>