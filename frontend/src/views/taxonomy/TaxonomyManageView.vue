<script setup>
import { onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import request from '../../utils/request';

const categories = ref([]);
const tags = ref([]);
const loading = ref(false);
const form = reactive({ category: '', tag: '' });

async function fetchAll() {
  try {
    loading.value = true;
    const [categoryRes, tagRes] = await Promise.all([request.get('/categories'), request.get('/tags')]);
    categories.value = categoryRes.data.data;
    tags.value = tagRes.data.data;
  } catch (_err) {
    ElMessage.error('加载分类标签失败');
  } finally {
    loading.value = false;
  }
}

async function createCategory() {
  if (!form.category) return;
  await request.post('/categories', { name: form.category });
  form.category = '';
  fetchAll();
}

async function createTag() {
  if (!form.tag) return;
  await request.post('/tags', { name: form.tag });
  form.tag = '';
  fetchAll();
}

onMounted(fetchAll);
</script>

<template>
  <main class="page" v-loading="loading">
    <h2>分类与标签管理</h2>
    <div class="block">
      <h3>分类</h3>
      <div class="inline-form">
        <el-input v-model="form.category" placeholder="新增分类" style="max-width: 240px" />
        <el-button type="primary" @click="createCategory">新增分类</el-button>
      </div>
      <el-tag v-for="item in categories" :key="item.id" class="item" type="success">{{ item.name }}</el-tag>
    </div>

    <div class="block">
      <h3>标签</h3>
      <div class="inline-form">
        <el-input v-model="form.tag" placeholder="新增标签" style="max-width: 240px" />
        <el-button type="primary" @click="createTag">新增标签</el-button>
      </div>
      <el-tag v-for="item in tags" :key="item.id" class="item">{{ item.name }}</el-tag>
    </div>
  </main>
</template>

<style scoped>
.page {
  max-width: 980px;
  margin: 24px auto;
  padding: 0 16px;
}

.block {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-top: 16px;
}

.inline-form {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.item {
  margin-right: 8px;
  margin-bottom: 8px;
}
</style>
