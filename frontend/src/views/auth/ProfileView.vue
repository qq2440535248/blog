<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import request from "../../utils/request";
import message from "../../utils/message";

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const formRef = ref();
const avatarUploading = ref(false);
const lastAvatarName = ref("");
const likesLoading = ref(false);
const collectionsLoading = ref(false);
const passwordLoading = ref(false);
const likedArticles = ref([]);
const collectedArticles = ref([]);
const likesPagination = reactive({ page: 1, pageSize: 6, total: 0 });
const collectionsPagination = reactive({ page: 1, pageSize: 6, total: 0 });
const tabItems = [
  { key: "profile", label: "个人信息" },
  { key: "security", label: "安全设置" },
  { key: "likes", label: "我的点赞" },
  { key: "collections", label: "我的收藏" },
];

const activeTab = ref("profile");

const form = reactive({
  username: "",
  email: "",
  nickname: "",
  avatarUrl: "",
  bio: "",
});

const passwordFormRef = ref();
const passwordForm = reactive({
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
});

const rules = {
  username: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    { min: 3, message: "用户名至少 3 位", trigger: "blur" },
  ],
  email: [
    { required: true, message: "请输入邮箱", trigger: "blur" },
    { type: "email", message: "邮箱格式不正确", trigger: "blur" },
  ],
  nickname: [{ max: 30, message: "昵称最多 30 个字符", trigger: "blur" }],
};

const validateConfirmPassword = (_rule, value, callback) => {
  if (!value) {
    callback(new Error("请再次输入新密码"));
    return;
  }

  if (value !== passwordForm.newPassword) {
    callback(new Error("两次输入的新密码不一致"));
    return;
  }

  callback();
};

const passwordRules = {
  oldPassword: [{ required: true, message: "请输入旧密码", trigger: "blur" }],
  newPassword: [
    { required: true, message: "请输入新密码", trigger: "blur" },
    { min: 6, message: "新密码至少 6 位", trigger: "blur" },
  ],
  confirmPassword: [
    { required: true, message: "请再次输入新密码", trigger: "blur" },
    { validator: validateConfirmPassword, trigger: "blur" },
  ],
};

const activeTabTitle = computed(
  () =>
    tabItems.find((item) => item.key === activeTab.value)?.label || "个人中心",
);

const activeTabKicker = computed(() => {
  const map = {
    profile: "PROFILE SETTINGS",
    security: "SECURITY SETTINGS",
    likes: "MY LIKES",
    collections: "MY COLLECTIONS",
  };

  return map[activeTab.value] || "USER CENTER";
});

function normalizeTab(tab) {
  return tabItems.some((item) => item.key === tab) ? tab : "profile";
}

function switchTab(tab) {
  const normalized = normalizeTab(tab);
  activeTab.value = normalized;
  router.replace({ query: { ...route.query, tab: normalized } });
}

function goArticleDetail(id) {
  router.push(`/articles/${id}`);
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
  ).padStart(2, "0")}`;
}

function beforeAvatarUpload(file) {
  const isImage = file.type?.startsWith("image/");
  if (!isImage) {
    message.error("仅支持上传图片文件");
    return false;
  }

  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    message.error("头像大小不能超过 2MB");
    return false;
  }

  return true;
}

async function uploadAvatarRequest(option) {
  try {
    avatarUploading.value = true;
    const formData = new FormData();
    formData.append("avatar", option.file);

    const { data } = await request.post("/users/me/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    form.avatarUrl = data.data.avatarUrl || "";
    lastAvatarName.value = option.file?.name || "";
    message.success("头像上传成功");
    option.onSuccess?.(data.data);
  } catch (error) {
    message.error(error?.response?.data?.message || "头像上传失败");
    option.onError?.(error);
  } finally {
    avatarUploading.value = false;
  }
}

async function fetchProfile() {
  try {
    const { data } = await request.get("/users/me");
    const profile = data.data;
    form.username = profile.username || "";
    form.email = profile.email || "";
    form.nickname = profile.nickname || "";
    form.avatarUrl = profile.avatarUrl || "";
    form.bio = profile.bio || "";
  } catch (_err) {
    message.error("加载个人信息失败");
  }
}

async function fetchMyLikes() {
  try {
    likesLoading.value = true;
    const { data } = await request.get("/users/me/likes", {
      params: {
        page: likesPagination.page,
        pageSize: likesPagination.pageSize,
      },
    });
    likedArticles.value = data.data.list || [];
    likesPagination.total = data.data.pagination?.total || 0;
  } catch (_err) {
    likedArticles.value = [];
  } finally {
    likesLoading.value = false;
  }
}

async function fetchMyCollections() {
  try {
    collectionsLoading.value = true;
    const { data } = await request.get("/users/me/collections", {
      params: {
        page: collectionsPagination.page,
        pageSize: collectionsPagination.pageSize,
      },
    });
    collectedArticles.value = data.data.list || [];
    collectionsPagination.total = data.data.pagination?.total || 0;
  } catch (_err) {
    collectedArticles.value = [];
  } finally {
    collectionsLoading.value = false;
  }
}

async function saveProfile() {
  if (loading.value) {
    return;
  }

  try {
    loading.value = true;
    const valid = await formRef.value?.validate().catch(() => false);
    if (!valid) {
      loading.value = false;
      return;
    }

    await request.put("/users/me", {
      username: form.username.trim(),
      email: form.email.trim(),
      nickname: form.nickname.trim(),
      bio: form.bio.trim(),
    });
    message.success("保存成功");
  } catch (error) {
    message.error(error?.response?.data?.message || "保存失败");
  } finally {
    loading.value = false;
  }
}

async function submitChangePassword() {
  try {
    const valid = await passwordFormRef.value?.validate();
    if (!valid) {
      return;
    }

    passwordLoading.value = true;
    await request.put("/users/me/password", {
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
    });

    passwordForm.oldPassword = "";
    passwordForm.newPassword = "";
    passwordForm.confirmPassword = "";
    message.success("密码修改成功");
  } catch (error) {
    message.error(error?.response?.data?.message || "密码修改失败");
  } finally {
    passwordLoading.value = false;
  }
}

watch(
  () => route.query.tab,
  (tab) => {
    activeTab.value = normalizeTab(String(tab || "profile"));
  },
  { immediate: true },
);

watch(
  () => activeTab.value,
  (tab) => {
    if (tab === "likes") {
      fetchMyLikes();
    }

    if (tab === "collections") {
      fetchMyCollections();
    }
  },
);

onMounted(async () => {
  await fetchProfile();
  if (activeTab.value === "likes") {
    await fetchMyLikes();
  }

  if (activeTab.value === "collections") {
    await fetchMyCollections();
  }
});
</script>

<template>
  <main class="profile-page page-block">
    <section class="container profile-shell">
      <aside class="profile-side">
        <div class="user-card">
          <el-avatar :size="72" :src="form.avatarUrl">
            {{ form.username ? form.username[0]?.toUpperCase() : "U" }}
          </el-avatar>
          <h3>{{ form.nickname || form.username || "未命名用户" }}</h3>
          <p>{{ form.email || "-" }}</p>
        </div>

        <button
          v-for="item in tabItems"
          :key="item.key"
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === item.key }"
          @click="switchTab(item.key)"
        >
          {{ item.label }}
        </button>
      </aside>

      <section class="profile-main">
        <header class="main-head">
          <p class="kicker">{{ activeTabKicker }}</p>
          <h2>{{ activeTabTitle }}</h2>
        </header>

        <el-form
          v-if="activeTab === 'profile'"
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
        >
          <div class="grid-2">
            <el-form-item label="用户名" prop="username">
              <el-input v-model="form.username" />
            </el-form-item>
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="form.email" />
            </el-form-item>
          </div>
          <el-form-item label="昵称" prop="nickname">
            <el-input v-model="form.nickname" placeholder="展示给他人的名称" />
          </el-form-item>
          <el-form-item label="头像上传">
            <el-upload
              class="avatar-uploader"
              :show-file-list="false"
              drag
              :before-upload="beforeAvatarUpload"
              :http-request="uploadAvatarRequest"
            >
              <div
                class="upload-dragger"
                :class="{ uploading: avatarUploading }"
              >
                <div class="upload-main">拖拽图片到这里，或点击上传</div>
                <div class="upload-sub">
                  支持 JPG/PNG/GIF/WebP，大小不超过 2MB
                </div>
              </div>
            </el-upload>
            <div class="avatar-preview" v-if="form.avatarUrl">
              <el-image :src="form.avatarUrl" fit="cover" />
              <p>已上传：{{ lastAvatarName || "头像图片" }}</p>
            </div>
          </el-form-item>
          <el-form-item label="简介">
            <el-input
              v-model="form.bio"
              type="textarea"
              :rows="4"
              maxlength="160"
              show-word-limit
              placeholder="用一句话介绍你自己"
            />
          </el-form-item>
          <el-button type="primary" :loading="loading" @click="saveProfile">
            保存资料
          </el-button>
        </el-form>

        <el-form
          v-if="activeTab === 'security'"
          ref="passwordFormRef"
          :rules="passwordRules"
          :model="passwordForm"
          label-position="top"
          @submit.prevent="submitChangePassword"
        >
          <el-form-item label="旧密码" prop="oldPassword">
            <el-input
              v-model="passwordForm.oldPassword"
              type="password"
              show-password
              placeholder="请输入旧密码"
            />
          </el-form-item>
          <el-form-item label="新密码" prop="newPassword">
            <el-input
              v-model="passwordForm.newPassword"
              type="password"
              show-password
              placeholder="请输入新密码"
            />
          </el-form-item>
          <el-form-item label="确认新密码" prop="confirmPassword">
            <el-input
              v-model="passwordForm.confirmPassword"
              type="password"
              show-password
              placeholder="请再次输入新密码"
            />
          </el-form-item>
          <el-button
            type="primary"
            :loading="passwordLoading"
            @click="submitChangePassword"
          >
            提交修改
          </el-button>
        </el-form>

        <section
          v-if="activeTab === 'likes'"
          class="list-tab"
          v-loading="likesLoading"
        >
          <el-empty
            v-if="!likesLoading && !likedArticles.length"
            description="暂无点赞文章"
          />
          <article
            v-for="item in likedArticles"
            :key="`like-${item.id}`"
            class="interest-item"
          >
            <h3 @click="goArticleDetail(item.id)">
              {{ item.title || "未命名文章" }}
            </h3>
            <p>{{ item.excerpt || "暂无摘要" }}</p>
            <div class="item-meta">
              <span
                >更新时间：{{
                  formatDate(item.updatedAt || item.createdAt)
                }}</span
              >
            </div>
          </article>
          <div class="pager-wrap">
            <el-pagination
              v-model:current-page="likesPagination.page"
              :page-size="likesPagination.pageSize"
              :total="likesPagination.total"
              layout="prev, pager, next"
              @current-change="fetchMyLikes"
            />
          </div>
        </section>

        <section
          v-if="activeTab === 'collections'"
          class="list-tab"
          v-loading="collectionsLoading"
        >
          <el-empty
            v-if="!collectionsLoading && !collectedArticles.length"
            description="暂无收藏文章"
          />
          <article
            v-for="item in collectedArticles"
            :key="`collect-${item.id}`"
            class="interest-item"
          >
            <h3 @click="goArticleDetail(item.id)">
              {{ item.title || "未命名文章" }}
            </h3>
            <p>{{ item.excerpt || "暂无摘要" }}</p>
            <div class="item-meta">
              <span
                >更新时间：{{
                  formatDate(item.updatedAt || item.createdAt)
                }}</span
              >
            </div>
          </article>
          <div class="pager-wrap">
            <el-pagination
              v-model:current-page="collectionsPagination.page"
              :page-size="collectionsPagination.pageSize"
              :total="collectionsPagination.total"
              layout="prev, pager, next"
              @current-change="fetchMyCollections"
            />
          </div>
        </section>
      </section>
    </section>
  </main>
</template>

<style scoped>
.profile-shell {
  display: grid;
  grid-template-columns: minmax(240px, 260px) minmax(0, 1fr);
  gap: 14px;
}

.profile-side {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.92);
  padding: 14px;
  display: grid;
  align-content: start;
  gap: 8px;
}

.user-card {
  display: grid;
  justify-items: center;
  text-align: center;
  padding: 8px 0 12px;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 4px;
}

.user-card h3 {
  margin: 10px 0 0;
}

.user-card p {
  margin: 6px 0 0;
  color: var(--color-text-secondary);
  font-size: 14px;
  word-break: break-all;
  overflow-wrap: anywhere;
}

.tab-btn {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: #ffffff;
  color: var(--color-text);
  text-align: center;
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px;
  font-weight: 600;
  cursor: pointer;
}

.tab-btn.active {
  border-color: #bdd3ff;
  background: #eef4ff;
  color: var(--color-primary-strong);
}

.profile-main {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.92);
  padding: 16px;
}

.main-head {
  margin-bottom: 12px;
}

.kicker {
  margin: 0;
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.16em;
}

h2 {
  margin: 8px 0 0;
  font-size: clamp(24px, 3vw, 34px);
}

.grid-2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.avatar-uploader {
  width: 100%;
}

.upload-dragger {
  width: 100%;
  border: 1px dashed var(--color-border);
  background: #f7faff;
  border-radius: var(--radius-sm);
  padding: 16px;
  text-align: center;
}

.upload-dragger.uploading {
  opacity: 0.7;
}

.upload-main {
  font-weight: 700;
  color: var(--color-text);
}

.upload-sub {
  margin-top: 6px;
  color: var(--color-text-secondary);
  font-size: 12px;
}

.avatar-preview {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar-preview .el-image {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 1px solid var(--color-border);
}

.avatar-preview p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 13px;
}

.list-tab {
  display: grid;
  gap: 10px;
}

.interest-item {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: #f9fbff;
  padding: 12px;
}

.interest-item h3 {
  margin: 0;
  cursor: pointer;
}

.interest-item h3:hover {
  color: var(--color-primary);
}

.interest-item p {
  margin: 8px 0;
  color: var(--color-text-secondary);
}

.item-meta {
  color: var(--color-text-secondary);
  font-size: 13px;
}

.pager-wrap {
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 900px) {
  .profile-shell {
    grid-template-columns: 1fr;
  }

  .grid-2 {
    grid-template-columns: 1fr;
  }
}
</style>
