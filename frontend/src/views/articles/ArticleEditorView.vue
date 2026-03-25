<script setup>
import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import request from "../../utils/request";
import { getApiErrorMessage } from "../../utils/request";
import { renderMarkdown } from "../../utils/markdown";

const route = useRoute();
const router = useRouter();
const isEdit = computed(() => Boolean(route.params.id));
const isDraftEdit = computed(() => route.name === "draft-edit");
const loading = ref(false);
const categories = ref([]);
const tags = ref([]);
const draftId = ref(null);
const saveStatus = ref("自动保存已开启");
let autoSaveTimer = null;
const previewHtml = ref("");

const form = reactive({
  title: "",
  excerpt: "",
  content: "",
  status: "published",
  categoryId: null,
  tagIds: [],
});

async function refreshPreview() {
  previewHtml.value = await renderMarkdown(form.content);
}

async function fetchOptions() {
  const [categoryRes, tagRes] = await Promise.all([
    request.get("/categories"),
    request.get("/tags"),
  ]);
  categories.value = categoryRes.data.data;
  tags.value = tagRes.data.data;
}

async function fetchDetail() {
  if (isDraftEdit.value) {
    const { data } = await request.get(`/drafts/${route.params.id}`);
    const draft = data.data;
    draftId.value = draft.id;
    form.title = draft.title || "";
    form.excerpt = draft.excerpt || "";
    form.content = draft.content || "";
    form.categoryId = draft.categoryId;
    form.tagIds = draft.tagIds || [];
    form.status = "draft";
    return;
  }

  if (!isEdit.value) {
    return;
  }

  const { data } = await request.get(`/articles/${route.params.id}`);
  const article = data.data;
  form.title = article.title;
  form.excerpt = article.excerpt || "";
  form.content = article.content;
  form.status = article.status;
  form.categoryId = article.categoryId;
  form.tagIds = (article.tags || []).map((item) => item.id);
}

async function saveDraftSilently() {
  if (!form.title && !form.content) {
    return;
  }

  const payload = {
    title: form.title,
    excerpt: form.excerpt,
    content: form.content,
    categoryId: form.categoryId,
    tagIds: form.tagIds,
  };

  if (draftId.value) {
    await request.put(`/drafts/${draftId.value}`, payload);
    saveStatus.value = "草稿已自动更新";
    return;
  }

  const { data } = await request.post("/drafts", payload);
  draftId.value = data.data.id;
  saveStatus.value = "已创建自动草稿";
}

async function saveArticle(saveAsDraft = false) {
  try {
    loading.value = true;

    if (saveAsDraft) {
      await saveDraftSilently();
      ElMessage.success("草稿已保存");
      saveStatus.value = "草稿已手动保存";
      router.push("/drafts");
      return;
    }

    const payload = {
      title: form.title,
      excerpt: form.excerpt,
      content: form.content,
      status: form.status,
      categoryId: form.categoryId,
      tagIds: form.tagIds,
    };

    if (isEdit.value && !isDraftEdit.value) {
      await request.put(`/articles/${route.params.id}`, payload);
    } else {
      await request.post("/articles", payload);
      if (draftId.value) {
        await request.delete(`/drafts/${draftId.value}`);
      }
    }

    ElMessage.success("文章已保存");
    saveStatus.value = "文章已发布";
    router.push("/articles");
  } catch (_err) {
    ElMessage.error(getApiErrorMessage(_err, "保存失败"));
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  try {
    await fetchOptions();
    await fetchDetail();
    await refreshPreview();

    autoSaveTimer = setInterval(async () => {
      try {
        await saveDraftSilently();
      } catch (_err) {
        // 自动保存失败不打断编辑流程
      }
    }, 20000);
  } catch (_err) {
    ElMessage.error(getApiErrorMessage(_err, "初始化编辑器失败"));
  }
});

onBeforeUnmount(() => {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer);
  }
});

watch(
  () => form.content,
  async () => {
    await refreshPreview();
  },
);
</script>

<template>
  <main class="editor-page page-block">
    <section class="container">
      <header class="editor-header">
        <div>
          <p class="kicker">WRITING STUDIO</p>
          <h2>{{ isEdit ? "编辑文章" : "新建文章" }}</h2>
        </div>
        <el-tag type="info" effect="plain">{{ saveStatus }}</el-tag>
      </header>

      <section class="editor-grid">
        <el-card class="editor-form" shadow="never">
          <el-form :model="form" label-position="top">
            <el-form-item label="标题">
              <el-input v-model="form.title" placeholder="输入一个清晰的标题" />
            </el-form-item>
            <el-form-item label="摘要">
              <el-input
                v-model="form.excerpt"
                placeholder="一句话概括文章重点"
              />
            </el-form-item>
            <div class="inline-fields">
              <el-form-item label="分类">
                <el-select v-model="form.categoryId" placeholder="请选择分类">
                  <el-option
                    v-for="item in categories"
                    :key="item.id"
                    :label="item.name"
                    :value="item.id"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="标签">
                <el-select
                  v-model="form.tagIds"
                  multiple
                  placeholder="请选择标签"
                >
                  <el-option
                    v-for="item in tags"
                    :key="item.id"
                    :label="item.name"
                    :value="item.id"
                  />
                </el-select>
              </el-form-item>
            </div>
            <el-form-item label="正文">
              <el-input
                v-model="form.content"
                type="textarea"
                :rows="16"
                placeholder="支持 Markdown 语法，输入后右侧实时预览"
              />
            </el-form-item>
            <div class="actions">
              <el-button
                type="primary"
                :loading="loading"
                @click="saveArticle(false)"
              >
                发布/更新
              </el-button>
              <el-button :loading="loading" @click="saveArticle(true)">
                保存草稿
              </el-button>
            </div>
          </el-form>
        </el-card>

        <el-card class="preview" shadow="never">
          <h3>实时预览</h3>
          <div class="preview-content markdown-body" v-html="previewHtml" />
        </el-card>
      </section>
    </section>
  </main>
</template>

<style scoped>
.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
}

.kicker {
  margin: 0;
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.16em;
}

h2 {
  margin: 8px 0 0;
  font-size: clamp(26px, 3vw, 36px);
}

.editor-grid {
  margin-top: 14px;
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
  gap: 14px;
}

.editor-form,
.preview {
  background: rgba(255, 255, 255, 0.92);
}

.inline-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.inline-fields :deep(.el-select) {
  width: 100%;
}

.actions {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.preview h3 {
  margin-top: 0;
}

.preview-content {
  max-height: 680px;
  overflow: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 16px;
}

@media (max-width: 980px) {
  .editor-grid {
    grid-template-columns: 1fr;
  }

  .inline-fields {
    grid-template-columns: 1fr;
  }
}
</style>
