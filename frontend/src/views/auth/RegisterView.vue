<script setup>
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { useAuthStore } from "../../stores/auth";
import { getApiErrorMessage } from "../../utils/request";

const router = useRouter();
const authStore = useAuthStore();

const loading = ref(false);
const formRef = ref();
const form = reactive({
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
});

const validateConfirmPassword = (_rule, value, callback) => {
  if (!value) {
    callback(new Error("请再次输入密码"));
    return;
  }

  if (value !== form.password) {
    callback(new Error("两次输入的密码不一致"));
    return;
  }

  callback();
};

const rules = {
  username: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    { min: 3, message: "用户名至少 3 位", trigger: "blur" },
  ],
  email: [
    { required: true, message: "请输入邮箱", trigger: "blur" },
    { type: "email", message: "邮箱格式不正确", trigger: "blur" },
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 6, message: "密码至少 6 位", trigger: "blur" },
  ],
  confirmPassword: [
    { required: true, message: "请再次输入密码", trigger: "blur" },
    { validator: validateConfirmPassword, trigger: "blur" },
  ],
};

async function submitRegister() {
  try {
    const valid = await formRef.value?.validate();
    if (!valid) {
      return;
    }

    const payload = {
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password,
    };

    loading.value = true;
    await authStore.register(payload);
    ElMessage.success("注册成功");
    router.push("/");
  } catch (error) {
    ElMessage.error(
      error?.userMessage || getApiErrorMessage(error, "注册失败"),
    );
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
        <h1>创建你的创作空间</h1>
        <p>注册后即可发布文章、管理标签与分类，并在草稿箱中持续打磨内容。</p>
      </aside>

      <section class="auth-card">
        <h2>注册账号</h2>
        <p class="auth-subtitle">填写信息，立即开启你的博客工作台。</p>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          @submit.prevent="submitRegister"
        >
          <el-form-item label="用户名" prop="username">
            <el-input v-model="form.username" placeholder="请输入用户名" />
          </el-form-item>
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
          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input
              v-model="form.confirmPassword"
              type="password"
              show-password
              placeholder="请再次输入密码"
            />
          </el-form-item>
          <el-button type="primary" :loading="loading" @click="submitRegister"
            >注册</el-button
          >
          <router-link class="auth-link" to="/login"
            >已有账号？去登录</router-link
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
