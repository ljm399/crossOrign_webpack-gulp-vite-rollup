import { sum } from './index.js';

export function runBrowserEsmExample(mountEl) {
  const result = sum(10, 20);
  mountEl.textContent = `ESM import demo: 10 + 20 = ${result}`;
}
