import HYRequest from '../request'
export function fetchHotSuggests() {
  return HYRequest.get({
    url: '/home/hotSuggests'
  })
}

export function fetchHomeCategories() {
  return HYRequest.get({
    url: '/home/categories'
  })
}

export function fetchHomeHouselist(currentPage) {
  return HYRequest.get({
    url: '/home/houselist',
    params: {
      page: currentPage
    }
  })
}