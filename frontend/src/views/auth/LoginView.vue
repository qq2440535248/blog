<script setup>
import { reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";
import { getApiErrorMessage } from "../../utils/request";
import message from "../../utils/message";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const loading = ref(false);
const formRef = ref();
const form = reactive({
  email: "",
  password: "",
});

const rules = {
  email: [
    { required: true, message: "请输入邮箱", trigger: "blur" },
    { type: "email", message: "邮箱格式不正确", trigger: "blur" },
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 6, message: "密码至少 6 位", trigger: "blur" },
  ],
};

async function submitLogin() {
  try {
    // 先走表单校验，避免发送无效请求。
    const valid = await formRef.value?.validate();
    if (!valid) {
      return;
    }

    const payload = {
      email: form.email.trim(),
      password: form.password,
    };

    loading.value = true;
    await authStore.login(payload);
    message.success("登录成功");
    // 支持登录后回跳到受保护页面。
    const redirect =
      typeof route.query.redirect === "string" ? route.query.redirect : "/";
    router.push(redirect);
  } catch (error) {
    message.error(error?.userMessage || getApiErrorMessage(error, "登录失败"));
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <main class="auth-page page-block">
    <section class="auth-shell container">
      <aside class="auth-brand">
        <p class="brand-kicker">PERSON BLOG</p>
        <h1>登录后继续你的写作节奏</h1>
        <p>进入工作台后可统一管理文章、草稿、分类与标签，快速完成发布与治理。</p>
      </aside>

      <section class="auth-card">
        <h2>登录账号</h2>
        <p class="auth-subtitle">欢迎回来，立即进入内容管理台。</p>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          @submit.prevent="submitLogin"
        >
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="form.email" placeholder="请输入邮箱" />
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              show-password
              placeholder="请输入密码"
            />
          </el-form-item>
          <el-button type="primary" :loading="loading" @click="submitLogin"
            >登录</el-button
          >
          <router-link class="auth-link" to="/register"
            >没有账号？去注册</router-link
          >
        </el-form>
      </section>
    </section>
  </main>
</template>

<style scoped>
.auth-shell {
  min-height: calc(100vh - 120px);
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  align-items: center;
  gap: clamp(18px, 4vw, 42px);
}

.auth-brand {
  padding: clamp(20px, 4vw, 30px);
}

.brand-kicker {
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.18em;
  color: var(--color-primary);
  font-weight: 700;
}

.auth-brand h1 {
  margin: 14px 0 12px;
  font-size: clamp(32px, 5vw, 48px);
  line-height: 1.1;
}

.auth-brand p {
  margin: 0;
  max-width: 440px;
  color: var(--color-text-secondary);
  line-height: 1.7;
}

.auth-card {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  backdrop-filter: blur(6px);
  padding: clamp(20px, 4vw, 30px);
}

.auth-card h2 {
  margin: 0;
  font-size: 28px;
}

.auth-subtitle {
  margin: 10px 0 24px;
  color: var(--color-text-secondary);
}

.el-button {
  width: 100%;
  margin-top: 8px;
}

.auth-link {
  margin-top: 16px;
  display: inline-flex;
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 600;
}

.auth-link:hover {
  color: var(--color-primary-strong);
}

@media (max-width: 900px) {
  .auth-shell {
    min-height: auto;
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .auth-brand {
    padding: 6px 4px;
  }
}
</style>
