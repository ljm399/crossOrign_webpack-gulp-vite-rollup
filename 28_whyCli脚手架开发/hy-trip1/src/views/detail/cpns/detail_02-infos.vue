<template>
  <div class="infos">
    <h2 class="name">{{ houseInfo.houseName }}</h2>
    <div class="tags">
      <template v-for="(item, index) in houseInfo.houseTags" :key="index">
        <span 
          class="tag" v-if="item.tagText"
          :style="{ color: item.tagText.color, backgroundColor: item.tagText.background.color }"
        >{{ item.tagText.text }}</span>
      </template>
    </div>
    <div class="comment">
      <div class="left">
        <span class="score">{{ houseInfo.commentBrief.overall }}</span>
        <span class="scoreTitle">{{ houseInfo.commentBrief.scoreTitle }}</span>
        <span class="commentBrief">{{ houseInfo.commentBrief.commentBrief }}</span>
      </div>
      <div class="right">
        <span class="totalCount">{{ houseInfo.commentBrief.totalCount }}条评论</span> &gt;
      </div>
    </div>
    <div class="location">
      <div class="left">
        <span class="address">{{ houseInfo.nearByPosition.address }}</span>
      </div>
      <div class="right">
        <span>地图·周边</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  houseInfo: {
    type: Object,
    default: () => {}
  }
})
</script>


<style scoped>
.infos {
  padding: 16px 8px;
  .tags {
    margin: 16px 0;
    .tag {
      margin-right: 5px;
    }
  }

  .comment {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 8px 0;
    padding: 8px;
    background-color: #eee;
    .left {
      .score {
        font-size: 20px;
        font-weight: bold;
        margin-right: 5px;
      }
      .scoreTitle {
        font-weight: bold;
        margin-right: 5px;
      }
    }
    .right {
      color: var(--primary-color);
    }
  }

  .location {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 16px 0;
    padding: 8px;
    background-color: #eee;
    font-weight: bold;

  }
}
</style>