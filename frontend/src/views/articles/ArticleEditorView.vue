<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import request from '../../utils/request';
import { renderMarkdown } from '../../utils/markdown';

const route = useRoute();
const router = useRouter();
const isEdit = computed(() => Boolean(route.params.id));
const loading = ref(false);
const categories = ref([]);
const tags = ref([]);

const form = reactive({
  title: '',
  excerpt: '',
  content: '',
  status: 'published',
  categoryId: null,
  tagIds: [],
});

const previewHtml = computed(() => renderMarkdown(form.content));

async function fetchOptions() {
  const [categoryRes, tagRes] = await Promise.all([request.get('/categories'), request.get('/tags')]);
  categories.value = categoryRes.data.data;
  tags.value = tagRes.data.data;
}

async function fetchDetail() {
  if (!isEdit.value) {
    return;
  }

  const { data } = await request.get(`/articles/${route.params.id}`);
  const article = data.data;
  form.title = article.title;
  form.excerpt = article.excerpt || '';
  form.content = article.content;
  form.status = article.status;
  form.categoryId = article.categoryId;
  form.tagIds = (article.tags || []).map((item) => item.id);
}

async function saveArticle(saveAsDraft = false) {
  try {
    loading.value = true;
    const payload = {
      title: form.title,
      excerpt: form.excerpt,
      content: form.content,
      status: saveAsDraft ? 'draft' : form.status,
      categoryId: form.categoryId,
      tagIds: form.tagIds,
    };

    if (isEdit.value) {
      await request.put(`/articles/${route.params.id}`, payload);
    } else {
      await request.post('/articles', payload);
    }

    ElMessage.success(saveAsDraft ? '草稿已保存' : '文章已保存');
    router.push('/articles');
  } catch (_err) {
    ElMessage.error('保存失败');
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  try {
    await fetchOptions();
    await fetchDetail();
  } catch (_err) {
    ElMessage.error('初始化编辑器失败');
  }
});
</script>

<template>
  <main class="page">
    <h2>{{ isEdit ? '编辑文章' : '新建文章' }}</h2>
    <el-form :model="form" label-width="90px">
      <el-form-item label="标题">
        <el-input v-model="form.title" />
      </el-form-item>
      <el-form-item label="摘要">
        <el-input v-model="form.excerpt" />
      </el-form-item>
      <el-form-item label="分类">
        <el-select v-model="form.categoryId" placeholder="请选择分类" style="width: 260px">
          <el-option v-for="item in categories" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="标签">
        <el-select v-model="form.tagIds" multiple placeholder="请选择标签" style="width: 360px">
          <el-option v-for="item in tags" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="正文">
        <el-input v-model="form.content" type="textarea" :rows="14" />
      </el-form-item>
      <el-button type="primary" :loading="loading" @click="saveArticle(false)">发布/更新</el-button>
      <el-button :loading="loading" @click="saveArticle(true)">保存草稿</el-button>
    </el-form>

    <section class="preview">
      <h3>预览</h3>
      <div class="preview-content" v-html="previewHtml" />
    </section>
  </main>
</template>

<style scoped>
.page {
  max-width: 980px;
  margin: 24px auto;
  padding: 0 16px;
}

.preview {
  margin-top: 24px;
}

.preview-content {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
}
</style>
