<template>
  <div class="detail-section">
    <h2 class="header">{{ header }}</h2>
    <div class="content">
      <slot>
        <div class="content-inner">我是默认内容</div>
      </slot>
    </div>
    <div class="foot">
      <span class="more">{{ more }}</span>
      <van-icon name="arrow" v-if="more.length"/>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  header: {
    type: String,
    default: ''
  },
  more: {
    type: String,
    default: ''
  }
})
</script>


<style scoped lang="less">
.detail-section {
  padding: 0 16px;
  border-top: 3px solid #eee;
  .header {
    padding: 20px 0;
    border-bottom: 1px solid #eee;
  }
  .content {
    padding: 20px 0;
  }
  .foot {
    display: flex;
    justify-content: right;
    margin: 20px 0;
    color: var(--primary-color) 
  }
}
</style>