import HYRequest from '../request'
export function getCities() {
  return HYRequest.get({
    url: '/city/all'
  })
}