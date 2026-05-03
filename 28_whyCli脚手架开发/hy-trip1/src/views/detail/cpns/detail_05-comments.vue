<template>
  <div class="comments">
    <DetailSection header="热门评论" :more="`查看全部${comments.totalCount}条评论`">
      <div class="content">
        <div class="head">
          <div class="left">
            <div class="score-left">{{ comments.overall }}</div>
            <div class="title-right">
              <div class="title">{{ comments.scoreTitle }}</div>
              <div class="commentCount">{{ comments.totalCount }}条评论</div>
              <div class="star">
                <van-rate
                  :model-value="Number(comments.overall)"
                  size="15"
                  color="var(--primary-color)"
                  void-icon="star"
                  readonly allow-half
                />
              </div>
            </div>
          </div>
          <div class="right">
            <template v-for="(item,index) in comments.subScores">
              <div class="item">{{ item }}</div>
            </template>
          </div>
        </div>
        <div class="mid">
          <template v-for="(item, index) in comments.commentTagVo" :key="index">
            <span 
              class="item"
              :style="{color:item.color,background:item.backgroundColor}"
              >
              {{ item.text }}
            </span>
          </template>
        </div>
        <div class="foot">
          <div class="up">
            <div class="left">
              <img :src="comments.comment.userAvatars" alt="">
            </div>
            <div class="right">
              <div class="name">{{ comments.comment.userName }}</div>
              <div class="time">{{ comments.comment.checkInDate }}</div>
            </div>
          </div>
          <div class="down">
            <div class="text">{{ comments.comment.commentDetail }}</div>
          </div>
        </div>
      </div>
    </DetailSection>
  </div>
</template>

<script setup>
defineProps({
  comments: {
    type: Object,
    default: () => {}
  }
})
</script>
<style scoped lang="less">
.comments {
  .content {
    .head {
      display: flex;
      justify-content: space-between;
      .left {
        display: flex;
        .score-left {
          height: 48px;
          box-sizing: border-box;
          font-size: 50px;
          font-weight: bold;
          // text-decoration: underline;
          // text-decoration-color: var(--primary-color);
          border-bottom: 8px solid var(--primary-color);
        }
        .title-right {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding-left:8px;
          .commentCount {
           color: #666 
          }
        }
      }
      .right {
        display: flex;
        flex-wrap: wrap;
        width:45%;
        .item {
          // width: 48%;
          padding-right: 3px;
          font-size: 13px;
          color: #555
        }
      }
    }
    .mid {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin: 18px 0;
      .item {
        padding: 2px 6px 2px 0;   
      }
    }
    .foot {
      background-color: rgba(145, 145, 145, 0.1);
      padding: 5px;
      .up {
        display: flex;
        margin-bottom: 18px;
        .left {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            overflow: hidden;
          img {
            width: 100%;
            height: 100%;
          }
        } 
        .right {
          display: flex; 
          flex-direction: column;
          justify-content: space-evenly;
          padding-left: 12px;
        }
      }
      .down {
        color: #333;
        font-size: 13px;
        line-height: 1.5;
      }
    }
  }
}
</style>