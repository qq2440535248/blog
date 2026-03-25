<script setup>
import { reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import request from '../../utils/request';

const loading = ref(false);
const form = reactive({
  oldPassword: '',
  newPassword: '',
});

async function submitChangePassword() {
  try {
    loading.value = true;
    await request.put('/users/me/password', {
      oldPassword: form.oldPassword,
      newPassword: form.newPassword,
    });
    ElMessage.success('密码修改成功');
    form.oldPassword = '';
    form.newPassword = '';
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || '密码修改失败');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <main class="page">
    <h2>修改密码</h2>
    <el-form :model="form" label-width="100px" @submit.prevent="submitChangePassword">
      <el-form-item label="旧密码">
        <el-input v-model="form.oldPassword" type="password" show-password placeholder="请输入旧密码" />
      </el-form-item>
      <el-form-item label="新密码">
        <el-input v-model="form.newPassword" type="password" show-password placeholder="请输入新密码" />
      </el-form-item>
      <el-button type="primary" :loading="loading" @click="submitChangePassword">提交修改</el-button>
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
