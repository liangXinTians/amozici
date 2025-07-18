import request from "@/utils/request"

// 公共请求的方法

/** 上传文件的方法 */
export function uploadFiles (data) {
  return request({
    headers: {
      "Content-Type": "multipart/form-data",
      isToken: false
    },
    url: "/upload",
    method: "post",
    data,
  })
}

// article页面的富文本上传图片
export function articleUploadFiles (data) {
  return request({
    headers: {
      "Content-Type": "multipart/form-data",
      // isToken: false
    },
    url: "/system/article/upload",
    method: "post",
    data,
  })
}


