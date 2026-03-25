<script setup>
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { useAuthStore } from "../../stores/auth";
import { getApiErrorMessage } from "../../utils/request";

const router = useRouter();
const authStore = useAuthStore();

const loading = ref(false);
const form = reactive({
  email: "",
  password: "",
});

async function submitLogin() {
  try {
    loading.value = true;
    await authStore.login(form);
    ElMessage.success("登录成功");
    router.push("/");
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
    <el-form :model="form" label-width="80px" @submit.prevent="submitLogin">
      <el-form-item label="邮箱">
        <el-input v-model="form.email" placeholder="请输入邮箱" />
      </el-form-item>
      <el-form-item label="密码">
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
