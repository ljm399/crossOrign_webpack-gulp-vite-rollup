import { formatTime, stayCount } from '@/utils/formatTime'
import { defineStore } from 'pinia'

const nowDate = new Date()
const startDate = formatTime(nowDate)
const newDate = nowDate.setDate(nowDate.getDate() + 1)
const endDate = formatTime(newDate)
const stayDays = stayCount(startDate, endDate)

export const useMainStore = defineStore('main', {
  state: () => ({
    startDate: startDate,
    endDate: endDate,
    stayDays: stayDays,
    isShowLoading: false
  }),
  actions: {

  }
})