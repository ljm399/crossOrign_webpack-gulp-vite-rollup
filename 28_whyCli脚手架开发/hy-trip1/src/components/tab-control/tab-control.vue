<template>
  <!-- problem问题for循环不是写在ul上 -->

  <!-- tip提示emits:使不使用emits或者props看父组件和子组件传数据不,这里因为切换tab,和父组件没关系所以不用 -->
  <div class="tab-control">
    <div class="item" 
      v-for="(item, index) in title"
      :key="item"
      @click="itemClick(index)"
      :class="currentIndex === index ? 'active' : ''"
    >
    {{ item }}
  </div>
  </div>
</template>

<script>
export default {
  props: {
    title: {
      type: Array,
      default() {
        return []
      }
    }
  },
  data() {
    //tip提示return,你错了很多次了
    return {
      currentIndex : 0
    }
  },

  methods: {
    itemClick(index) {
      this.currentIndex = index

      // 触发itemClick事件，并携带参数
      this.$emit('itemClick', index)
    },
    innerItemClick(index) {
      this.currentIndex = index
    }
  },


}
</script>

<style scoped>
  .tab-control {
    display: flex;
    justify-content: space-evenly;
    overflow-x: scroll;
    ::-webikit-scrollbar { display: none } ;
    gap: 10px;
    background-color: #ccc;
  }
  .item {
    box-sizing: border-box;
    flex-shrink: 0;
    padding: 15px 7px;
    text-align: center;

  }
  .active {
    border-bottom: 4px solid var(--primary-color);
  }
</style>

