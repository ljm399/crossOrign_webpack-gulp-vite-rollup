export function sum(a: number, b: number) {
  return a + b;
}

export function runTsExample(mountEl: Element) {
  const result = sum(10, 20);
  const div = document.createElement('div');
  div.textContent = `TS demo: 10 + 20 = ${result}`;
  mountEl.appendChild(div);
}
