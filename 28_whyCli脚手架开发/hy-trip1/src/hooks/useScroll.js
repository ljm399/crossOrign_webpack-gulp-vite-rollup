import {onMounted, onUnmounted, ref} from 'vue'
import { throttle } from 'underscore'
//  方式一: 缺点: 要传入多个回调函数, 但你只用知道他有无到底部就可以了, 传入回调函数是多余的
// export default function useScroll(...callback) {
//   // 监听滚动
//   const scrollHandler = () => {
//     const clientHeight = document.documentElement.clientHeight
//     const scrollHeight = document.documentElement.scrollHeight
//     const scrollTop = document.documentElement.scrollTop
//     // console.log(clientHeight, scrollHeight, scrollTop) // 667 2962 2295
//     if(clientHeight + scrollTop >= scrollHeight) {
//       if(callback.length) {
//         callback.forEach(item => {
//           item()
//         })
//       }
//     }
//   }

//   // 取消监听, 防止其他页面也触发
//   const cancelScrollHandler = () => {
//     window.removeEventListener('scroll', scrollHandler)
//   }
//   onMounted(() => {
//     window.addEventListener('scroll', scrollHandler)
//   })
//   onUnmounted(() => {
//     cancelScrollHandler()
//   })
// }

// 方式二: 
export default function useScroll(el) {
  const isReachBottom = ref(false)
  const clientHeight = ref(document.documentElement.clientHeight)
  const scrollHeight = ref(document.documentElement.scrollHeight)
  const scrollTop = ref(document.documentElement.scrollTop)

  const scrollHandler = throttle(() => {
    if(el) {
      clientHeight.value = el.value.clientHeight
      scrollHeight.value = el.value.scrollHeight
      scrollTop.value = el.value.scrollTop
    }else {
      clientHeight.value = document.documentElement.clientHeight
      scrollHeight.value = document.documentElement.scrollHeight
      scrollTop.value = document.documentElement.scrollTop
    }

    // console.log(clientHeight, scrollHeight, scrollTop) // 667 2962 2295
    if(clientHeight.value + scrollTop.value >= scrollHeight.value) {
      isReachBottom.value = true
      console.log('到底部了');
    }
  }, 100)

  // 取消监听, 防止其他页面也触发
  const cancelScrollHandler = () => {
    window.removeEventListener('scroll', scrollHandler)
  }
  onMounted(() => {
    if(el) {
      el.value.addEventListener('scroll', scrollHandler)
    }else {
      window.addEventListener('scroll', scrollHandler)
    }
  })
  onUnmounted(() => {
    cancelScrollHandler()
  })
  return {
    isReachBottom,
    clientHeight,
    scrollHeight,
    scrollTop
  }
}
