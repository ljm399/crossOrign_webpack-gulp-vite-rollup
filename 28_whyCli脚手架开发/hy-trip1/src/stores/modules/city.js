import { defineStore } from 'pinia'
import {getCities} from '@/service'
export const useCityStore = defineStore('city', {
  state: () => ({
    allCities: {},
    currentCity: {cityName: '广州'}
  }),
  actions: {
    async fetchAllCities() {
      const res = await getCities()
      this.allCities = res.data
    }
  }
})