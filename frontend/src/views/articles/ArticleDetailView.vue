<script setup>
import { onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import request from "../../utils/request";
import { renderMarkdown } from "../../utils/markdown";

const route = useRoute();
const loading = ref(false);
const article = ref(null);
const liked = ref(false);
const renderedContent = ref("");

async function refreshRenderedContent() {
  renderedContent.value = await renderMarkdown(article.value?.content || "");
}

async function fetchDetail() {
  try {
    loading.value = true;
    const { data } = await request.get(`/articles/${route.params.id}`);
    article.value = data.data;
  } catch (_err) {
    ElMessage.error("加载详情失败");
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
    ElMessage.error("操作失败");
  }
}

onMounted(async () => {
  await Promise.all([fetchDetail(), fetchLikeState()]);
  await refreshRenderedContent();
});

watch(
  () => article.value?.content,
  async () => {
    await refreshRenderedContent();
  },
);
</script>

<template>
  <main class="page" v-loading="loading">
    <h1>{{ article?.title }}</h1>
    <p>{{ article?.excerpt }}</p>
    <div class="like-row">
      <el-button type="primary" plain @click="toggleLike">{{
        liked ? "取消点赞" : "点赞"
      }}</el-button>
      <span>点赞数：{{ article?.likesCount || 0 }}</span>
    </div>
    <div class="markdown-body" v-html="renderedContent" />
  </main>
</template>

<style scoped>
.page {
  max-width: 980px;
  margin: 24px auto;
  padding: 0 16px;
}

.markdown-body {
  background: #fff;
  padding: 16px;
  border-radius: 8px;
  margin-top: 16px;
}

.like-row {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>
