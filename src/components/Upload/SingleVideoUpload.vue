<template>
  <el-upload v-model:file-list="fileList" list-type="text" :before-upload="handleBeforeUpload"
    :http-request="handleUpload" :on-success="handleSuccess" :on-error="handleError" :accept="props.accept" :limit="1">
    <el-button type="primary">
      <el-icon>
        <Upload />
      </el-icon>
      点击上传视频
    </el-button>
    <template #tip>
      <div class="el-upload__tip">
        支持格式：mp4/webm/ogg，大小不超过 {{ props.maxFileSize }}MB
      </div>
    </template>
  </el-upload>
</template>

<script setup>
import { defineProps, defineModel, ref } from 'vue'
import FileAPI from "@/api/file.api"
import { ElMessage } from "element-plus"

const props = defineProps({
  maxFileSize: {
    type: Number,
    default: 100 // 默认允许100MB
  },
  accept: {
    type: String,
    default: "video/mp4,video/webm,video/ogg"
  }
})

const modelValue = defineModel()

const fileList = ref(modelValue.value ? [{ url: modelValue.value }] : [])

const handleBeforeUpload = (file) => {
  // 文件类型校验
  const validTypes = props.accept.split(',')
  if (!validTypes.includes(file.type)) {
    ElMessage.error('视频格式不支持')
    return false
  }

  // 文件大小校验
  if (file.size > props.maxFileSize * 1024 * 1024) {
    ElMessage.error(`视频大小不能超过${props.maxFileSize}MB`)
    return false
  }

  return true
}

const handleUpload = async (options) => {
  const formData = new FormData()
  formData.append('file', options.file)
  try {
    const res = await FileAPI.upload(formData)
    return res
  } catch (error) {
    return Promise.reject(error)
  }
}

const handleSuccess = (response) => {
  modelValue.value = response.url
  ElMessage.success('视频上传成功')
}

const handleError = () => {
  ElMessage.error('视频上传失败')
}
</script>