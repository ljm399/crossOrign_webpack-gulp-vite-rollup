import { defineStore } from 'pinia'
import { fetchHotSuggests, fetchHomeCategories, fetchHomeHouselist } from '@/service'
export const useHomeStore = defineStore('home', {
  state: () => ({
    hotSuggests: [],
    categories: [],
    homeHouselist: [],
    currentPage: 1
  }),
  actions: {
    async fetchHotSuggests() {
      const res = await fetchHotSuggests()
      this.hotSuggests = res.data
    },
    async fetchHomeCategories() {
      const res = await fetchHomeCategories()
      this.categories = res.data
    },
    async fetchHomeHouselist() {
      const res = await fetchHomeHouselist(this.currentPage)
      if(res.data.length === 0) {
        return
      }
      this.homeHouselist.push(...res.data)
      this.currentPage++
    }
  }
})