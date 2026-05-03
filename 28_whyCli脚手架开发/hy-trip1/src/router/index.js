import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/home'
    },
    {
      path: '/home',
      component: () => import('@/views/home/home.vue')
    },
    {
      path: '/favor',
      component: () => import('@/views/favor/favor.vue')
    },
    {
      path: '/order',
      component: () => import('@/views/order/order.vue')
    },
    {
      path: '/message',
      component: () => import('@/views/message/message.vue')
    },
    {
      path: '/cities',
      component: () => import('@/views/cities/cities.vue'),
      meta:{
        isShowTabBar: true
      }
    },
    {
      path: '/search',
      component: () => import('@/views/search/search.vue'),
      meta:{
        isShowTabBar: true
      }
    },
    {
      path: '/detail/:id',
      component: () => import('@/views/detail/detail.vue'),
      meta:{
        isShowTabBar: true
      }
    }
  ],
})

export default router
