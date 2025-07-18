import request from '@/utils/request'

// 查询列表
export function listBanner (query) {
  return request({
    url: '/system/test/user/list',
    method: 'get',
    params: query
  })
}


// 新增
export function addBanner (data) {
  return request({
    url: '/system/test/user/save',
    method: 'post',
    data: data
  })
}

// 修改
export function updateBanner (data) {
  return request({
    url: '/system/test/user/update',
    method: 'put',
    data: data
  })
}



// 删除
export function delBanner (Id) {
  return request({
    url: '/system/test/user/' + Id,
    method: 'delete'
  })
}
