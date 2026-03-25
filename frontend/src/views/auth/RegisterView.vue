<script setup>
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { useAuthStore } from "../../stores/auth";

const router = useRouter();
const authStore = useAuthStore();

const loading = ref(false);
const form = reactive({
  username: "",
  email: "",
  password: "",
});

async function submitRegister() {
  try {
    loading.value = true;
    await authStore.register(form);
    ElMessage.success("注册成功");
    router.push("/");
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || "注册失败");
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <main class="page">
    <h2>注册</h2>
    <el-form :model="form" label-width="90px" @submit.prevent="submitRegister">
      <el-form-item label="用户名">
        <el-input v-model="form.username" placeholder="请输入用户名" />
      </el-form-item>
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
      <el-button type="primary" :loading="loading" @click="submitRegister"
        >注册</el-button
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
