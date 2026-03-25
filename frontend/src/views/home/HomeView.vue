<script setup>
import { onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";
import request from "../../utils/request";
import message from "../../utils/message";

const authStore = useAuthStore();
const router = useRouter();
const loading = ref(false);
const articles = ref([]);
const pagination = reactive({ page: 1, pageSize: 10, total: 0 });
const filters = reactive({ q: "" });

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

function getAuthor(article) {
  return (
    article?.user?.nickname ||
    article?.user?.username ||
    article?.author?.nickname ||
    article?.author?.username ||
    "匿名作者"
  );
}

async function fetchFeed() {
  try {
    loading.value = true;
    const { data } = await request.get("/articles/public", {
      params: {
        q: filters.q,
        page: pagination.page,
        pageSize: pagination.pageSize,
      },
    });

    articles.value = data.data.list || [];
    pagination.total = data.data.pagination?.total || 0;
  } catch (_err) {
    message.error("加载首页文章失败");
  } finally {
    loading.value = false;
  }
}

function doSearch() {
  pagination.page = 1;
  fetchFeed();
}

function clearSearch() {
  filters.q = "";
  pagination.page = 1;
  fetchFeed();
}

async function logout() {
  try {
    await authStore.logout();
    message.success("已退出登录");
  } catch (_err) {
    message.error("退出失败，请稍后重试");
  }
}

onMounted(fetchFeed);
</script>

<template>
  <main class="home-page page-block">
    <section class="container hero">
      <p class="hero-kicker">CONTENT STUDIO</p>
      <h1>社区广场</h1>
      <p class="hero-subtitle">
        在这里发布观点、参与讨论、沉淀内容，让创作与交流同样高效。
      </p>

      <div v-if="!authStore.isAuthenticated" class="hero-actions">
        <router-link class="action-link primary" to="/login"
          >立即登录</router-link
        >
        <router-link class="action-link" to="/register">免费注册</router-link>
      </div>

      <div v-else class="hero-actions">
        <router-link class="action-link primary" to="/articles"
          >进入文章管理</router-link
        >
        <button class="action-link danger" type="button" @click="logout">
          退出登录
        </button>
      </div>
    </section>

    <section class="container feed-block">
      <div class="feed-head">
        <div>
          <p class="feed-kicker">PUBLIC FEED</p>
          <h2>文章广场</h2>
        </div>
        <div class="feed-search">
          <el-input
            v-model="filters.q"
            clearable
            placeholder="搜索公开文章"
            @clear="clearSearch"
            @keyup.enter="doSearch"
          />
          <el-button type="primary" @click="doSearch">搜索</el-button>
        </div>
      </div>

      <div v-loading="loading" class="feed-list">
        <el-empty
          v-if="!loading && !articles.length"
          description="暂无公开文章"
        />

        <article v-for="item in articles" :key="item.id" class="feed-item">
          <h3 @click="router.push(`/articles/${item.id}`)">{{ item.title }}</h3>
          <p>{{ item.excerpt || "暂无摘要" }}</p>
          <div class="feed-meta">
            <span>作者：{{ getAuthor(item) }}</span>
            <span>分类：{{ item.category?.name || "未分类" }}</span>
            <span>发布时间：{{ formatDate(item.createdAt) }}</span>
          </div>
          <div class="feed-tags">
            <el-tag
              v-for="tag in item.tags || []"
              :key="tag.id"
              effect="plain"
              size="small"
            >
              {{ tag.name }}
            </el-tag>
          </div>
        </article>
      </div>

      <div class="feed-pager">
        <el-pagination
          v-model:current-page="pagination.page"
          :page-size="pagination.pageSize"
          :total="pagination.total"
          layout="prev, pager, next"
          @current-change="fetchFeed"
        />
      </div>
    </section>
  </main>
</template>

<style scoped>
.hero {
  background: linear-gradient(135deg, #f8fbff 0%, #eef8f6 100%);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: clamp(24px, 5vw, 48px);
  box-shadow: var(--shadow-md);
}

.hero-kicker {
  margin: 0;
  color: var(--color-primary);
  letter-spacing: 0.18em;
  font-size: 12px;
  font-weight: 700;
}

.hero h1 {
  margin: 12px 0;
  font-size: clamp(30px, 5vw, 52px);
  line-height: 1.08;
}

.hero-subtitle {
  margin: 0;
  max-width: 640px;
  line-height: 1.8;
  color: var(--color-text-secondary);
}

.hero-actions {
  margin-top: 24px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.action-link {
  border: 1px solid var(--color-border);
  background: #ffffff;
  border-radius: 999px;
  padding: 10px 20px;
  text-decoration: none;
  color: var(--color-text);
  font-weight: 700;
  cursor: pointer;
}

.action-link.primary {
  border-color: transparent;
  background: linear-gradient(120deg, #1e6fff 0%, #00a88f 100%);
  color: #ffffff;
}

.action-link.danger {
  border-color: #ffd7d7;
  color: var(--color-danger);
}

.feed-block {
  margin-top: 18px;
}

.feed-head {
  display: flex;
  padding: 0 0 0 5px;
  justify-content: space-between;
  align-items: end;
  gap: 12px;
}

.feed-kicker {
  margin: 0;
  color: var(--color-primary);
  letter-spacing: 0.16em;
  font-size: 12px;
  font-weight: 700;
}

.feed-head h2 {
  margin: 8px 0 0;
}

.feed-search {
  display: flex;
  gap: 10px;
  width: min(460px, 100%);
}

.feed-list {
  margin-top: 14px;
  display: grid;
  gap: 12px;
}

.feed-item {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.9);
  padding: 16px;
}

.feed-item h3 {
  margin: 0;
  cursor: pointer;
}

.feed-item h3:hover {
  color: var(--color-primary);
}

.feed-item p {
  margin: 10px 0;
  color: var(--color-text-secondary);
}

.feed-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 16px;
  color: var(--color-text-secondary);
  font-size: 13px;
}

.feed-tags {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.feed-pager {
  margin-top: 14px;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 900px) {
  .feed-head {
    flex-direction: column;
    align-items: stretch;
  }

  .feed-search {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .feed-search {
    flex-direction: column;
  }
}
</style>
