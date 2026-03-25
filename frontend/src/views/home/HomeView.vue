<script setup>
import { ElMessage } from 'element-plus';
import { useAuthStore } from '../../stores/auth';

const authStore = useAuthStore();

async function logout() {
  try {
    await authStore.logout();
    ElMessage.success('已退出登录');
  } catch (_err) {
    ElMessage.error('退出失败，请稍后重试');
  }
}
</script>

<template>
  <main class="page">
    <h1>Person Blog</h1>
    <p>前后端分离博客项目初始化成功。</p>

    <div class="actions">
      <router-link v-if="!authStore.isAuthenticated" to="/login">去登录</router-link>
      <router-link v-if="!authStore.isAuthenticated" to="/register">去注册</router-link>
      <router-link v-if="authStore.isAuthenticated" to="/profile">个人中心</router-link>
      <router-link v-if="authStore.isAuthenticated" to="/change-password">修改密码</router-link>
      <button v-if="authStore.isAuthenticated" type="button" @click="logout">退出登录</button>
    </div>
  </main>
</template>

<style scoped>
.page {
  max-width: 720px;
  margin: 40px auto;
  padding: 0 16px;
}

.actions {
  margin-top: 16px;
  display: flex;
  gap: 12px;
}
</style>
