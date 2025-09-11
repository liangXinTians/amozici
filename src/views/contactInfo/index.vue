<template>
  <div class="app-container">
    <el-card shadow="never">
      <div class="mb-10px">
        <!-- <el-button type="success" icon="plus" @click="handleOpenDialog()">增加</el-button> -->
      </div>

      <el-table ref="dataTableRef" v-loading="loading" :data="roleList" border
        @selection-change="handleSelectionChange">
        <el-table-column label="ID" prop="id" min-width="100" align="center" />
        <el-table-column label="联系人" prop="contactPerson" min-width="100" align="center" />
        <el-table-column label="电子邮件" prop="email" min-width="100" align="center" />
        <el-table-column label="电话" prop="phone" min-width="100" align="center" />
        <el-table-column label="微信" prop="wechat" min-width="100" align="center" />
        <el-table-column label="facebook" prop="facebook" min-width="100" align="center" />
        <el-table-column label="ins" prop="instagram" min-width="100" align="center" />
        <el-table-column label="推特" prop="twitter" min-width="100" align="center" />
        <!-- <el-table-column :label="创建时间" prop="name" min-width="100" align="center" />
        <el-table-column :label="更新时间" prop="name" min-width="100" align="center" /> -->
        <el-table-column fixed="right" label="操作" width="100" align="center">
          <template #default="scope">
            <el-button type="primary" size="small" link icon="edit" @click="handleOpenDialog(scope.row)">
              编辑
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-if="total > 0" v-model:total="total" v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize" @pagination="handleQuery" />

    </el-card>

    <!-- 角色表单弹窗 -->
    <el-dialog v-model="dialog.visible" :title="dialog.title" width="500px" @close="handleCloseDialog">
      <el-form ref="roleFormRef" :model="formData" :rules="rules" label-width="130px">
        <el-form-item label="联系人：" prop="contactPerson">
          <el-input v-model="formData.contactPerson" placeholder="请输入联系人" />
        </el-form-item>
         <el-form-item label="电子邮件：" prop="email">
          <el-input v-model="formData.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="电话：" prop="phone">
          <el-input v-model="formData.phone" placeholder="请输入电话" />
        </el-form-item>
        <el-form-item label="微信：" prop="wechat">
          <el-input v-model="formData.wechat" placeholder="请输入微信号" />
        </el-form-item>
        <el-form-item label="Facebook：" prop="facebook">
          <el-input v-model="formData.facebook" placeholder="请输入Facebook账号" />
        </el-form-item>
        <el-form-item label="Instagram：" prop="instagram">
          <el-input v-model="formData.instagram" placeholder="请输入Instagram账号" />
        </el-form-item>
        <el-form-item label="twitter：" prop="twitter">
          <el-input v-model="formData.twitter" placeholder="请输入twitter账号" />
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
import { listBanner, addBanner, updateBanner, delBanner } from "@/api/contactInfo/index.js"
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
})

// 角色表格数据
const roleList = ref()

// 弹窗
const dialog = reactive({
  title: "",
  visible: false,
})

// 角色表单
const formData = reactive({
  id: '',
  contactPerson: '',
  email: '',
  phone: '',
  wechat: '',
  facebook: '',
  instagram: '',
  twitter: '',
})

// 标识图片是否有变化
const imageChanged = ref(false)

const rules = reactive({

  contactPerson: [{ required: true, message: "请输入联系人", trigger: "blur" }],
  email: [{ required: true, message: '请输入正确的邮箱地址', trigger: 'blur' }],
  phone: [{ required: true, message: "请输入电话", trigger: "blur" }],
  wechat: [{ required: true, message: "请输入微信号", trigger: "blur" }],
  facebook: [{ required: true, message: "请输入Facebook账号", trigger: "blur" }],
  instagram: [{ required: true, message: "请输入Instagram账号", trigger: "blur" }],
  twitter: [{ required: true, message: "请输入twitter账号", trigger: "blur" }],
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
    formData.contactPerson = data.contactPerson
    formData.email = data.email
    formData.phone = data.phone
    formData.wechat = data.wechat
    formData.facebook = data.facebook
    formData.instagram = data.instagram
    formData.twitter = data.twitter
    

    console.log('编辑数据:', data)
    console.log('初始图片URL:', formData.initialImageUrl)
  } else {
    dialog.title = "新增"
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
        formDatas.append('email', formData.email)
        formDatas.append('phone', formData.phone)
        formDatas.append('wechat', formData.wechat)
        formDatas.append('facebook', formData.facebook)
        formDatas.append('instagram', formData.instagram)
        formDatas.append('twitter', formData.twitter)
        formDatas.append('contactPerson', formData.contactPerson)

        updateBanner(formDatas)
          .then(() => {
            ElMessage.success("修改成功")
            handleCloseDialog()
            handleQuery()
          })
          .finally(() => (loading.value = false))
      } else {
        const formDatas = new FormData()
        // formDatas.append('file', formData.file)
        // formDatas.append('sortOrder', formData.sortOrder)
        // formDatas.append('type', 2)
        formDatas.append('lang', Cookies.get('lang') || 'en')
        // formDatas.append('id', formData.id)
        formDatas.append('email', formData.email)
        formDatas.append('phone', formData.phone)
        formDatas.append('wechat', formData.wechat)
        formDatas.append('facebook', formData.facebook)
        formDatas.append('instagram', formData.instagram)
        formDatas.append('twitter', formData.twitter)
        formDatas.append('contactPerson', formData.contactPerson)
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
  formData.id = undefined
  formData.file = null
  formData.type = 2
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
<style scoped lang="scss">
.mb-10px{
  padding-bottom: 10px;
  text-align: right;
}


</style>