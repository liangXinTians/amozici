import request from '@/utils/request'


// 查询列表
export function listBanner (query) {
  return request({
    url: '/system/banner-display/list',
    method: 'get',
    params: query
  })
}


// 新增
export function addBanner (data) {
  return request({
    url: '/system/banner-display/upload',
    method: 'post',
    data: data
  })
}

// 修改
export function updateBanner (data) {
  return request({
    url: '/system/banner-display/update',
    method: 'put',
    data: data
  })
}



// 删除
export function delBanner (Id) {
  return request({
    url: '/system/banner-display/' + Id,
    method: 'delete'
  })
}
