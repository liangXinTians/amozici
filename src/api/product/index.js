import request from '@/utils/request'
import Cookies from 'js-cookie'  // 新增cookie库引入

// // 查询列表
// export function listBanner (query) {
//   return request({
//     url: '/system/product/list',
//     method: 'get',
//     params: {
//       ...query,
//       lang: Cookies.get('lang') || 'en'  // 添加语言参数
//     }
//   })
// }


// // 新增
// export function addBanner (data) {
//   return request({
//     url: '/system/product/upload',
//     method: 'post',
//     data: {
//       ...data,
//       lang: Cookies.get('lang') || 'en'  // 添加语言参数
//     }
//   })
// }

// 查询列表
export function listBanner (query) {
  return request({
    url: '/system/product/list',
    method: 'get',
    params: query
  })
}


// 新增
export function addBanner (data) {
  return request({
    url: '/system/product/upload',
    method: 'post',
    data: data
  })
}

// 修改
// export function updateBanner (data) {
//   return request({
//     url: '/system/product/update',
//     method: 'put',
//     data: data
//   })
// }

export function updateBanner (data) {
  return request({
    url: '/system/product/updateProduct',
    method: 'put',
    data: data
  })
}





// 删除
export function delBanner (Id) {
  return request({
    url: '/system/product/' + Id,
    method: 'delete'
  })
}
