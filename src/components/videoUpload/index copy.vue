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
    default: 2000, // 视频文件通常较大
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
function initFileList () {
  if (props.initialUrl) {
    fileList.value = [{
      name: '当前视频',
      url: props.initialUrl,
      uid: Date.now(), // 给一个唯一标识
      isInitial: true // 标记这是初始视频
    }]
    hasFileChanged.value = false
  } else {
    fileList.value = []
    hasFileChanged.value = false
  }
}

// 处理文件选择变化
function handleFileChange (file, files) {
  console.log('文件变化:', file, files)

  // 过滤不符合要求的文件
  const validFiles = files.filter(f => f.raw && validateFile(f.raw))

  // 更新fileList（仅存储必要信息用于显示）
  fileList.value = validFiles.map(f => ({
    name: f.name,
    url: URL.createObjectURL(f.raw), // 用于预览
    raw: f.raw, // 保留原始File对象
    uid: f.uid,
    isInitial: false // 标记这是新上传的文件
  }))

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
watch(() => props.initialUrl, (newUrl) => {
  console.log('initialUrl变化:', newUrl)
  initFileList()
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
  })
})
</script>

<style scoped lang="scss">
:deep(.hide .el-upload--picture-card) {
  display: none;
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