<script setup>
import { onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import request from "../../utils/request";
import { getCache, removeCache, setCache } from "../../utils/cache";

const router = useRouter();
const loading = ref(false);
const articles = ref([]);
const pagination = reactive({ page: 1, pageSize: 10, total: 0 });
const filters = reactive({ q: "" });

async function fetchArticles() {
  const cacheKey = `articles:${filters.q}:${pagination.page}:${pagination.pageSize}`;
  const cached = getCache(cacheKey);
  if (cached) {
    articles.value = cached.data;
    pagination.total = cached.total;
    return;
  }

  try {
    loading.value = true;
    const { data } = await request.get("/articles", {
      params: {
        q: filters.q,
        page: pagination.page,
        pageSize: pagination.pageSize,
      },
    });
    articles.value = data.data.list;
    pagination.total = data.data.pagination.total;
    setCache(
      cacheKey,
      { data: data.data.list, total: data.data.pagination.total },
      2 * 60 * 1000,
    );
  } catch (_err) {
    ElMessage.error("加载文章失败");
  } finally {
    loading.value = false;
  }
}

function goEditor(id) {
  if (id) {
    router.push(`/articles/${id}/edit`);
  } else {
    router.push("/articles/new");
  }
}

async function removeArticle(id) {
  try {
    await request.delete(`/articles/${id}`);
    removeCache(
      `articles:${filters.q}:${pagination.page}:${pagination.pageSize}`,
    );
    ElMessage.success("删除成功");
    fetchArticles();
  } catch (_err) {
    ElMessage.error("删除失败");
  }
}

onMounted(fetchArticles);
</script>

<template>
  <main class="page">
    <div class="toolbar">
      <el-input
        v-model="filters.q"
        placeholder="搜索标题或内容"
        style="max-width: 280px"
        @keyup.enter="fetchArticles"
      />
      <el-button type="primary" @click="fetchArticles">搜索</el-button>
      <el-button type="success" @click="goEditor()">写文章</el-button>
    </div>

    <el-table
      v-loading="loading"
      :data="articles"
      style="width: 100%; margin-top: 16px"
    >
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="title" label="标题" />
      <el-table-column prop="status" label="状态" width="120" />
      <el-table-column label="操作" width="280">
        <template #default="scope">
          <el-button
            text
            type="primary"
            @click="router.push(`/articles/${scope.row.id}`)"
            >详情</el-button
          >
          <el-button text type="primary" @click="goEditor(scope.row.id)"
            >编辑</el-button
          >
          <el-button text type="danger" @click="removeArticle(scope.row.id)"
            >删除</el-button
          >
        </template>
      </el-table-column>
    </el-table>

    <div class="pager">
      <el-pagination
        v-model:current-page="pagination.page"
        :page-size="pagination.pageSize"
        layout="prev, pager, next"
        :total="pagination.total"
        @current-change="fetchArticles"
      />
    </div>
  </main>
</template>

<style scoped>
.page {
  max-width: 980px;
  margin: 24px auto;
  padding: 0 16px;
}

.toolbar {
  display: flex;
  gap: 8px;
}

.pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
