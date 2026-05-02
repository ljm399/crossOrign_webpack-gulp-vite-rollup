import './css/index.css';
import App from './vue/App.vue';

import { createApp } from 'vue';

const el = document.createElement('div');
el.className = 'title';
el.textContent = 'Hello Rollup (JS + CSS)';
document.body.appendChild(el);

createApp(App, { msg: 'Hello from Vue!' }).mount('#app');
