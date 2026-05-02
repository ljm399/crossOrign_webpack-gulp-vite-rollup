<template>
  <div class="app">
    <h2 class="title">Hello Rollup + Vue</h2>
    <p class="desc">msg: {{ msg }}</p>
    <p>count: {{ count }}</p>
    <p>double: {{ doubleCount }}</p>
    <button @click="inc">+</button>
    <button @click="dec">-</button>
  </div>
</template>

<script>
export default {
  props: {
    msg: {
      type: String,
      default: 'hi'
    }
  },
  data() {
    return {
      count: 0
    };
  },
  computed: {
    doubleCount() {
      return this.count * 2;
    }
  },
  watch: {
    count(newVal, oldVal) {
      if (newVal !== oldVal) {
        console.log('count changed:', oldVal, '->', newVal);
      }
    }
  },
  methods: {
    inc() {
      this.count += 1;
    },
    dec() {
      this.count -= 1;
    }
  },
  mounted() {
    console.log('App mounted');
  }
};
</script>

<style scoped>
.app {
  padding: 16px;
}

.title {
  color: #42b983;
}

.desc {
  color: #666;
}
</style>
