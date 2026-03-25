<script setup>
import { onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import request from "../../utils/request";
import { getCache, removeCache, setCache } from "../../utils/cache";

const categories = ref([]);
const tags = ref([]);
const loading = ref(false);
const form = reactive({ category: "", tag: "" });

async function fetchAll() {
  const cachedCategories = getCache("categories");
  const cachedTags = getCache("tags");
  if (cachedCategories && cachedTags) {
    categories.value = cachedCategories;
    tags.value = cachedTags;
    return;
  }

  try {
    loading.value = true;
    const [categoryRes, tagRes] = await Promise.all([
      request.get("/categories"),
      request.get("/tags"),
    ]);
    categories.value = categoryRes.data.data;
    tags.value = tagRes.data.data;
    setCache("categories", categories.value, 5 * 60 * 1000);
    setCache("tags", tags.value, 5 * 60 * 1000);
  } catch (_err) {
    ElMessage.error("加载分类标签失败");
  } finally {
    loading.value = false;
  }
}

async function createCategory() {
  if (!form.category.trim()) return;

  try {
    await request.post("/categories", { name: form.category.trim() });
    removeCache("categories");
    form.category = "";
    ElMessage.success("分类创建成功");
    fetchAll();
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || "分类创建失败");
  }
}

async function createTag() {
  if (!form.tag.trim()) return;

  try {
    await request.post("/tags", { name: form.tag.trim() });
    removeCache("tags");
    form.tag = "";
    ElMessage.success("标签创建成功");
    fetchAll();
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || "标签创建失败");
  }
}

onMounted(fetchAll);
</script>

<template>
  <main class="taxonomy-page page-block" v-loading="loading">
    <section class="container">
      <header class="taxonomy-header">
        <p class="kicker">CONTENT TAXONOMY</p>
        <h1>分类与标签管理</h1>
        <p>用清晰的分类体系提升文章组织效率与检索体验。</p>
      </header>

      <section class="taxonomy-grid">
        <el-card class="block" shadow="never">
          <h3>分类</h3>
          <div class="inline-form">
            <el-input v-model="form.category" placeholder="输入新分类名称" />
            <el-button type="primary" @click="createCategory">新增分类</el-button>
          </div>
          <div class="tags-wrap">
            <el-tag
              v-for="item in categories"
              :key="item.id"
              class="item"
              type="success"
              effect="plain"
            >
              {{ item.name }}
            </el-tag>
          </div>
        </el-card>

        <el-card class="block" shadow="never">
          <h3>标签</h3>
          <div class="inline-form">
            <el-input v-model="form.tag" placeholder="输入新标签名称" />
            <el-button type="primary" @click="createTag">新增标签</el-button>
          </div>
          <div class="tags-wrap">
            <el-tag v-for="item in tags" :key="item.id" class="item" effect="plain">
              {{ item.name }}
            </el-tag>
          </div>
        </el-card>
      </section>
    </section>
  </main>
</template>

<style scoped>
.kicker {
  margin: 0;
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.16em;
}

h1 {
  margin: 8px 0;
  font-size: clamp(26px, 3vw, 36px);
}

.taxonomy-header p {
  margin: 0;
  color: var(--color-text-secondary);
}

.taxonomy-grid {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.block {
  background: rgba(255, 255, 255, 0.92);
}

.block h3 {
  margin: 0 0 12px;
}

.inline-form {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}

.tags-wrap {
  display: flex;
  flex-wrap: wrap;
}

.item {
  margin-right: 8px;
  margin-bottom: 8px;
}

@media (max-width: 900px) {
  .taxonomy-grid {
    grid-template-columns: 1fr;
  }

  .inline-form {
    flex-direction: column;
  }
}
</style>
