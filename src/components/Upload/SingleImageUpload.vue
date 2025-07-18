<!-- 单图上传组件 -->
<template>
  <el-upload class="single-upload" list-type="picture-card" :show-file-list="false" :accept="props.accept"
    :before-upload="handleBeforeUpload" :http-request="handleUpload" :on-success="onSuccess" :on-error="onError"
    :style="props.style">
    <template #default>
      <div v-if="modelValue" class="image-container">
        <el-image :src="modelValue" fit="cover" />
        <el-icon class="single-upload__delete-btn" @click.stop.prevent="handleDelete">
          <CircleCloseFilled />
        </el-icon>
      </div>
      <el-icon v-else class="single-upload__add-btn">
        <Plus />
      </el-icon>
    </template>
  </el-upload>
</template>

<script setup>
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, CircleCloseFilled } from '@element-plus/icons-vue'
// 修复导入路径 - 根据实际情况调整
import { uploadFiles } from "@/api/file.js"

const props = defineProps({
  /**
   * 请求携带的额外参数
   */
  data: {
    type: Object,
    default: () => ({})
  },
  /**
   * 上传文件的参数名
   */
  name: {
    type: String,
    default: "file"
  },
  /**
   * 最大文件大小（单位：M）
   */
  maxFileSize: {
    type: Number,
    default: 10
  },
  /**
   * 上传图片格式，默认支持所有图片(image/*)，指定格式示例：'.png,.jpg,.jpeg,.gif,.bmp'
   */
  accept: {
    type: String,
    default: "image/*"
  },
  /**
   * 自定义样式，用于设置组件的宽度和高度等其他样式
   */
  style: {
    type: Object,
    default: () => ({
      width: "150px",
      height: "150px"
    })
  }
})

const emit = defineEmits(['update:modelValue'])

const modelValue = defineModel("modelValue", {
  type: String,
  default: ""
})

// 添加响应式状态管理
const uploadState = ref({
  uploading: false,
  error: null
})

/**
 * 限制用户上传文件的格式和大小
 */
function handleBeforeUpload (file) {
  try {
    // 重置错误状态
    uploadState.value.error = null

    // 校验文件类型
    const acceptTypes = props.accept.split(",").map(type => type.trim())

    const isValidType = acceptTypes.some(type => {
      if (type === "image/*") {
        return file.type && file.type.startsWith("image/")
      } else if (type.startsWith(".")) {
        return file.name && file.name.toLowerCase().endsWith(type.toLowerCase())
      } else {
        return file.type === type
      }
    })

    if (!isValidType) {
      ElMessage.warning(`上传文件的格式不正确，仅支持：${props.accept}`)
      return false
    }

    // 限制文件大小
    if (file.size > props.maxFileSize * 1024 * 1024) {
      ElMessage.warning(`上传图片不能大于${props.maxFileSize}M`)
      return false
    }

    uploadState.value.uploading = true
    return true
  } catch (error) {
    console.error('文件验证失败:', error)
    ElMessage.error('文件验证失败')
    return false
  }
}

/**
 * 上传图片
 */
function handleUpload (options) {
  return new Promise((resolve, reject) => {
    try {
      const file = options.file

      if (!file) {
        reject(new Error('文件不存在'))
        return
      }

      const formData = new FormData()
      formData.append(props.name, file)

      // 处理附加参数
      if (props.data && typeof props.data === 'object') {
        Object.keys(props.data).forEach(key => {
          if (props.data[key] !== null && props.data[key] !== undefined) {
            formData.append(key, props.data[key])
          }
        })
      }

      uploadFiles.then(data => {
        uploadState.value.uploading = false
        resolve(data)
      })
        .catch(error => {
          uploadState.value.uploading = false
          uploadState.value.error = error
          reject(error)
        })
    } catch (error) {
      uploadState.value.uploading = false
      uploadState.value.error = error
      reject(error)
    }
  })
}

/**
 * 删除图片
 */
function handleDelete () {
  try {
    modelValue.value = ""
    uploadState.value.error = null
  } catch (error) {
    console.error('删除图片失败:', error)
    ElMessage.error('删除图片失败')
  }
}

/**
 * 上传成功回调
 */
const onSuccess = (fileInfo) => {
  try {
    uploadState.value.uploading = false
    uploadState.value.error = null

    if (fileInfo && fileInfo.url) {
      ElMessage.success("上传成功")
      modelValue.value = fileInfo.url
    } else {
      throw new Error('返回的文件信息不完整')
    }
  } catch (error) {
    console.error('上传成功回调处理失败:', error)
    ElMessage.error('上传处理失败')
  }
}

/**
 * 上传失败回调
 */
const onError = (error) => {
  try {
    uploadState.value.uploading = false
    uploadState.value.error = error

    console.error('上传失败:', error)
    const errorMessage = error?.message || error?.toString() || '上传失败'
    ElMessage.error(`上传失败: ${errorMessage}`)
  } catch (e) {
    console.error('错误处理失败:', e)
    ElMessage.error('上传失败')
  }
}
</script>

<style scoped lang="scss">
.single-upload {
  position: relative;
  overflow: hidden;
  cursor: pointer;
  border: 1px var(--el-border-color) solid;
  border-radius: 5px;

  &:hover {
    border-color: var(--el-color-primary);
  }

  .image-container {
    position: relative;
    width: 100%;
    height: 100%;

    .el-image {
      width: 100%;
      height: 100%;
      display: block;
    }
  }

  &__delete-btn {
    position: absolute;
    top: 2px;
    right: 2px;
    font-size: 16px;
    color: #ff7901;
    cursor: pointer;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 50%;
    padding: 2px;
    z-index: 1;

    &:hover {
      color: #ff4500;
      background: rgba(255, 255, 255, 1);
    }
  }

  &__add-btn {
    font-size: 28px;
    color: var(--el-text-color-secondary);
  }
}

:deep(.el-upload--picture-card) {
  width: v-bind("props.style.width");
  height: v-bind("props.style.height");
  border: none;
}

:deep(.el-upload-dragger) {
  border: none;
}
</style>