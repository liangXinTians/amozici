<template>
  <div class="app-container">
    <el-card shadow="never">
      <div class="mb-10px">

        <div>
          <el-select v-model="queryParams.categoryId" placeholder="Select" clearable
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
        <el-table-column label="图片" prop="images" min-width="100" align="center">
          <template #default="scope">
            <el-image :src="`${baseUrl}${scope.row.images}`" style="width: 60px; height: 60px; object-fit: contain;"
              :preview-src-list="[`${baseUrl}${scope.row.images}`]" hide-on-click-modal preview-teleported />
          </template>
        </el-table-column>
        <el-table-column label="内容" prop="detail" min-width="100" max-width="400" show-overflow-tooltip align="center" />
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
        <el-form-item label="类型：" prop="categoryId">
          <el-select v-model="formData.categoryId" placeholder="Select" style="width: 240px">
            <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="标题：" prop="title">
          <el-input v-model="formData.title" style="width: 240px" />
        </el-form-item>
        <el-form-item label="封面图：" prop="file">
          <imageUploads v-model="formData.file" :limit="1" :initial-url="formData.initialImageUrl"
            @file-changed="handleFileChanged" />
        </el-form-item>
        <!-- <el-form-item label="详情：" prop="file">
          <imageUploads v-model="formData.file" :limit="1" :initial-url="formData.initialImageUrl"
            @file-changed="handleFileChanged" />
        </el-form-item> -->
        <el-form-item label="内容" prop="detail">
          <WangEditor v-model="formData.detail" height="400px" />
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
// import SingleImageUpload from '@/components/Upload/SingleImageUpload'
import imageUpload from '@/components/ImageUpload/index.vue'
import imageUploads from '@/components/oneImageUpload/index.vue'

import { getCurrentInstance, ref, reactive, computed } from 'vue'
import { listBanner, addBanner, updateBanner, delBanner } from "@/api/product/index.js"
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
  categoryId: '',
  title: '',
  lang: Cookies.get('lang') || 'en',


})
// 搜索选择框
const value = ref('')

const options = [
  {
    value: '1',
    label: '女士用品',
  },
  {
    value: '2',
    label: '男士用品',
  },
  {
    value: '3',
    label: '夫妻用品',
  },
  {
    value: '4',
    label: '束缚与约束',
  },

]

// 角色表格数据
const roleList = ref()
// 菜单权限下拉
const menuPermOptions = ref([])

// 弹窗
const dialog = reactive({
  title: "",
  visible: false,
})

// 新增表单
const formData = reactive({
  id: '',
  categoryId: '',
  title: '',
  detail: '',
  sortOrder: '',
  file: null,
  initialImageUrl: '', // 用于编辑时显示原有图片
})

// 标识图片是否有变化
const imageChanged = ref(false)

const rules = reactive({
  file: [{ required: false, message: "请上传封面图", trigger: "blur" }], // 编辑时不强制要求
  type: [{ required: true, message: "请选择状态", trigger: "blur" }],
  categoryId: [{ required: true, message: "请选择类型", trigger: "blur" }],
  detail: [{ required: true, message: "请输入内容", trigger: "blur" }],
  title: [{ required: true, message: "请输入标题", trigger: "blur" }],
})

// 选中的角色
const checkedRole = ref({})
const assignPermDialogVisible = ref(false)

const permKeywords = ref("")
const isExpanded = ref(true)

const parentChildLinked = ref(true)

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
    formData.categoryId = data.categoryId
    formData.title = data.title
    formData.detail = data.detail
    formData.sortOrder = data.sortOrder
    formData.file = null // 编辑时先清空file
    formData.initialImageUrl = data.images ? `${baseUrl}${data.images}` : '' // 设置初始图片URL

    console.log('编辑数据:', data)
    console.log('初始图片URL:', formData.initialImageUrl)
  } else {
    dialog.title = "新增"
    // 重置表单数据
    formData.categoryId = ''
    formData.title = ''
    formData.detail = ''
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
      // 编辑时如果没有上传新图片且没有初始图片，则验证失败
      if (dialog.title === "修改" && !formData.file && !formData.initialImageUrl) {
        ElMessage.error("请上传图片")
        return
      }

      // 新增时必须有图片
      if (dialog.title === "新增" && !formData.file) {
        ElMessage.error("请上传图片")
        return
      }

      loading.value = true

      if (dialog.title === "修改") {
        const formDatas = new FormData()
        formDatas.append('id', formData.id)
        formDatas.append('categoryId', formData.categoryId)
        formDatas.append('title', formData.title)
        formDatas.append('detail', formData.detail)
        formDatas.append('sortOrder', formData.sortOrder)
        // formDatas.append('file', formData.file)

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
        const formDatas = new FormData()
        formDatas.append('categoryId', formData.categoryId)
        formDatas.append('title', formData.title)
        formDatas.append('detail', formData.detail)
        formDatas.append('sortOrder', formData.sortOrder)
        formDatas.append('file', formData.file)
        formDatas.append('lang', Cookies.get('lang') || 'en')

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
  formData.categoryId = ''
  formData.title = ''
  formData.detail = ''
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