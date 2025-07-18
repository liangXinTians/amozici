<template>
  <div class="component-upload-image">
    <el-upload multiple list-type="picture-card" :before-upload="handleBeforeUpload" :limit="limit"
      :on-exceed="handleExceed" :before-remove="handleDelete" :show-file-list="true" :file-list="fileList"
      :on-preview="handlePictureCardPreview" :class="{ hide: fileList.length >= limit }" :auto-upload="false"
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
      的文件
    </div>

    <el-dialog v-model="dialogVisible" title="预览" width="800px" append-to-body>
      <img :src="dialogImageUrl" style="display: block; max-width: 100%; margin: 0 auto" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'

const props = defineProps({
  modelValue: [Array], // 只接收File数组
  limit: {
    type: Number,
    default: 5, // 默认支持5张图片
  },
  fileSize: {
    type: Number,
    default: 10,
  },
  fileType: {
    type: Array,
    default: () => ["png", "jpg", "jpeg"],
  },
  isShowTip: {
    type: Boolean,
    default: true
  },
  // 修改：初始图片URLs数组，用于编辑时显示已有图片
  initialUrls: {
    type: Array,
    default: () => []
  },
  // 新增：原始图片路径数组，用于传递给后端
  originalPaths: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'file-changed'])
const dialogImageUrl = ref("")
const dialogVisible = ref(false)
const fileList = ref([])
const hasFileChanged = ref(false) // 标识文件是否有变化

const showTip = computed(
  () => props.isShowTip && (props.fileType || props.fileSize)
)

// 初始化文件列表
function initFileList () {
  fileList.value = []
  
  // 添加初始图片到fileList
  if (props.initialUrls && props.initialUrls.length > 0) {
    props.initialUrls.forEach((url, index) => {
      fileList.value.push({
        name: `图片${index + 1}`,
        url: url,
        uid: `initial-${Date.now()}-${index}`, // 给一个唯一标识
        isInitial: true, // 标记这是初始图片
        originalPath: props.originalPaths[index] || url // 保存原始路径
      })
    })
  }
  
  hasFileChanged.value = false
  // 初始化时通知父组件
  notifyParent()
}

// 处理文件选择变化
function handleFileChange (file, files) {
  console.log('文件变化:', file, files)

  // 过滤出有效文件（新上传的文件）
  const newFiles = files.filter(f => f.raw && validateFile(f.raw))
  
  // 获取现有的初始图片
  const initialFiles = fileList.value.filter(f => f.isInitial)
  
  // 检查总数是否超过限制
  const totalCount = initialFiles.length + newFiles.length
  if (totalCount > props.limit) {
    ElMessage.warning(`最多只能上传${props.limit}张图片`)
    return
  }

  // 重新构建fileList：初始图片 + 新上传的文件
  fileList.value = [
    ...initialFiles,
    ...newFiles.map(f => ({
      name: f.name,
      url: URL.createObjectURL(f.raw), // 用于预览
      raw: f.raw, // 保留原始File对象
      uid: f.uid,
      isInitial: false // 标记这是新上传的文件
    }))
  ]

  // 标记文件已变化
  hasFileChanged.value = true
  
  // 向父组件传递原始File对象数组
  updateModelValue()
  // 通知父组件变化详情
  notifyParent()
}

// 通知父组件变化详情
function notifyParent () {
  const unchangedFiles = fileList.value.filter(f => f.isInitial)
  const newFiles = fileList.value.filter(f => !f.isInitial && f.raw)
  
  const changeInfo = {
    hasChanged: hasFileChanged.value,
    unchangedUrls: unchangedFiles.map(f => f.url),
    unchangedPaths: unchangedFiles.map(f => f.originalPath),
    newFiles: newFiles.map(f => f.raw)
  }
  
  console.log('通知父组件变化详情:', changeInfo)
  emit('file-changed', changeInfo)
}

// 更新modelValue（返回File数组）
function updateModelValue () {
  console.log('更新modelValue')
  const fileArray = fileList.value.filter(f => f.raw).map(f => f.raw)
  console.log('传递给父组件的原始File数组:', fileArray)
  emit("update:modelValue", fileArray)
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
    ElMessage.error(`文件格式不正确, 请上传${props.fileType.join("/")}图片格式文件!`)
  }
  if (!isValidSize) {
    ElMessage.error(`文件大小不能超过 ${props.fileSize} MB!`)
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
  ElMessage.warning(`选择文件数量不能超过 ${props.limit} 个!`)
}

// 删除图片
function handleDelete (file) {
  console.log('删除文件:', file)

  const index = fileList.value.findIndex(f => f.uid === file.uid)
  if (index > -1) {
    const deletedFile = fileList.value[index]

    // 如果删除的是初始图片或者新上传的图片，都标记为已变化
    hasFileChanged.value = true
    
    // 从列表中移除
    fileList.value.splice(index, 1)

    // 更新父组件
    updateModelValue()
    // 通知父组件变化详情
    notifyParent()
  }
  return false // 阻止默认删除行为
}

// 预览图片
function handlePictureCardPreview (file) {
  dialogImageUrl.value = file.url
  dialogVisible.value = true
}

// 监听initialUrls变化（用于编辑不同数据时）
watch([() => props.initialUrls, () => props.originalPaths], ([newUrls, newPaths]) => {
  console.log('initialUrls变化:', newUrls)
  console.log('originalPaths变化:', newPaths)
  initFileList()
}, { 
  immediate: true, 
  deep: true // 深度监听数组变化
})

// 监听外部modelValue变化
watch(() => props.modelValue, (newVal) => {
  if (!newVal || (Array.isArray(newVal) && newVal.length === 0)) {
    // 如果没有新文件，只保留初始图片
    const initialFiles = fileList.value.filter(f => f.isInitial)
    
    // 释放新上传文件的预览URL
    fileList.value.forEach(file => {
      if (file.url && !file.isInitial) {
        URL.revokeObjectURL(file.url)
      }
    })
    
    fileList.value = initialFiles
    
    // 如果没有初始图片，重置变化标记
    if (initialFiles.length === 0) {
      hasFileChanged.value = false
    }
    
    // 通知父组件变化详情
    notifyParent()
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
</style>