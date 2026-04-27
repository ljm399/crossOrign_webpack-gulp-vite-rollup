import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './react/index';
import { add } from './ts/index';
import {baa,acc} from './utils/index'
import axios from 'axios';
import view1 from '../public/view1.jpg'
import './css/style.css'

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
const root = createRoot(document.getElementById('root'));
root.render(<App />);

// ts
console.log(add(1, 2));
console.log(add('a','b'));

// img
const imgContainer = document.getElementById('img');
if (imgContainer) {
    const img = document.createElement('img');
    img.src = view1;
    img.alt = 'view1';
    imgContainer.appendChild(img);
}

// 发送网络请求
axios.get('/api/test').then(res => {
    console.log(res)
})


// 动态导入 和 魔法注释修改打包后名
const btn = document.getElementById('btn');
btn.addEventListener('click', () => {
    import(
        /* webpackChunkName: "hy_main" */
        /* webpackPreload: true */
        './dynamic-import/test1'
    ).then(module => {
        // 调用或使用加载包里面的方法或变量
        console.log(module.ab); // 3
        const Test1 = module.default; // 渲染出来
        root.render(
            <>
                <App />
                <Test1 />
            </>
        );
    });
});


// 导入utils
console.log(acc,baa);

