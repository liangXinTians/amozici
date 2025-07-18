<template>
  <div class="app-container">
    <el-card shadow="never">
      <div class="mb-10px">
        <div>
          <el-select v-model="queryParams.type" placeholder="Select" clearable
            style="width: 240px;margin-right: 10px;">
            <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
          <el-input v-model="queryParams.title" placeholder="请输入标题" style="width: 200px;margin-right: 10px;" />
          <el-button type="primary" @click="handleQuery()">查询</el-button>
        </div>
        <div>
          <el-button type="success" icon="plus" @click="handleOpenDialog()">增加</el-button>
        </div>
      </div>

      <el-table ref="dataTableRef" v-loading="loading" :data="roleList" border
        @selection-change="handleSelectionChange">
        <!-- <el-table-column type="selection" width="55" align="center" /> -->
        <el-table-column label="序号" prop="sortOrder" min-width="100" align="center" />
        <el-table-column label="ID" prop="id" min-width="100" align="center" />
        <el-table-column label="标题" prop="title" min-width="100" align="center" />
        <el-table-column label="图片" prop="imageUrl" min-width="150" align="center">
          <template #default="scope">
            <!-- 显示多个图片 -->
            <div v-if="scope.row.imageUrl" class="image-container">
              <template v-if="Array.isArray(scope.row.imageUrl)">
                <el-image 
                  v-for="(image, index) in scope.row.imageUrl" 
                  :key="index"
                  :src="`${baseUrl}${image}`" 
                  style="width: 50px; height: 50px; object-fit: contain; margin: 2px;"
                  :preview-src-list="scope.row.imageUrl.map(img => `${baseUrl}${img}`)" 
                  hide-on-click-modal 
                  preview-teleported 
                />
              </template>
              <template v-else>
                <el-image 
                  :src="`${baseUrl}${scope.row.imageUrl}`" 
                  style="width: 60px; height: 60px; object-fit: contain;"
                  :preview-src-list="[`${baseUrl}${scope.row.imageUrl}`]" 
                  hide-on-click-modal 
                  preview-teleported 
                />
              </template>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" prop="createTime" min-width="100" align="center" />
        <el-table-column label="更新时间" prop="updateTime" min-width="100" align="center" />
        <el-table-column fixed="right" label="操作" width="220" align="center">
          <template #default="scope">
            <el-button type="primary" size="small" link icon="edit" @click="handleOpenDialog(scope.row)">
              编辑
            </el-button>
            <el-button type="danger" size="small" link icon="delete" @click="handleDelete(scope.row.id)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-if="total > 0" v-model:total="total" v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize" @pagination="handleQuery" />

    </el-card>

    <!-- 角色表单弹窗 -->
    <el-dialog v-model="dialog.visible" :title="dialog.title" width="1000px" @close="handleCloseDialog">
      <el-form ref="roleFormRef" :model="formData" :rules="rules" label-width="100px">
        <el-form-item label="类型：" prop="type">
          <el-select v-model="formData.type" placeholder="Select" style="width: 240px">
            <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="标题：" prop="title">
          <el-input v-model="formData.title" style="width: 240px" />
        </el-form-item>
        <el-form-item label="封面图：" prop="files">
          <imageUploads 
            v-model="formData.files" 
            :limit="5" 
            :initial-urls="formData.initialImageUrls"
            :original-paths="formData.originalImagePaths"
            @file-changed="handleFileChanged" 
          />
        </el-form-item>

        <el-form-item label="排序：" prop="sortOrder">
          <el-input-number v-model="formData.sortOrder" controls-position="right" :min="0" style="width: 100px" />
        </el-form-item>

      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="handleSubmit">确 定</el-button>
          <el-button @click="handleCloseDialog">取 消</el-button>
        </div>
      </template>
    </el-dialog>

  </div>
</template>

<script>
export default {
  name: 'banner',
  inheritAttrs: false
}
</script>
<script setup>
import { ElMessage, ElMessageBox } from 'element-plus'
// import imageUploads from '@/components/oneImageUpload/index.vue'
import imageUploads from '@/components/ImageUploads/index.vue'

import { getCurrentInstance, ref, reactive, computed } from 'vue'
import { listBanner, addBanner, updateBanner, delBanner } from "@/api/productTest/index.js"
import WangEditor from "@/components/WangEditor/index.vue"
import Cookies from 'js-cookie'

// 获取环境变量中的基础URL
const baseUrl = import.meta.env.VITE_APP_BASE_API || 'https://www.amozici.com'

const queryFormRef = ref()
const roleFormRef = ref()
const permTreeRef = ref()

const loading = ref(false)
const ids = ref([])
const total = ref(0)

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  type: '',
  title: '',
  lang: Cookies.get('lang') || 'en',
})

// 搜索选择框
const value = ref('')

const options = [
  {
    value: '1',
    label: 'Download Center',
  },
  {
    value: '2',
    label: 'Free Sex Toy Testing',
  },
  {
    value: '3',
    label: 'To Experience The Product',
  },
  {
    value: '4',
    label: 'The Comments Section',
  },
]

// 角色表格数据
const roleList = ref()

// 弹窗
const dialog = reactive({
  title: "",
  visible: false,
})

// 新增表单 - 修改为支持多文件
const formData = reactive({
  id: '',
  type: '',
  title: '',
  sortOrder: '',
  files: [], // 改为数组
  initialImageUrls: [], // 用于编辑时显示原有图片数组
  originalImagePaths: [], // 存储原始图片的相对路径
})

// 标识图片是否有变化
const imageChanged = ref(false)
// 存储未修改的图片URLs和新上传的文件
const unchangedImageUrls = ref([])
const newUploadedFiles = ref([])

const rules = reactive({
  files: [{ required: false, message: "请上传封面图", trigger: "blur" }],
  type: [{ required: true, message: "请选择类型", trigger: "blur" }],
  title: [{ required: true, message: "请输入标题", trigger: "blur" }],
})

// 查询
function handleQuery() {
  loading.value = true;
  listBanner(queryParams)
    .then((data) => {
      console.log(data, 'data');
      
      // 将 imageUrl 字符串转为数组
      const processedData = data.rows.map(item => ({
        ...item,
        imageUrl: item.imageUrl ? item.imageUrl.split(',') : []
      }));

      roleList.value = processedData; // 使用处理后的数据
      total.value = data.total;
    })
    .finally(() => {
      loading.value = false;
    });
}

// 行复选框选中
function handleSelectionChange (selection) {
  ids.value = selection.map((item) => item.id)
}

// 打开弹窗
function handleOpenDialog (data) {
  console.log(data, 'data')
  dialog.visible = true
  imageChanged.value = false

  if (data && data.id) {
    dialog.title = "修改"

    // 设置表单数据
    formData.id = data.id
    formData.type = data.type
    formData.title = data.title
    formData.sortOrder = data.sortOrder
    formData.files = [] // 编辑时先清空files数组
    
    // 处理初始图片URLs和原始路径
    if (data.imageUrl) {
      if (Array.isArray(data.imageUrl)) {
        formData.initialImageUrls = data.imageUrl.map(img => `${baseUrl}${img}`)
        formData.originalImagePaths = [...data.imageUrl] // 保存原始相对路径
      } else {
        formData.initialImageUrls = [`${baseUrl}${data.imageUrl}`]
        formData.originalImagePaths = [data.imageUrl] // 保存原始相对路径
      }
    } else {
      formData.initialImageUrls = []
      formData.originalImagePaths = []
    }
    console.log('初始图片URLs:', formData.initialImageUrls)
    console.log('原始图片路径:', formData.originalImagePaths)

    // 重置变化跟踪
    unchangedImageUrls.value = [...formData.initialImageUrls]
    newUploadedFiles.value = []
    console.log('files', formData.files)
    console.log('编辑数据:', data)
    console.log('初始图片URLs:', formData.initialImageUrls)
    console.log('原始图片路径:', formData.originalImagePaths)
  } else {
    dialog.title = "新增"
    // 重置表单数据
    formData.id = ''
    formData.type = ''
    formData.title = ''
    formData.files = []
    formData.sortOrder = ''
    formData.initialImageUrls = []
    formData.originalImagePaths = []
    unchangedImageUrls.value = []
    newUploadedFiles.value = []
  }
}

// 处理图片变化 - 接收详细的变化信息
function handleFileChanged (changeInfo) {
  imageChanged.value = changeInfo.hasChanged
  unchangedImageUrls.value = changeInfo.unchangedUrls || []
  newUploadedFiles.value = changeInfo.newFiles || []
  
  console.log('图片变化信息:', changeInfo)
  console.log('未修改的图片URLs:', unchangedImageUrls.value)
  console.log('新上传的文件:', newUploadedFiles.value)
}

// 新增/编辑提交
function handleSubmit () {
  console.log('提交表单:', formData)
  console.log('图片是否变化:', imageChanged.value)

  roleFormRef.value.validate((valid) => {
    if (valid) {
      // 编辑时如果没有上传新图片且没有初始图片，则验证失败
      // if (dialog.title === "修改" && (!formData.files || formData.files.length === 0) && formData.initialImageUrls.length === 0) {
      //   ElMessage.error("请至少上传一张图片")
      //   return
      // }

      // // 新增时必须有图片
      // if (dialog.title === "新增" && (!formData.files || formData.files.length === 0)) {
      //   ElMessage.error("请至少上传一张图片")
      //   return
      // }

      loading.value = true

      if (dialog.title === "修改") {
        const formDatas = new FormData()
        formDatas.append('id', formData.id)
        formDatas.append('type', formData.type)
        formDatas.append('title', formData.title)
        formDatas.append('sortOrder', formData.sortOrder)

        // 处理未修改的图片URLs
        if (unchangedImageUrls.value.length > 0) {
          // 将完整URL转换为相对路径
          const unchangedPaths = unchangedImageUrls.value.map(url => {
            // 从完整URL中提取相对路径
            const index = formData.initialImageUrls.indexOf(url)
            return index !== -1 ? formData.originalImagePaths[index] : url.replace(baseUrl, '')
          })
          formDatas.append('preserveUrls', JSON.stringify(unchangedPaths))
          console.log('未修改的图片相对路径:', unchangedPaths)
        }

        // 处理新上传的文件
        if (newUploadedFiles.value.length > 0) {
          newUploadedFiles.value.forEach((file, index) => {
            formDatas.append('files', file)
          })
          console.log('新上传的文件数量:', newUploadedFiles.value.length)
        }
        console.log('修改时提交的formDatas', formDatas)
        console.log('修改时提交的formData', formData)

        updateBanner(formDatas)
          .then(() => {
            ElMessage.success("修改成功")
            handleCloseDialog()
            handleQuery()
          })
          .finally(() => (loading.value = false))
      } else {
        console.log('新增formData', formData)
        const formDatas = new FormData()
        formDatas.append('type', formData.type)
        formDatas.append('title', formData.title)
        formDatas.append('sortOrder', formData.sortOrder)
        formDatas.append('lang', Cookies.get('lang') || 'en')
        
        // 添加多个文件
        if (formData.files && formData.files.length > 0) {
          formData.files.forEach((file, index) => {
            formDatas.append('files', file) // 使用同名字段传递多个文件
          })
          console.log('新增时添加图片数量:', formData.files.length)
        }

        addBanner(formDatas)
          .then(() => {
            ElMessage.success("新增成功")
            handleCloseDialog()
            handleQuery()
          })
          .finally(() => (loading.value = false))
      }
    }
  })
}

// 关闭弹窗
function handleCloseDialog () {
  dialog.visible = false

  roleFormRef.value.resetFields()
  roleFormRef.value.clearValidate()

  // 重置表单数据
  formData.id = ''
  formData.type = ''
  formData.title = ''
  formData.files = []
  formData.sortOrder = ''
  formData.initialImageUrls = []
  formData.originalImagePaths = []
  imageChanged.value = false
  unchangedImageUrls.value = []
  newUploadedFiles.value = []
}

// 删除
function handleDelete (roleId) {
  ElMessageBox.confirm("确认删除已选中的数据项?", "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(
    () => {
      loading.value = true
      delBanner(roleId)
        .then(() => {
          ElMessage.success("删除成功")
          handleQuery()
        })
        .finally(() => (loading.value = false))
    },
    () => {
      ElMessage.info("已取消删除")
    }
  )
}

onMounted(() => {
  handleQuery()
})
</script>

<style lang="scss" scoped>
.mb-10px {
  width: 100%;
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.image-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
}
</style>