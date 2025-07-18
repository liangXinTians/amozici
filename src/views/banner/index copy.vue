<template>
  <div class="app-container">
    <el-card shadow="never">
      <div class="mb-10px">
        <el-button type="success" icon="plus" @click="handleOpenDialog()">增加</el-button>
        <!-- <el-button type="danger" :disabled="ids.length === 0" icon="delete" @click="handleDelete()">
          删除
        </el-button> -->

        <img src="https://www.amozici.com/images/bfa6d1b2-8164-4a89-84d4-8aabfa660e24.jpg" alt="">
        <img src="https://www.amozici.com" alt="">
      </div>

      <el-table ref="dataTableRef" v-loading="loading" :data="roleList" border
        @selection-change="handleSelectionChange">
        <!-- <el-table-column type="selection" width="55" align="center" /> -->
        <el-table-column label="序号" prop="sortOrder" min-width="100" align="center" />
        <el-table-column label="ID" prop="id" min-width="100" align="center" />
        <el-table-column label="图片" prop="fileUrl" min-width="100" align="center">
          <template #default="scope">
            <el-image :src="`${baseUrl}${scope.row.fileUrl}`" style="width: 60px; height: 60px; object-fit: contain;"
              :preview-src-list="[`${baseUrl}${scope.row.fileUrl}`]" hide-on-click-modal preview-teleported />
          </template>
        </el-table-column>
        <!-- <el-table-column :label="创建时间" prop="name" min-width="100" align="center" />
        <el-table-column :label="更新时间" prop="name" min-width="100" align="center" /> -->
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
        <el-form-item label="图片：" prop="file">
          <!-- <el-input v-model="formData.name" placeholder="请输入角色名称" /> -->
          <!-- <SingleImageUpload v-model="formData.img" /> -->
          <!-- <imageUpload v-model="formData.img" :limit="1" /> -->
          <imageUploads v-model="formData.file" :limit="1" />
        </el-form-item>
        <!-- <el-form-item label="图片：" prop="img">

          <imageUploads v-model="formData.img" :limit="1" />
        </el-form-item> -->

        <el-form-item label="排序：" prop="type">
          <el-input-number v-model="formData.type" controls-position="right" :min="0" style="width: 100px" />
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
import { listBanner, addBanner, updateBanner, delBanner } from "@/api/banner/index.js"

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
})

// 角色表格数据
const roleList = ref()
// 菜单权限下拉
const menuPermOptions = ref([])

// 弹窗
const dialog = reactive({
  title: "",
  visible: false,
})

// const drawerSize = computed(() => (appStore.device === DeviceEnum.DESKTOP ? "600px" : "90%"))

// 角色表单
const formData = reactive({
  file: null,
  type: 1,
})

const rules = reactive({
  file: [{ required: true, message: "请上传图片", trigger: "blur" }],
  type: [{ required: true, message: "请选择状态", trigger: "blur" }],
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
  if (data.id) {
    dialog.title = "修改"
    // RoleAPI.getFormData(roleId).then((data) => {
    //   Object.assign(formData, data)
    // })
    editFormData.value = data
    console.log(editFormData, 'editFormData')
  } else {
    dialog.title = "新增"
  }
}

const editFormData = reactive({

})
// 新增
function handleSubmit () {
  console.log(formData, 'formData')
  // const fd = new FormData()
  //  fd.append("file", file.raw) 
  // console.log(formData, 'formData')
  roleFormRef.value.validate((valid) => {
    if (valid) {
      loading.value = true

      if (dialog.title == "修改") {
        const formDatas = new FormData()
        // formDatas.append('file', formData.file) 
        formDatas.append('type', editFormData.value.type)
        formDatas.append('id', editFormData.value.id)
        formDatas.append('sortOrder', editFormData.value.sortOrder)
        updateBanner(formDatas)
          .then(() => {
            ElMessage.success("修改成功")
            handleCloseDialog()
            handleQuery()
          })
          .finally(() => (loading.value = false))
      } else {
        const formDatas = new FormData()
        formDatas.append('file', formData.file)
        formDatas.append('type', formData.type)
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

  formData.id = undefined
  formData.sort = 1
  formData.status = 1
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