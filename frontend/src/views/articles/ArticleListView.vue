<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import request from "../../utils/request";
import { getCache, removeCache, setCache } from "../../utils/cache";
import message from "../../utils/message";

const router = useRouter();
const loading = ref(false);
const articles = ref([]);
const pagination = reactive({ page: 1, pageSize: 10, total: 0 });
const filters = reactive({ q: "" });
const hasArticles = computed(() => articles.value.length > 0);
const statusTextMap = {
  published: "已发布",
  draft: "草稿",
};

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
    message.error("加载文章失败");
  } finally {
    loading.value = false;
  }
}

function doSearch() {
  pagination.page = 1;
  fetchArticles();
}

function clearSearch() {
  filters.q = "";
  pagination.page = 1;
  fetchArticles();
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
    message.success("删除成功");
    fetchArticles();
  } catch (_err) {
    message.error("删除失败");
  }
}

async function moveToDraft(id) {
  const confirmed = window.confirm("确认将这篇文章下架并移入草稿箱吗？");
  if (!confirmed) {
    return;
  }

  try {
    await request.patch(`/articles/${id}/move-to-draft`);
    removeCache(
      `articles:${filters.q}:${pagination.page}:${pagination.pageSize}`,
    );
    message.success("已下架到草稿箱");
    fetchArticles();
  } catch (error) {
    message.error(error?.response?.data?.message || "下架到草稿箱失败");
  }
}

onMounted(fetchArticles);
</script>

<template>
  <main class="article-list page-block">
    <section class="container">
      <header class="list-header">
        <div>
          <p class="kicker">ARTICLE CENTER</p>
          <h1>文章管理</h1>
          <p>快速检索、编辑与维护你的内容资产。</p>
        </div>
        <el-button type="success" @click="goEditor()">写新文章</el-button>
      </header>

      <el-card class="toolbar-card" shadow="never">
        <div class="toolbar">
          <el-input
            v-model="filters.q"
            placeholder="搜索标题或内容"
            clearable
            @clear="clearSearch"
            @keyup.enter="doSearch"
          />
          <el-button type="primary" @click="doSearch">搜索</el-button>
        </div>
      </el-card>

      <el-card class="table-card" shadow="never">
        <div class="table-wrap">
          <el-table v-loading="loading" :data="articles" style="width: 100%">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column label="标题" min-width="280">
              <template #default="scope">
                <div class="title-cell">
                  <strong>{{ scope.row.title }}</strong>
                  <span>{{ scope.row.excerpt || "暂无摘要" }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="120">
              <template #default="scope">
                <el-tag
                  :type="scope.row.status === 'published' ? 'success' : 'info'"
                >
                  {{ statusTextMap[scope.row.status] || scope.row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="380" fixed="right">
              <template #default="scope">
                <div class="table-actions">
                  <el-button
                    text
                    type="primary"
                    @click="router.push(`/articles/${scope.row.id}`)"
                  >
                    详情
                  </el-button>
                  <el-button text type="primary" @click="goEditor(scope.row.id)">
                    编辑
                  </el-button>
                  <el-button
                    v-if="scope.row.status === 'published'"
                    text
                    type="warning"
                    @click="moveToDraft(scope.row.id)"
                  >
                    下架到草稿箱
                  </el-button>
                  <el-button
                    text
                    type="danger"
                    @click="removeArticle(scope.row.id)"
                  >
                    删除
                  </el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="mobile-cards">
          <el-card
            v-for="item in articles"
            :key="item.id"
            class="mobile-card"
            shadow="never"
          >
            <div class="mobile-card-top">
              <strong>{{ item.title || "未命名文章" }}</strong>
              <el-tag :type="item.status === 'published' ? 'success' : 'info'">
                {{ statusTextMap[item.status] || item.status }}
              </el-tag>
            </div>
            <p>{{ item.excerpt || "暂无摘要" }}</p>
            <div class="mobile-actions">
              <el-button
                text
                type="primary"
                @click="router.push(`/articles/${item.id}`)"
              >
                详情
              </el-button>
              <el-button text type="primary" @click="goEditor(item.id)"
                >编辑</el-button
              >
              <el-button
                v-if="item.status === 'published'"
                text
                type="warning"
                @click="moveToDraft(item.id)"
              >
                下架到草稿箱
              </el-button>
              <el-button text type="danger" @click="removeArticle(item.id)"
                >删除</el-button
              >
            </div>
          </el-card>
        </div>

        <el-empty
          v-if="!loading && !hasArticles"
          description="没有找到匹配文章"
        />
      </el-card>

      <div class="pager">
        <el-pagination
          v-model:current-page="pagination.page"
          :page-size="pagination.pageSize"
          layout="prev, pager, next"
          :total="pagination.total"
          @current-change="fetchArticles"
        />
      </div>
    </section>
  </main>
</template>

<style scoped>
.list-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 14px;
}

.kicker {
  margin: 0;
  color: var(--color-primary);
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.16em;
}

h1 {
  margin: 8px 0;
  font-size: clamp(26px, 3vw, 36px);
}

.list-header p {
  margin: 0;
  color: var(--color-text-secondary);
}

.toolbar {
  display: flex;
  gap: 10px;
}

.toolbar-card {
  margin-top: 16px;
}

.table-card {
  margin-top: 14px;
}

.table-wrap {
  overflow-x: auto;
}

.table-actions {
  display: inline-flex;
  align-items: center;
  flex-wrap: nowrap;
  white-space: nowrap;
}

.title-cell {
  display: grid;
  gap: 4px;
}

.title-cell strong {
  color: var(--color-text);
}

.title-cell span {
  color: var(--color-text-secondary);
  font-size: 13px;
}

.pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.mobile-cards {
  display: none;
  margin-top: 10px;
  gap: 10px;
}

.mobile-card {
  border: 1px solid var(--color-border);
}

.mobile-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.mobile-card p {
  color: var(--color-text-secondary);
  margin: 10px 0;
}

.mobile-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

@media (max-width: 820px) {
  .list-header {
    flex-direction: column;
  }

  .toolbar {
    flex-direction: column;
  }

  .table-wrap {
    display: none;
  }

  .mobile-cards {
    display: grid;
  }
}
</style>
