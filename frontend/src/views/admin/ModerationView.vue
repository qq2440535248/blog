<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import request from "../../utils/request";
import message from "../../utils/message";
import { useAuthStore } from "../../stores/auth";

const authStore = useAuthStore();
const router = useRouter();
const loading = ref(false);
const actionLoadingId = ref(0);
const list = ref([]);
const logsLoading = ref(false);
const selectedArticleId = ref(0);
const logs = ref([]);
const logsError = ref("");
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
});
const filters = reactive({
  q: "",
  status: "",
});

const isAdmin = computed(() => authStore.profile?.role === "admin");

function getAuthor(item) {
  return item?.user?.nickname || item?.user?.username || "匿名作者";
}

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
  ).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
}

async function fetchList() {
  if (!isAdmin.value) {
    return;
  }

  try {
    loading.value = true;
    const { data } = await request.get("/articles/moderation", {
      params: {
        q: filters.q,
        status: filters.status,
        page: pagination.page,
        pageSize: pagination.pageSize,
      },
    });

    list.value = data.data.list || [];
    pagination.total = data.data.pagination?.total || 0;
  } catch (error) {
    message.error(error?.response?.data?.message || "加载治理列表失败");
  } finally {
    loading.value = false;
  }
}

function getAdminName(adminUser) {
  return adminUser?.nickname || adminUser?.username || "管理员";
}

async function fetchLogs(articleId) {
  if (!articleId) {
    logsError.value = "";
    logs.value = [];
    return;
  }

  try {
    logsLoading.value = true;
    logsError.value = "";
    const { data } = await request.get(
      `/articles/${articleId}/moderation-logs`,
    );
    logs.value = data?.data?.list || [];
  } catch (error) {
    logs.value = [];
    logsError.value = error?.response?.data?.message || "加载治理日志失败";
    message.error(logsError.value);
  } finally {
    logsLoading.value = false;
  }
}

async function bootstrap() {
  try {
    if (!authStore.profile && authStore.isAuthenticated) {
      await authStore.fetchMe();
    }

    if (!isAdmin.value) {
      message.error("仅管理员可访问治理台");
      router.replace("/");
      return;
    }

    await fetchList();
  } catch (_err) {
    router.replace("/");
  }
}

function doSearch() {
  pagination.page = 1;
  fetchList();
}

function resetFilters() {
  filters.q = "";
  filters.status = "";
  pagination.page = 1;
  fetchList();
}

async function changeStatus(item, targetStatus) {
  const actionText = targetStatus === "draft" ? "下架" : "恢复发布";
  // 使用浏览器原生交互兜底，避免弹层异常导致“点击无反应”。
  const confirmed = window.confirm(`确认要${actionText}这篇文章吗？`);
  if (!confirmed) {
    return;
  }

  const reasonInput = window.prompt(
    `可选：填写${actionText}原因（最多 200 字）`,
    "",
  );
  if (reasonInput === null) {
    return;
  }

  const reason = String(reasonInput || "")
    .trim()
    .slice(0, 200);

  try {
    actionLoadingId.value = item.id;
    const endpoint =
      targetStatus === "draft"
        ? `/articles/${item.id}/takedown`
        : `/articles/${item.id}/restore`;
    await request.patch(endpoint, { reason });
    message.success(`${actionText}成功`);
    await fetchList();
    await fetchLogs(item.id);
  } catch (error) {
    message.error(error?.response?.data?.message || `${actionText}失败`);
  } finally {
    actionLoadingId.value = 0;
  }
}

async function openLogs(item) {
  // 先给用户即时反馈，再发起日志请求。
  selectedArticleId.value = item.id;
  logsError.value = "";
  message.info(`正在加载文章 ${item.id} 的治理日志`);
  await fetchLogs(item.id);
}

onMounted(bootstrap);
</script>

<template>
  <main class="moderation-page page-block">
    <section class="container moderation-shell">
      <header class="moderation-head">
        <div>
          <p class="kicker">MODERATION CONSOLE</p>
          <h1>内容治理台</h1>
          <p>管理员可统一查看文章并执行下架/恢复发布操作。</p>
        </div>
        <el-button plain @click="router.push('/')">返回首页</el-button>
      </header>

      <section class="filter-card">
        <el-input
          v-model="filters.q"
          clearable
          placeholder="搜索标题或正文关键字"
          @keyup.enter="doSearch"
        />
        <el-select v-model="filters.status" placeholder="全部状态" clearable>
          <el-option label="已发布" value="published" />
          <el-option label="草稿" value="draft" />
        </el-select>
        <el-button type="primary" @click="doSearch">查询</el-button>
        <el-button @click="resetFilters">重置</el-button>
      </section>

      <section class="list-block" v-loading="loading">
        <el-empty
          v-if="!loading && !list.length"
          description="暂无可治理文章"
        />

        <article v-for="item in list" :key="item.id" class="item-card">
          <div class="item-head">
            <h3 @click="router.push(`/articles/${item.id}`)">
              {{ item.title || "未命名文章" }}
            </h3>
            <el-tag
              :type="item.status === 'published' ? 'success' : 'warning'"
              effect="light"
            >
              {{ item.status === "published" ? "已发布" : "草稿" }}
            </el-tag>
          </div>
          <p class="item-excerpt">{{ item.excerpt || "暂无摘要" }}</p>
          <div class="item-meta">
            <span>作者：{{ getAuthor(item) }}</span>
            <span>分类：{{ item.category?.name || "未分类" }}</span>
            <span
              >更新：{{ formatDate(item.updatedAt || item.createdAt) }}</span
            >
          </div>
          <div class="item-actions">
            <el-button plain @click="openLogs(item)">查看日志</el-button>
            <el-button
              v-if="item.status === 'published'"
              type="warning"
              plain
              :loading="actionLoadingId === item.id"
              @click="changeStatus(item, 'draft')"
            >
              下架
            </el-button>
            <el-button
              v-else
              type="success"
              plain
              :loading="actionLoadingId === item.id"
              @click="changeStatus(item, 'published')"
            >
              恢复发布
            </el-button>
          </div>
        </article>
      </section>

      <section class="logs-block" v-loading="logsLoading">
        <h3>治理日志</h3>
        <p v-if="!selectedArticleId" class="logs-empty">
          请选择一篇文章查看最近 20 条日志
        </p>
        <p v-else class="logs-tip">当前文章 ID：{{ selectedArticleId }}</p>
        <p v-if="logsError" class="logs-error">{{ logsError }}</p>
        <el-empty
          v-if="selectedArticleId && !logsLoading && !logs.length"
          description="暂无治理日志"
        />
        <article v-for="item in logs" :key="item.id" class="log-item">
          <div class="log-head">
            <strong>{{
              item.action === "takedown" ? "下架" : "恢复发布"
            }}</strong>
            <span>{{ formatDate(item.createdAt) }}</span>
          </div>
          <p>操作人：{{ getAdminName(item.adminUser) }}</p>
          <p>原因：{{ item.reason || "未填写" }}</p>
        </article>
      </section>

      <footer class="pager-wrap">
        <el-pagination
          v-model:current-page="pagination.page"
          :page-size="pagination.pageSize"
          :total="pagination.total"
          layout="prev, pager, next"
          @current-change="fetchList"
        />
      </footer>
    </section>
  </main>
</template>

<style scoped>
.moderation-head {
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: linear-gradient(130deg, #eef5ff 0%, #f4f9f1 100%);
  padding: clamp(16px, 3vw, 28px);
}

.kicker {
  margin: 0;
  color: var(--color-primary);
  letter-spacing: 0.16em;
  font-size: 12px;
  font-weight: 700;
}

h1 {
  margin: 8px 0;
  font-size: clamp(28px, 4vw, 38px);
}

.moderation-head p {
  margin: 0;
  color: var(--color-text-secondary);
}

.filter-card {
  margin-top: 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: #ffffff;
  padding: 12px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 160px auto auto;
  gap: 10px;
}

.list-block {
  margin-top: 14px;
  display: grid;
  gap: 12px;
}

.item-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.92);
  padding: 14px;
}

.item-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.item-head h3 {
  margin: 0;
  cursor: pointer;
}

.item-head h3:hover {
  color: var(--color-primary);
}

.item-excerpt {
  margin: 10px 0;
  color: var(--color-text-secondary);
}

.item-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 14px;
  color: var(--color-text-secondary);
  font-size: 13px;
}

.item-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.logs-block {
  margin-top: 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: #ffffff;
  padding: 12px;
}

.logs-block h3 {
  margin: 0;
}

.logs-empty,
.logs-tip {
  margin: 10px 0;
  color: var(--color-text-secondary);
}

.logs-error {
  margin: 10px 0;
  color: #c0392b;
  font-weight: 600;
}

.log-item {
  border-top: 1px dashed #dbe5f4;
  margin-top: 10px;
  padding-top: 10px;
}

.log-head {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.pager-wrap {
  margin-top: 14px;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 900px) {
  .moderation-head {
    flex-direction: column;
  }

  .filter-card {
    grid-template-columns: 1fr;
  }
}
</style>
