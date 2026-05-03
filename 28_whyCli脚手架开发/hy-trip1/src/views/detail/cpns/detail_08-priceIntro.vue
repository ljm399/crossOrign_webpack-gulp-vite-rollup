<template>
  <div class="price-intro">
    <h3>{{ introduction.title }}</h3>
    <p>{{ introduction.introduction }}</p>
    <div class="log">
      <div class="up">
        <img src="@/assets/img/detail/icon_ensure.png" alt="">
      </div>
      <div class="down">
        <span class="title">弘源旅途，永无止境</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  introduction: {
    type: Object,
    default: () => ({})
  }
})
</script>


<style scoped lang="less">
.price-intro {
  border-top: 3px solid #eee;
  padding: 20px 16px;
  p {
    color: #666;
    line-height: 1.4;
  }
  .log {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px 0;
    
    .up {
      width:33.3%;
      height: 20px;
      margin-bottom: 10px;
      img {
        width: 100%;
      }
    }
    .down {
      font-size: 12px;
      color: #777;
    }
  }
}
</style>