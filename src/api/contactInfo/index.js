import request from '@/utils/request'

// 查询列表
export function listBanner (query) {
  return request({
    url: '/system/ContactInfo/list',
    method: 'get',
    params: query
  })
}


// 新增
export function addBanner (data) {
  return request({
    url: '/system/ContactInfo/upload',
    method: 'post',
    data: data
  })
}

// 修改
export function updateBanner (data) {
  return request({
    url: '/system/ContactInfo/update',
    method: 'put',
    data: data
  })
}



// 删除
export function delBanner (Id) {
  return request({
    url: '/system/ContactInfo/' + Id,
    method: 'delete'
  })
}
