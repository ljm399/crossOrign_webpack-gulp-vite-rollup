import HyRequest from '../request'

export function getDetailInfos(houseId) {
  return HyRequest.get({
    url: '/detail/infos',
    params: {
      houseId
    }
   })
}

