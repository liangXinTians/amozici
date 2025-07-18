import { createI18n } from "vue-i18n"
import { useAppStoreHook } from "@/store/modules/app.store"
// 本地语言包
import enLocale from "./package/en"
import zhCnLocale from "./package/zh-cn"

// import frLocale from '@/lang/package/fr'
// import esLocale from '@/lang/package/es'
// import itLocale from '@/lang/package/it'
// import elementFr from 'element-plus/lib/locale/lang/fr'
// import elementEs from 'element-plus/lib/locale/lang/es'
// import elementIt from 'element-plus/lib/locale/lang/it'
import frLocale from "./package/fr" // 新增法语语言包
import esLocale from "./package/es" // 新增西班牙语语言包
import itLocale from "./package/it" // 新增意大利语语言包

// Element Plus 的语言包
import elementFr from "element-plus/dist/locale/fr.mjs"
import elementEs from "element-plus/dist/locale/es.mjs"
import elementIt from "element-plus/dist/locale/it.mjs"

Vue.use(VueI18n)

const messages = {
  en_US: {
    ...enLocale,
    ...elementEnLocale
  },
  zh_CN: {
    ...zhCnLocale,
    ...elementZhLocale
  }
}

const i18n = new VueI18n({
  // 设置语言 选项 en | zh
  locale: Cookies.get('language') || 'zh_CN',
  // 设置文本内容
  messages
})

export default i18n