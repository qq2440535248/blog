<script setup>
import { onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import request from "../../utils/request";

const router = useRouter();
const loading = ref(false);
const drafts = ref([]);
const pagination = reactive({ page: 1, pageSize: 10, total: 0 });

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

async function fetchDrafts() {
  try {
    loading.value = true;
    const { data } = await request.get("/drafts", {
      params: {
        page: pagination.page,
        pageSize: pagination.pageSize,
      },
    });
    drafts.value = data.data.list;
    pagination.total = data.data.pagination.total;
  } catch (_err) {
    ElMessage.error("加载草稿失败");
  } finally {
    loading.value = false;
  }
}

function editDraft(id) {
  router.push(`/drafts/${id}/edit`);
}

async function publishDraft(id) {
  try {
    await request.post(`/drafts/${id}/publish`);
    ElMessage.success("草稿发布成功");
    fetchDrafts();
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || "草稿发布失败");
  }
}

async function removeDraft(id) {
  try {
    await request.delete(`/drafts/${id}`);
    ElMessage.success("草稿删除成功");
    fetchDrafts();
  } catch (_err) {
    ElMessage.error("草稿删除失败");
  }
}

onMounted(fetchDrafts);
</script>

<template>
  <main class="draft-page page-block">
    <section class="container">
      <header class="draft-header">
        <div>
          <p class="kicker">DRAFT BOX</p>
          <h1>草稿箱</h1>
          <p>自动保存的内容集中管理，支持继续编辑与一键发布。</p>
        </div>
        <el-button type="primary" @click="router.push('/articles/new')"
          >新建文章</el-button
        >
      </header>

      <el-card class="draft-card" shadow="never">
        <el-table v-loading="loading" :data="drafts" style="width: 100%">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column label="标题" min-width="280">
            <template #default="scope">
              <div class="title-cell">
                <strong>{{ scope.row.title || "未命名草稿" }}</strong>
                <span>{{ scope.row.excerpt || "暂无摘要" }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="更新时间" width="180">
            <template #default="scope">{{ formatDate(scope.row.updatedAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="280" fixed="right">
            <template #default="scope">
              <el-button text type="primary" @click="editDraft(scope.row.id)">
                继续编辑
              </el-button>
              <el-button text type="success" @click="publishDraft(scope.row.id)">
                发布
              </el-button>
              <el-button text type="danger" @click="removeDraft(scope.row.id)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <div class="pager">
        <el-pagination
          v-model:current-page="pagination.page"
          :page-size="pagination.pageSize"
          layout="prev, pager, next"
          :total="pagination.total"
          @current-change="fetchDrafts"
        />
      </div>
    </section>
  </main>
</template>

<style scoped>
.draft-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 14px;
}

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

.draft-header p {
  margin: 0;
  color: var(--color-text-secondary);
}

.draft-card {
  margin-top: 16px;
}

.title-cell {
  display: grid;
  gap: 4px;
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

@media (max-width: 820px) {
  .draft-header {
    flex-direction: column;
  }
}
</style>
