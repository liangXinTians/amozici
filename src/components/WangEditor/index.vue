<template>
  <div style="z-index: 999; border: 1px solid #ccc">
    <!-- 工具栏 -->
    <Toolbar
      :editor="editorRef"
      mode="simple"
      :default-config="toolbarConfig"
      style="border-bottom: 1px solid #ccc"
    />
    <!-- 编辑器 -->
    <Editor
      v-model="modelValue"
      :style="{ height: '500px', overflowY: 'hidden' }"
      :default-config="editorConfig"
      mode="simple"
      @on-created="handleCreated"
    />
  </div>
</template>

<script setup>
import "@wangeditor-next/editor/dist/css/style.css";
import { Toolbar, Editor } from "@wangeditor-next/editor-for-vue";
import {articleUploadFiles} from "@/api/file.js"

// 文件上传 API
// import FileAPI from "@/api/file.api";


// defineProps({
//   height: {
//     type: String,
//     default: "500px",
//   },
// });

// 3.3的语法糖
// // 双向绑定
// const modelValue = defineModel("modelValue", {
//   type: String,
//   required: false
// });

const props = defineProps({
  modelValue: String
})
const emit = defineEmits(['update:modelValue'])

const modelValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const baseUrl = import.meta.env.VITE_APP_BASE_API || 'https://www.amozici.com'


// 编辑器实例，必须用 shallowRef，重要！
const editorRef = shallowRef();

// 工具栏配置
const toolbarConfig = ref({});

// 编辑器配置
const editorConfig = ref({
  placeholder: "请输入内容...",
  MENU_CONF: {
    uploadImage: {
      customUpload(file, insertFn) {
        console.log('file',file)
        const formDatas = new FormData()
        formDatas.append('file', file)

        // 上传图片
        articleUploadFiles(formDatas).then((res) => {
          console.log('res',res)
          // 插入图片
          // insertFn(res.url, res.name, res.url);
          insertFn(`${baseUrl}${res.data}`);
        });
      },
    },
  },
});

// 记录 editor 实例，重要！
const handleCreated = (editor) => {
  editorRef.value = editor;
};

// 组件销毁时，也及时销毁编辑器，重要！
onBeforeUnmount(() => {
  const editor = editorRef.value;
  if (editor == null) return;
  editor.destroy();
});
</script>
