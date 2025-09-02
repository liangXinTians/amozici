<template>
  <div class="app-container">
    <el-card shadow="never">
      <div class="mb-10px">

        <div>
          <el-input v-model="queryParams.mobile" placeholder="请输入手机号" style="width: 200px;margin-right: 10px;" />
          <el-input v-model="queryParams.username" placeholder="请输入用户名" style="width: 200px;margin-right: 10px;" />

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
        <el-table-column label="用户手机" prop="mobile" min-width="100" align="center" />
        <el-table-column label="用户密码" prop="passwrd" min-width="100" align="center" />
        <el-table-column label="用户名称" prop="username" min-width="100" align="center" />

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
    <el-dialog v-model="dialog.visible" :title="dialog.title" width="500px" @close="handleCloseDialog">
      <el-form ref="roleFormRef" :model="formData" :rules="rules" label-width="100px">
        <!-- <el-form-item label="类型：" prop="categoryId">
          <el-select v-model="formData.categoryId" placeholder="Select" style="width: 240px">
            <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item> -->
        <el-form-item label="手机号：" prop="mobile">
          <el-input v-model="formData.mobile" style="width: 240px" />
        </el-form-item>
        <el-form-item label="用户名：" prop="username">
          <el-input v-model="formData.username" style="width: 240px" />
        </el-form-item>
        <el-form-item label="密 码：" prop="password">
          <el-input v-model="formData.password" style="width: 240px" />
        </el-form-item>
        

        <!-- <el-form-item label="排序：" prop="sortOrder">
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
import { listBanner, addBanner, updateBanner, delBanner } from "@/api/user/index.js"
import WangEditor from "@/components/WangEditor/index.vue"

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
  mobile: '',
  username: ''
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
  mobile: '',
  password: '',
  username: '',
})

// 标识图片是否有变化
const imageChanged = ref(false)

const rules = reactive({
  mobile: [{ required: true, message: "请输入手机号", trigger: "blur" }],
  password: [{ required: true, message: "请输入密码", trigger: "blur" }],
  username: [{ required: true, message: "请输入用户名", trigger: "blur" }],
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
    formData.mobile = data.mobile
    formData.username = data.username
    formData.password = data.password


    console.log('编辑数据:', data)
    console.log('初始图片URL:', formData.initialImageUrl)
  } else {
    dialog.title = "新增"
    // 重置表单数据
    formData.mobile = ''
    formData.username = ''
    formData.password = ''

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
        formDatas.append('mobile', formData.mobile)
        formDatas.append('username', formData.username)
        formDatas.append('password', formData.password)

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
        formDatas.append('mobile', formData.mobile)
        formDatas.append('username', formData.username)
        formDatas.append('password', formData.password)
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
  formData.mobile = ''
  formData.username = ''
  formData.password = ''

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