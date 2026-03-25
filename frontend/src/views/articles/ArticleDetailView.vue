<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import request from "../../utils/request";
import { bindMarkdownCodeCopy, renderMarkdown } from "../../utils/markdown";
import message from "../../utils/message";
import { useCodeTheme } from "../../composables/useCodeTheme";

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const article = ref(null);
const liked = ref(false);
const renderedContent = ref("");
const markdownContainerRef = ref();
const { codeTheme, toggleCodeTheme } = useCodeTheme();
let unbindCodeCopy = null;

const wordCount = computed(() => {
  const text = (article.value?.content || "").replace(/\s+/g, "").trim();
  return text.length;
});

const readingMinutes = computed(() => {
  const count = wordCount.value;
  if (!count) {
    return 0;
  }

  return Math.max(1, Math.ceil(count / 450));
});

const updatedAtText = computed(() => {
  const value = article.value?.updatedAt || article.value?.createdAt;
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
});

async function refreshRenderedContent() {
  renderedContent.value = await renderMarkdown(article.value?.content || "");
}

async function fetchDetail() {
  try {
    loading.value = true;
    const { data } = await request.get(`/articles/${route.params.id}`);
    article.value = data.data;
  } catch (_err) {
    message.error("加载详情失败");
  } finally {
    loading.value = false;
  }
}

async function fetchLikeState() {
  try {
    const { data } = await request.get(`/articles/${route.params.id}/is-liked`);
    liked.value = Boolean(data.data.liked);
  } catch (_err) {
    liked.value = false;
  }
}

async function toggleLike() {
  try {
    if (liked.value) {
      const { data } = await request.delete(
        `/articles/${route.params.id}/like`,
      );
      liked.value = false;
      if (article.value) {
        article.value.likesCount = data.data.likesCount;
      }
      return;
    }

    const { data } = await request.post(`/articles/${route.params.id}/like`);
    liked.value = true;
    if (article.value) {
      article.value.likesCount = data.data.likesCount;
    }
  } catch (_err) {
    message.error("操作失败");
  }
}

onMounted(async () => {
  await Promise.all([fetchDetail(), fetchLikeState()]);
  await refreshRenderedContent();
  unbindCodeCopy = bindMarkdownCodeCopy(markdownContainerRef.value, message);
});

onUnmounted(() => {
  if (unbindCodeCopy) {
    unbindCodeCopy();
  }
});

watch(
  () => article.value?.content,
  async () => {
    await refreshRenderedContent();
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
    unbindCodeCopy = bindMarkdownCodeCopy(el, message);
  },
);
</script>

<template>
  <main class="detail-page page-block" v-loading="loading">
    <section class="container detail-grid">
      <article class="article-card">
        <p class="kicker">ARTICLE DETAIL</p>
        <h1>{{ article?.title || "未命名文章" }}</h1>
        <p class="excerpt">{{ article?.excerpt || "暂无摘要" }}</p>
        <div class="meta-row">
          <span>状态：{{ article?.status || "-" }}</span>
          <span>分类：{{ article?.category?.name || "未分类" }}</span>
          <span>字数：{{ wordCount }}</span>
          <span>阅读：约 {{ readingMinutes }} 分钟</span>
          <span>更新：{{ updatedAtText }}</span>
        </div>
        <div class="code-theme-row">
          <el-button size="small" plain @click="toggleCodeTheme">
            代码主题：{{ codeTheme === "dark" ? "深色" : "浅色" }}
          </el-button>
        </div>
        <div
          ref="markdownContainerRef"
          class="markdown-body"
          :data-code-theme="codeTheme"
          v-html="renderedContent"
        />
      </article>

      <aside class="side-card">
        <h3>互动</h3>
        <p>为这篇内容添加你的反馈。</p>
        <div class="side-actions">
          <el-button plain @click="router.push('/articles')"
            >返回列表</el-button
          >
          <el-button
            type="success"
            plain
            @click="router.push(`/articles/${route.params.id}/edit`)"
          >
            编辑文章
          </el-button>
        </div>
        <el-button class="thumb-btn" :class="{ liked }" plain @click="toggleLike">
          <span class="thumb-icon">👍</span>
          <span>{{ liked ? "已点赞" : "点赞文章" }}</span>
        </el-button>
        <p class="like-count">当前点赞：{{ article?.likesCount || 0 }}</p>
      </aside>
    </section>
  </main>
</template>

<style scoped>
.detail-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: minmax(0, 1fr) 260px;
}

.article-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.94);
  box-shadow: var(--shadow-md);
  padding: clamp(18px, 4vw, 34px);
}

.kicker {
  margin: 0;
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.16em;
}

h1 {
  margin: 10px 0;
  font-size: clamp(28px, 4vw, 42px);
  line-height: 1.15;
}

.excerpt {
  margin: 0;
  color: var(--color-text-secondary);
  line-height: 1.8;
}

.meta-row {
  margin-top: 14px;
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
  color: var(--color-text-secondary);
  font-size: 14px;
}

.markdown-body {
  margin-top: 20px;
  border-top: 1px solid var(--color-border);
  padding-top: 20px;
}

.code-theme-row {
  margin-top: 14px;
}

.side-card {
  position: sticky;
  top: 18px;
  align-self: flex-start;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: var(--shadow-sm);
  padding: 16px;
}

.side-card h3 {
  margin: 0;
}

.side-card p {
  margin: 8px 0 12px;
  color: var(--color-text-secondary);
}

.side-actions {
  display: grid;
  gap: 8px;
  margin-bottom: 12px;
}

.side-actions .el-button {
  width: 100%;
}

.thumb-btn {
  width: 100%;
  margin-top: 2px;
  display: inline-flex;
  justify-content: center;
  gap: 8px;
  border-color: #a3c5ff;
  color: #2c6ae7;
  background: #f2f7ff;
}

.thumb-btn.liked {
  border-color: #85aaf2;
  background: #dfeafe;
  color: #1b4fbe;
}

.thumb-icon {
  font-size: 16px;
  line-height: 1;
}

.like-count {
  margin-top: 12px;
  font-weight: 600;
  color: var(--color-text);
}

@media (max-width: 980px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .side-card {
    position: static;
  }
}
</style>
