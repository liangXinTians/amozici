<template>
  <div class="app-container">
    <el-card shadow="never">
      <div class="mb-10px">
        <div>
          <el-input v-model="queryParams.orderNo" placeholder="请输入订单号" style="width: 200px;margin-right: 10px;" />
          <el-input v-model="queryParams.contact_email" placeholder="请输入邮箱" style="width: 200px;margin-right: 10px;" />

          <el-button type="primary" @click="handleQuery()">查询</el-button>
        </div>
        <div>
          <!-- <el-button type="success" icon="plus" @click="handleOpenDialog()">增加</el-button> -->
        </div>

      </div>

      <el-table ref="dataTableRef" v-loading="loading" :data="roleList" border
        @selection-change="handleSelectionChange">
        <el-table-column label="ID" prop="id" min-width="100" align="center" />
        <el-table-column label="订单号" prop="orderNo" min-width="100" align="center" />
        <el-table-column label="联系人邮箱" prop="contactEmail" min-width="100" align="center" />
        <el-table-column label="创建时间" prop="createTime" min-width="100" align="center" />
        <el-table-column label="更新时间" prop="updateTime" min-width="100" align="center" />
        <el-table-column fixed="right" label="操作" width="220" align="center">
          <template #default="scope">
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
        <!-- <el-form-item label="标题：" prop="title">
          <el-input v-model="formData.title" style="width: 240px" />
        </el-form-item>
        <el-form-item label="摘要：" prop="summary">
          <el-input v-model="formData.summary" style="width: 240px" />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <WangEditor v-model="formData.content" height="400px" />
        </el-form-item>

        <el-form-item label="排序：" prop="sortOrder">
          <el-input-number v-model="formData.sortOrder" controls-position="right" :min="0" style="width: 100px" />
        </el-form-item> -->
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
// import SingleImageUpload from '@/components/Upload/SingleImageUpload'
import imageUpload from '@/components/ImageUpload/index.vue'
import imageUploads from '@/components/oneImageUpload/index.vue'

import { getCurrentInstance, ref, reactive, computed } from 'vue'
import { listBanner, addBanner, updateBanner, delBanner } from "@/api/sellerInfo/index.js"
import WangEditor from "@/components/WangEditor/index.vue"
import Cookies from 'js-cookie'

// 获取环境变量中的基础URL
const baseUrl = import.meta.env.VITE_IMG_BASE_API || 'https://www.amozici.com'

const queryFormRef = ref()
const roleFormRef = ref()
const permTreeRef = ref()

const loading = ref(false)
const ids = ref([])
const total = ref(0)

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  lang: Cookies.get('lang') || 'en',
  orderNo: '',
  contact_email:''
})
// 搜索选择框
const value = ref('')

const options = [
]

// 角色表格数据
const roleList = ref()

// 弹窗
const dialog = reactive({
  title: "",
  visible: false,
})

// 新增表单
const formData = reactive({
  id: '',
  title: '',
  summary: '',
  content: '',
  sortOrder: '',
})

// 标识图片是否有变化
const imageChanged = ref(false)

const rules = reactive({
  // file: [{ required: false, message: "请上传封面图", trigger: "blur" }], // 编辑时不强制要求
  // type: [{ required: true, message: "请选择状态", trigger: "blur" }],
  // categoryId: [{ required: true, message: "请选择类型", trigger: "blur" }],
  // detail: [{ required: true, message: "请输入内容", trigger: "blur" }],
  // title: [{ required: true, message: "请输入标题", trigger: "blur" }],
})


// 查询
function handleQuery () {
  loading.value = true
  listBanner(queryParams)
    .then((data) => {
      console.log(data, 'data')
      roleList.value = data.rows
      total.value = data.total
    })
    .finally(() => {
      loading.value = false
    })
}

// 行复选框选中
function handleSelectionChange (selection) {
  ids.value = selection.map((item) => item.id)
}

// 打开弹窗
function handleOpenDialog (data) {
  dialog.visible = true
  imageChanged.value = false // 重置图片变化标识

  if (data && data.id) {
    dialog.title = "修改"

    // 设置表单数据
    formData.id = data.id
    formData.summary = data.summary
    formData.title = data.title
    formData.content = data.content
    formData.sortOrder = data.sortOrder
    formData.file = null // 编辑时先清空file
    formData.initialImageUrl = data.images ? `${baseUrl}${data.images}` : '' // 设置初始图片URL

    console.log('编辑数据:', data)
    console.log('初始图片URL:', formData.initialImageUrl)
  } else {
    dialog.title = "新增"
    // 重置表单数据
    formData.summary = ''
    formData.title = ''
    formData.content = ''
    formData.file = null
    formData.sortOrder = ''
    formData.initialImageUrl = ''
  }
}

// 处理图片变化
function handleFileChanged (hasChanged) {
  imageChanged.value = hasChanged
  console.log('图片是否有变化:', imageChanged.value)
}

// 新增/编辑提交
function handleSubmit () {
  console.log('提交表单:', formData)
  console.log('图片是否变化:', imageChanged.value)

  roleFormRef.value.validate((valid) => {
    if (valid) {
      loading.value = true

      if (dialog.title === "修改") {
        const formDatas = new FormData()
        formDatas.append('id', formData.id)
        formDatas.append('summary', formData.summary)
        formDatas.append('title', formData.title)
        formDatas.append('content', formData.content)
        formDatas.append('sortOrder', formData.sortOrder)

        // 只有当图片有变化时才添加file参数
        if (imageChanged.value && formData.file) {
          formDatas.append('file', formData.file)
          console.log('添加新图片到FormData')
        }

        updateBanner(formDatas)
          .then(() => {
            ElMessage.success("修改成功")
            handleCloseDialog()
            handleQuery()
          })
          .finally(() => (loading.value = false))
      } else {
        console.log('formData', formData)
        // const formDatas = new FormData()

        // formDatas.append('orderNo', 1)
        // formDatas.append('contactEmail', '222@com')
        // formDatas.append('lang', Cookies.get('lang') || 'en')
        const formDatas = {
          orderNo: 1,
          contactEmail: '222@com',
          lang: Cookies.get('lang') || 'en'
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
  formData.summary = ''
  formData.title = ''
  formData.content = ''
  formData.file = null
  formData.sortOrder = ''
  formData.initialImageUrl = ''
  imageChanged.value = false
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
</style>