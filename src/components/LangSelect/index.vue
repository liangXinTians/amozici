<template>
  <el-dropdown trigger="click" class="international" @command="handleSetLanguage">
    <div>
      <svg-icon class-name="international-icon" icon-class="language" />
    </div>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item :disabled="language === 'zh_CN'" command="zh_CN">
          中文
        </el-dropdown-item>
        <el-dropdown-item :disabled="language === 'en_US'" command="en_US">
          English
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup>
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import useLanguageStore from '@/store/modules/language'
import { changeLanguage } from "@/api/login"

const { locale } = useI18n()
const languageStore = useLanguageStore()

const language = computed(() => languageStore.language)

const handleSetLanguage = (value) => {
  locale.value = value
  languageStore.setLanguage(value)
  ElMessage.success('设置语言成功')
  changeLanguage(value).then(response => {
    window.location.reload()
  })
}
</script>