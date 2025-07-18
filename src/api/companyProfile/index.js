import request from '@/utils/request'

// 查询列表
export function listBanner (query) {
  return request({
    url: '/system/company-profile/list',
    method: 'get',
    params: query
  })
}


// 新增
export function addBanner (data) {
  return request({
    url: '/system/company-profile/add',
    method: 'post',
    data: data
  })
}

// 修改
export function updateBanner (data) {
  return request({
    url: '/system/company-profile/update',
    method: 'put',
    data: data
  })
}



// 删除
export function delBanner (Id) {
  return request({
    url: '/system/company-profile/' + Id,
    method: 'delete'
  })
}
