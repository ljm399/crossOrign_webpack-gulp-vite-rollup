import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './react/index';
import { add } from './ts/index';

console.log('hello world');

const b = 2

const foo = ()=>{
    console.log('爱你呦')
}

foo();
// console.log(a);

const stringa = 'hello';
console.log(stringa.includes('h'));

// react
createRoot(document.getElementById('root')).render(<App />);

// ts
console.log(add(1, 2));
console.log(add('a','b'));


