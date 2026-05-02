import { createApp } from 'vue';
import App from './App.vue';

export function mountVue(selector) {
  const el = document.querySelector(selector);
  if (!el) return;
  createApp(App).mount(el);
}
