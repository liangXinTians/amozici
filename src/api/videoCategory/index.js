import request from '@/utils/request'

// 查询列表
export function listBanner (query) {
  return request({
    url: '/system/video-category/list',
    method: 'get',
    params: query
  })
}


// 新增
export function addBanner (data) {
  return request({
    url: '/system/video-category/add',
    method: 'post',
    data: data
  })
}

// 修改
export function updateBanner (data) {
  return request({
    url: '/system/video-category/update',
    method: 'put',
    data: data
  })
}



// 删除
export function delBanner (Id) {
  return request({
    url: '/system/video-category/' + Id,
    method: 'delete'
  })
}
