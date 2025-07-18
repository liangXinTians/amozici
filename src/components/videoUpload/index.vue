<template>
  <div class="component-upload-video">
    <el-upload multiple list-type="picture-card" :before-upload="handleBeforeUpload" :limit="limit"
      :on-exceed="handleExceed" :before-remove="handleDelete" :show-file-list="true" :file-list="fileList"
      :on-preview="handleVideoPreview" :class="{ hide: fileList.length >= limit }" :auto-upload="false"
      :on-change="handleFileChange">
      <el-icon class="avatar-uploader-icon">
        <plus />
      </el-icon>
    </el-upload>

    <!-- 上传提示 -->
    <div class="el-upload__tip" v-if="showTip">
      请选择
      <template v-if="fileSize">
        大小不超过 <b style="color: #f56c6c">{{ fileSize }}MB</b>
      </template>
      <template v-if="fileType">
        格式为 <b style="color: #f56c6c">{{ fileType.join("/") }}</b>
      </template>
      的视频文件
    </div>

    <!-- 视频预览对话框 -->
    <el-dialog v-model="dialogVisible" title="视频预览" width="800px" append-to-body>
      <video 
        v-if="dialogVideoUrl" 
        :src="dialogVideoUrl" 
        controls 
        style="display: block; max-width: 100%; margin: 0 auto"
        @loadedmetadata="handleVideoLoaded"
      >
        您的浏览器不支持视频播放
      </video>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'

const props = defineProps({
  modelValue: [Object, Array], // 接收File对象或File数组
  limit: {
    type: Number,
    default: 1,
  },
  fileSize: {
    type: Number,
    default: 50, // 视频文件通常较大，默认50MB
  },
  fileType: {
    type: Array,
    default: () => ["mp4", "avi", "mov", "wmv", "flv", "webm", "mkv"],
  },
  isShowTip: {
    type: Boolean,
    default: true
  },
  // 新增：初始视频URL，用于编辑时显示已有视频
  initialUrl: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'file-changed'])
const dialogVideoUrl = ref("")
const dialogVisible = ref(false)
const fileList = ref([])
const hasFileChanged = ref(false) // 标识文件是否有变化

const showTip = computed(
  () => props.isShowTip && (props.fileType || props.fileSize)
)

// 初始化文件列表
async function initFileList () {
  if (props.initialUrl) {
    // 为初始视频也生成缩略图
    let thumbnailUrl = props.initialUrl
    
    try {
      // 如果是视频文件，尝试生成缩略图
      if (props.initialUrl.includes('video') || /\.(mp4|avi|mov|wmv|flv|webm|mkv)$/i.test(props.initialUrl)) {
        // 对于已存在的视频URL，我们可以创建一个临时video元素来生成缩略图
        const response = await fetch(props.initialUrl)
        const blob = await response.blob()
        thumbnailUrl = await generateVideoThumbnail(new File([blob], 'video', { type: blob.type }))
      }
    } catch (error) {
      console.warn('初始视频缩略图生成失败:', error)
      thumbnailUrl = props.initialUrl
    }
    
    fileList.value = [{
      name: '当前视频',
      url: props.initialUrl,
      uid: Date.now(),
      isInitial: true,
      thumbUrl: thumbnailUrl,
      percentage: 100,
      status: 'success'
    }]
    hasFileChanged.value = false
  } else {
    fileList.value = []
    hasFileChanged.value = false
  }
}

// 生成视频缩略图
function generateVideoThumbnail(file) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    video.crossOrigin = 'anonymous'
    video.muted = true
    
    const cleanup = () => {
      if (video.src) {
        URL.revokeObjectURL(video.src)
      }
    }
    
    video.addEventListener('loadedmetadata', () => {
      // 设置canvas尺寸，限制最大尺寸以提高性能
      const maxSize = 300
      let { videoWidth, videoHeight } = video
      
      if (videoWidth > videoHeight) {
        if (videoWidth > maxSize) {
          videoHeight = (videoHeight * maxSize) / videoWidth
          videoWidth = maxSize
        }
      } else {
        if (videoHeight > maxSize) {
          videoWidth = (videoWidth * maxSize) / videoHeight
          videoHeight = maxSize
        }
      }
      
      canvas.width = videoWidth
      canvas.height = videoHeight
      
      // 设置视频时间为0.5秒，避免黑屏
      video.currentTime = 0.5
    })
    
    video.addEventListener('seeked', () => {
      try {
        // 将视频帧绘制到canvas上
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        // 将canvas转换为blob URL
        canvas.toBlob((blob) => {
          if (blob) {
            const thumbnailUrl = URL.createObjectURL(blob)
            cleanup()
            resolve(thumbnailUrl)
          } else {
            cleanup()
            reject(new Error('无法生成缩略图'))
          }
        }, 'image/jpeg', 0.8)
      } catch (error) {
        cleanup()
        reject(error)
      }
    })
    
    video.addEventListener('error', (error) => {
      cleanup()
      reject(error)
    })
    
    // 设置超时
    setTimeout(() => {
      cleanup()
      reject(new Error('生成缩略图超时'))
    }, 10000)
    
    video.src = URL.createObjectURL(file)
    video.load()
  })
}

// 处理文件选择变化
async function handleFileChange (file, files) {
  console.log('文件变化:', file, files)

  // 过滤不符合要求的文件
  const validFiles = files.filter(f => f.raw && validateFile(f.raw))

  // 更新fileList（仅存储必要信息用于显示）
  const fileListPromises = validFiles.map(async f => {
    const videoUrl = URL.createObjectURL(f.raw)
    let thumbnailUrl = null
    
    try {
      thumbnailUrl = await generateVideoThumbnail(f.raw)
      console.log('生成缩略图成功:', thumbnailUrl)
    } catch (error) {
      console.error('生成缩略图失败:', error)
      // 使用默认的视频图标或者视频URL
      thumbnailUrl = videoUrl
    }
    
    return {
      name: f.name,
      url: videoUrl, // 用于预览
      raw: f.raw, // 保留原始File对象
      uid: f.uid,
      isInitial: false, // 标记这是新上传的文件
      // Element Plus Upload 组件需要的字段
      thumbUrl: thumbnailUrl, // 缩略图URL
      percentage: 100, // 上传进度
      status: 'success' // 文件状态
    }
  })

  fileList.value = await Promise.all(fileListPromises)
  console.log('更新后的fileList:', fileList.value)

  // 标记文件已变化
  hasFileChanged.value = true
  emit('file-changed', true)

  // 向父组件传递原始File对象
  updateModelValue()
}

// 更新modelValue（直接返回file.raw）
function updateModelValue () {
  console.log('更新modelValue')
  if (props.limit === 1) {
    const validFile = fileList.value.find(f => f.raw) // 只取有raw属性的文件（新上传的）
    const fileObj = validFile?.raw || null
    console.log('传递给父组件的原始File对象:', fileObj)
    emit("update:modelValue", fileObj)
  } else {
    const fileArray = fileList.value.filter(f => f.raw).map(f => f.raw)
    console.log('传递给父组件的原始File数组:', fileArray)
    emit("update:modelValue", fileArray)
  }
}

// 验证文件类型和大小
function validateFile (file) {
  const isValidType = props.fileType.length === 0 ||
    props.fileType.some(type =>
      file.type.includes(type) ||
      file.name.toLowerCase().endsWith(`.${type}`)
    )
  const isValidSize = file.size / 1024 / 1024 < props.fileSize

  if (!isValidType) {
    console.error(`文件格式不正确, 请上传${props.fileType.join("/")}视频格式文件!`)
  }
  if (!isValidSize) {
    console.error(`文件大小不能超过 ${props.fileSize} MB!`)
  }

  return isValidType && isValidSize
}

// 文件选择前的验证
function handleBeforeUpload (file) {
  console.log('验证文件:', file)
  if (!validateFile(file)) {
    return false
  }
  return false // 返回false阻止自动上传
}

// 文件数量超出限制
function handleExceed () {
  console.error(`选择文件数量不能超过 ${props.limit} 个!`)
}

// 删除视频
function handleDelete (file) {
  console.log('删除文件:', file)

  const index = fileList.value.findIndex(f => f.uid === file.uid)
  if (index > -1) {
    const deletedFile = fileList.value[index]

    // 如果删除的是初始视频，标记为已变化
    if (deletedFile.isInitial) {
      hasFileChanged.value = true
      emit('file-changed', true)
    }

    // 释放预览URL（但不释放初始URL）
    if (deletedFile.url && !deletedFile.isInitial) {
      URL.revokeObjectURL(deletedFile.url)
    }
    if (deletedFile.thumbUrl && !deletedFile.isInitial) {
      URL.revokeObjectURL(deletedFile.thumbUrl)
    }

    // 从列表中移除
    fileList.value.splice(index, 1)

    // 更新父组件
    updateModelValue()
  }
  return false // 阻止默认删除行为
}

// 预览视频
function handleVideoPreview (file) {
  dialogVideoUrl.value = file.url
  dialogVisible.value = true
}

// 视频加载完成后的处理
function handleVideoLoaded (event) {
  const video = event.target
  console.log('视频信息:', {
    duration: video.duration,
    width: video.videoWidth,
    height: video.videoHeight
  })
}

// 监听initialUrl变化（用于编辑不同数据时）
watch(() => props.initialUrl, async (newUrl) => {
  console.log('initialUrl变化:', newUrl)
  await initFileList()
}, { immediate: true })

// 监听外部modelValue变化
watch(() => props.modelValue, (newVal) => {
  if (!newVal || (Array.isArray(newVal) && newVal.length === 0)) {
    // 如果没有新文件且没有初始URL，清空列表
    if (!props.initialUrl) {
      // 释放所有预览URL
      fileList.value.forEach(file => {
        if (file.url && !file.isInitial) {
          URL.revokeObjectURL(file.url)
        }
        if (file.thumbUrl && !file.isInitial) {
          URL.revokeObjectURL(file.thumbUrl)
        }
      })
      fileList.value = []
      hasFileChanged.value = false
      emit('file-changed', false)
    }
  }
})

// 组件卸载时释放所有URL
onBeforeUnmount(() => {
  fileList.value.forEach(file => {
    if (file.url && !file.isInitial) {
      URL.revokeObjectURL(file.url)
    }
    if (file.thumbUrl && !file.isInitial) {
      URL.revokeObjectURL(file.thumbUrl)
    }
  })
})
</script>

<style scoped lang="scss">
:deep(.hide .el-upload--picture-card) {
  display: none;
}

// 视频缩略图样式
:deep(.el-upload-list--picture-card .el-upload-list__item) {
  position: relative;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  
  .el-upload-list__item-thumbnail {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 6px;
  }
  
  // 添加播放按钮图标
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 40px;
    height: 40px;
    background: rgba(0, 0, 0, 0.7);
    border-radius: 50%;
    background-image: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>');
    background-repeat: no-repeat;
    background-position: center;
    background-size: 20px 20px;
    pointer-events: none;
    z-index: 1;
  }
  
  // 鼠标悬停效果
  &:hover::after {
    background: rgba(0, 0, 0, 0.8);
  }
}

// 确保上传列表正确显示
:deep(.el-upload-list--picture-card) {
  .el-upload-list__item {
    width: 148px;
    height: 148px;
    margin: 0 8px 8px 0;
    
    .el-upload-list__item-thumbnail {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
}

// 视频预览样式
:deep(.el-dialog__body) {
  padding: 20px;
  text-align: center;
}

// 视频元素样式
video {
  max-height: 400px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>