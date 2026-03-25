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
import request from "../../utils/request";
import { getApiErrorMessage } from "../../utils/request";
import { removeCacheByPrefix } from "../../utils/cache";
import { bindMarkdownCodeCopy, renderMarkdown } from "../../utils/markdown";
import message from "../../utils/message";
import { useCodeTheme } from "../../composables/useCodeTheme";

const route = useRoute();
const router = useRouter();
const isEdit = computed(() => Boolean(route.params.id));
const isDraftEdit = computed(() => route.name === "draft-edit");
const loading = ref(false);
const categories = ref([]);
const tags = ref([]);
const draftId = ref(null);
const saveStatus = ref("自动保存已开启");
const editorRef = ref();
const markdownContainerRef = ref();
const hotPicking = ref(false);
let autoSaveTimer = null;
const previewHtml = ref("");
const { codeTheme, toggleCodeTheme } = useCodeTheme();
let unbindCodeCopy = null;

const hotCategories = [
  "前端",
  "后端",
  "数据库",
  "架构设计",
  "工程实践",
  "AI 应用",
];
const hotTags = [
  "Vue3",
  "Node.js",
  "TypeScript",
  "性能优化",
  "系统设计",
  "代码规范",
  "MySQL",
  "Docker",
];

const wordCount = computed(() => {
  const text = (form.content || "").replace(/\s+/g, "").trim();
  return text.length;
});

const readingMinutes = computed(() => {
  if (!wordCount.value) {
    return 0;
  }

  return Math.max(1, Math.ceil(wordCount.value / 450));
});

const markdownTools = [
  { label: "标题", insert: "\n## 标题\n" },
  { label: "粗体", insert: "**加粗文本**" },
  { label: "代码", insert: "\n```js\nconsole.log('hello')\n```\n" },
  { label: "引用", insert: "\n> 一段引用\n" },
  { label: "列表", insert: "\n- 列表项一\n- 列表项二\n" },
];

function insertMarkdown(text) {
  const textarea = editorRef.value?.textarea;
  if (!textarea) {
    form.content += text;
    return;
  }

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const original = form.content || "";
  form.content = `${original.slice(0, start)}${text}${original.slice(end)}`;

  setTimeout(() => {
    const nextPos = start + text.length;
    textarea.focus();
    textarea.setSelectionRange(nextPos, nextPos);
  }, 0);
}

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

function findByName(list, name) {
  const normalized = String(name || "")
    .trim()
    .toLowerCase();
  return list.find(
    (item) =>
      String(item.name || "")
        .trim()
        .toLowerCase() === normalized,
  );
}

async function ensureCategory(name) {
  const existed = findByName(categories.value, name);
  if (existed) {
    return existed;
  }

  await request.post("/categories", { name });
  await fetchOptions();
  return findByName(categories.value, name);
}

async function ensureTag(name) {
  const existed = findByName(tags.value, name);
  if (existed) {
    return existed;
  }

  await request.post("/tags", { name });
  await fetchOptions();
  return findByName(tags.value, name);
}

async function pickHotCategory(name) {
  if (hotPicking.value) {
    return;
  }

  try {
    hotPicking.value = true;
    const category = await ensureCategory(name);
    if (!category) {
      throw new Error("分类创建失败");
    }
    form.categoryId = category.id;
    message.success(`已选择 HOT 分类：${category.name}`);
  } catch (error) {
    message.error(getApiErrorMessage(error, "选择热门分类失败"));
  } finally {
    hotPicking.value = false;
  }
}

async function pickHotTag(name) {
  if (hotPicking.value) {
    return;
  }

  try {
    hotPicking.value = true;
    const tag = await ensureTag(name);
    if (!tag) {
      throw new Error("标签创建失败");
    }

    if (!form.tagIds.includes(tag.id)) {
      form.tagIds = [...form.tagIds, tag.id];
      message.success(`已添加 HOT 标签：${tag.name}`);
      return;
    }

    message.info(`HOT 标签已存在：${tag.name}`);
  } catch (error) {
    message.error(getApiErrorMessage(error, "选择热门标签失败"));
  } finally {
    hotPicking.value = false;
  }
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
  message.info("已创建自动草稿");
}

async function saveArticle(saveAsDraft = false) {
  try {
    loading.value = true;

    if (saveAsDraft) {
      await saveDraftSilently();
      message.success("草稿已保存");
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

    removeCacheByPrefix("articles:");
    message.success("文章已保存");
    saveStatus.value = "文章已发布";
    router.push("/articles");
  } catch (_err) {
    message.error(getApiErrorMessage(_err, "保存失败"));
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

    unbindCodeCopy = bindMarkdownCodeCopy(markdownContainerRef.value, message, {
      toggleCodeTheme,
    });
  } catch (_err) {
    message.error(getApiErrorMessage(_err, "初始化编辑器失败"));
  }
});

onBeforeUnmount(() => {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer);
  }

  if (unbindCodeCopy) {
    unbindCodeCopy();
  }
});

watch(
  () => form.content,
  async () => {
    await refreshPreview();
  },
);

watch(
  () => markdownContainerRef.value,
  (el) => {
    if (!el) {
      return;
    }

    if (unbindCodeCopy) {
      unbindCodeCopy();
    }
    unbindCodeCopy = bindMarkdownCodeCopy(el, message, {
      toggleCodeTheme,
    });
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
        <div class="header-right">
          <el-tag type="info" effect="plain">{{ saveStatus }}</el-tag>
          <el-tag type="success" effect="plain">字数 {{ wordCount }}</el-tag>
          <el-tag type="warning" effect="plain"
            >阅读 {{ readingMinutes }} 分钟</el-tag
          >
        </div>
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
                <div class="hot-box">
                  <p class="hot-title">
                    <span class="hot-icon">HOT</span> 热门分类
                  </p>
                  <div class="hot-list">
                    <el-tag
                      v-for="name in hotCategories"
                      :key="`c-${name}`"
                      class="hot-tag"
                      effect="light"
                      @click="pickHotCategory(name)"
                    >
                      {{ name }}
                    </el-tag>
                  </div>
                </div>
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
                <div class="hot-box">
                  <p class="hot-title">
                    <span class="hot-icon">HOT</span> 热门标签
                  </p>
                  <div class="hot-list">
                    <el-tag
                      v-for="name in hotTags"
                      :key="`t-${name}`"
                      class="hot-tag"
                      effect="plain"
                      @click="pickHotTag(name)"
                    >
                      {{ name }}
                    </el-tag>
                  </div>
                </div>
              </el-form-item>
            </div>
            <el-form-item label="正文">
              <div class="tool-row">
                <el-button
                  v-for="tool in markdownTools"
                  :key="tool.label"
                  size="small"
                  plain
                  @click="insertMarkdown(tool.insert)"
                >
                  {{ tool.label }}
                </el-button>
              </div>
              <el-input
                ref="editorRef"
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
          <el-empty
            v-if="!form.content.trim()"
            description="开始输入正文后，这里将实时显示渲染结果"
          />
          <div
            ref="markdownContainerRef"
            class="preview-content markdown-body"
            :data-code-theme="codeTheme"
            v-html="previewHtml"
          />
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

.header-right {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
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

.tool-row {
  margin-bottom: 10px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.hot-box {
  margin-top: 10px;
  border: 1px solid #ffe5c2;
  background: #fff8ee;
  border-radius: var(--radius-sm);
  padding: 10px;
}

.hot-title {
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: #a86514;
  letter-spacing: 0.08em;
}

.hot-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 18px;
  padding: 0 6px;
  border-radius: 999px;
  background: #ff9d2f;
  color: #fff;
  font-size: 10px;
  letter-spacing: 0.08em;
}

.hot-list {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.hot-tag {
  cursor: pointer;
  user-select: none;
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
  .editor-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-right {
    justify-content: flex-start;
  }

  .editor-grid {
    grid-template-columns: 1fr;
  }

  .inline-fields {
    grid-template-columns: 1fr;
  }
}
</style>
