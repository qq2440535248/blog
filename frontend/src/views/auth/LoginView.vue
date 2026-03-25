<script setup>
import { reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { useAuthStore } from "../../stores/auth";
import { getApiErrorMessage } from "../../utils/request";

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
    ElMessage.success("登录成功");
    const redirect =
      typeof route.query.redirect === "string" ? route.query.redirect : "/";
    router.push(redirect);
  } catch (error) {
    ElMessage.error(
      error?.userMessage || getApiErrorMessage(error, "登录失败"),
    );
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <main class="page">
    <h2>登录</h2>
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="80px"
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
    </el-form>
  </main>
</template>

<style scoped>
.page {
  max-width: 720px;
  margin: 40px auto;
  padding: 0 16px;
}
</style>
