<script setup>
import { onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import request from "../../utils/request";

const router = useRouter();
const loading = ref(false);
const drafts = ref([]);
const pagination = reactive({ page: 1, pageSize: 10, total: 0 });

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
  <main class="page">
    <div class="toolbar">
      <el-button type="primary" @click="router.push('/articles/new')"
        >新建文章</el-button
      >
    </div>

    <el-table
      v-loading="loading"
      :data="drafts"
      style="width: 100%; margin-top: 16px"
    >
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="title" label="标题" />
      <el-table-column prop="updatedAt" label="更新时间" width="220" />
      <el-table-column label="操作" width="320">
        <template #default="scope">
          <el-button text type="primary" @click="editDraft(scope.row.id)"
            >继续编辑</el-button
          >
          <el-button text type="success" @click="publishDraft(scope.row.id)"
            >发布</el-button
          >
          <el-button text type="danger" @click="removeDraft(scope.row.id)"
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
        @current-change="fetchDrafts"
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
  justify-content: space-between;
}

.pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
