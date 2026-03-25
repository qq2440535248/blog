<script setup>
import { onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import request from "../../utils/request";

const loading = ref(false);
const formRef = ref();
const form = reactive({
  username: "",
  email: "",
  nickname: "",
  avatarUrl: "",
  bio: "",
});

const rules = {
  nickname: [{ max: 30, message: "昵称最多 30 个字符", trigger: "blur" }],
  avatarUrl: [
    {
      validator: (_rule, value, callback) => {
        if (!value) {
          callback();
          return;
        }

        const ok = /^https?:\/\/.+/i.test(value.trim());
        callback(ok ? undefined : new Error("头像地址需以 http:// 或 https:// 开头"));
      },
      trigger: "blur",
    },
  ],
};

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
    ElMessage.error("加载个人信息失败");
  }
}

async function saveProfile() {
  try {
    const valid = await formRef.value?.validate();
    if (!valid) {
      return;
    }

    loading.value = true;
    await request.put("/users/me", {
      nickname: form.nickname.trim(),
      avatarUrl: form.avatarUrl.trim(),
      bio: form.bio.trim(),
    });
    ElMessage.success("保存成功");
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || "保存失败");
  } finally {
    loading.value = false;
  }
}

onMounted(fetchProfile);
</script>

<template>
  <main class="profile-page page-block">
    <section class="container profile-shell">
      <el-card class="profile-side" shadow="never">
        <el-avatar :size="84" :src="form.avatarUrl">
          {{ form.username ? form.username[0]?.toUpperCase() : "U" }}
        </el-avatar>
        <h3>{{ form.nickname || form.username || "未命名用户" }}</h3>
        <p>{{ form.email || "-" }}</p>
      </el-card>

      <el-card class="profile-main" shadow="never">
        <p class="kicker">PROFILE SETTINGS</p>
        <h2>个人信息</h2>
        <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
          <div class="grid-2">
            <el-form-item label="用户名">
              <el-input v-model="form.username" disabled />
            </el-form-item>
            <el-form-item label="邮箱">
              <el-input v-model="form.email" disabled />
            </el-form-item>
          </div>
          <el-form-item label="昵称" prop="nickname">
            <el-input v-model="form.nickname" placeholder="展示给他人的名称" />
          </el-form-item>
          <el-form-item label="头像 URL" prop="avatarUrl">
            <el-input
              v-model="form.avatarUrl"
              placeholder="https://example.com/avatar.png"
            />
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
      </el-card>
    </section>
  </main>
</template>

<style scoped>
.profile-shell {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 14px;
}

.profile-side {
  display: grid;
  align-content: start;
  justify-items: center;
  text-align: center;
  gap: 10px;
  padding-block: 26px;
  background: rgba(255, 255, 255, 0.92);
}

.profile-side h3 {
  margin: 2px 0 0;
}

.profile-side p {
  margin: 0;
  color: var(--color-text-secondary);
}

.profile-main {
  background: rgba(255, 255, 255, 0.92);
}

.kicker {
  margin: 0;
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.16em;
}

h2 {
  margin: 10px 0 18px;
  font-size: clamp(24px, 3vw, 34px);
}

.grid-2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
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
