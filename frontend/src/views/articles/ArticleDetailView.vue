<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import request from '../../utils/request';
import { renderMarkdown } from '../../utils/markdown';

const route = useRoute();
const loading = ref(false);
const article = ref(null);

const renderedContent = computed(() => renderMarkdown(article.value?.content || ''));

async function fetchDetail() {
  try {
    loading.value = true;
    const { data } = await request.get(`/articles/${route.params.id}`);
    article.value = data.data;
  } catch (_err) {
    ElMessage.error('加载详情失败');
  } finally {
    loading.value = false;
  }
}

onMounted(fetchDetail);
</script>

<template>
  <main class="page" v-loading="loading">
    <h1>{{ article?.title }}</h1>
    <p>{{ article?.excerpt }}</p>
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
</style>
