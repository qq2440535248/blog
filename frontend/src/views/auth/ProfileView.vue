<script setup>
import { onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import request from '../../utils/request';

const loading = ref(false);
const form = reactive({
  username: '',
  email: '',
  nickname: '',
  avatarUrl: '',
  bio: '',
});

async function fetchProfile() {
  try {
    const { data } = await request.get('/users/me');
    const profile = data.data;
    form.username = profile.username || '';
    form.email = profile.email || '';
    form.nickname = profile.nickname || '';
    form.avatarUrl = profile.avatarUrl || '';
    form.bio = profile.bio || '';
  } catch (_err) {
    ElMessage.error('加载个人信息失败');
  }
}

async function saveProfile() {
  try {
    loading.value = true;
    await request.put('/users/me', {
      nickname: form.nickname,
      avatarUrl: form.avatarUrl,
      bio: form.bio,
    });
    ElMessage.success('保存成功');
  } catch (_err) {
    ElMessage.error('保存失败');
  } finally {
    loading.value = false;
  }
}

onMounted(fetchProfile);
</script>

<template>
  <main class="page">
    <h2>个人信息</h2>
    <el-form :model="form" label-width="90px">
      <el-form-item label="用户名">
        <el-input v-model="form.username" disabled />
      </el-form-item>
      <el-form-item label="邮箱">
        <el-input v-model="form.email" disabled />
      </el-form-item>
      <el-form-item label="昵称">
        <el-input v-model="form.nickname" />
      </el-form-item>
      <el-form-item label="头像URL">
        <el-input v-model="form.avatarUrl" />
      </el-form-item>
      <el-form-item label="简介">
        <el-input v-model="form.bio" type="textarea" :rows="3" />
      </el-form-item>
      <el-button type="primary" :loading="loading" @click="saveProfile">保存</el-button>
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
