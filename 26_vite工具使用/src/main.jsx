import { mountVue } from './vue/mount-vue.js';
import { mountReact } from './react/mount-react.jsx';
import { runBrowserEsmExample } from './utils/browser-esm.js';
import { runTsExample } from './ts/index.ts';

const vanillaEl = document.querySelector('#vanilla');

// ## 2.2 浏览器支持模块化（ESM）
runBrowserEsmExample(vanillaEl);

// ## 2.3 vite 打包/处理 TS
runTsExample(vanillaEl);

// ## 2.3 vite 处理 less/postcss
import('./css/style.less');

// ## 2.4 vite 搭建 vue/react 项目（同一页面同时挂载）
mountVue('#app');
mountReact('#root');
