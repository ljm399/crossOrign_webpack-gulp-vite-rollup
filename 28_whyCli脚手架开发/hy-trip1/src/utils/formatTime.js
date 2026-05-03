import dayjs from 'dayjs'
export const formatTime = (time, format = 'YYYY-MM-DD') => {
  return dayjs(time).format(format)
}

export const Add1 = (time) => {
  // 方法一:
  let newTime = time + 24 * 60 * 60 * 1000
  return dayjs(newTime).format('YYYY-MM-DD')

  // 方法二: 简化(使用dayjs里面的add方法)
  // return dayjs(time).add(1, 'day').format('YYYY-MM-DD')
}

export const stayCount = (startDate, endDate) => {
  return dayjs(endDate).diff(dayjs(startDate), 'day')
}

