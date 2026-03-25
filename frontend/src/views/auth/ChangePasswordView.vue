<script setup>
import { reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import request from "../../utils/request";

const loading = ref(false);
const formRef = ref();
const form = reactive({
  oldPassword: "",
  newPassword: "",
});

const rules = {
  oldPassword: [{ required: true, message: "请输入旧密码", trigger: "blur" }],
  newPassword: [
    { required: true, message: "请输入新密码", trigger: "blur" },
    { min: 6, message: "新密码至少 6 位", trigger: "blur" },
  ],
};

async function submitChangePassword() {
  try {
    const valid = await formRef.value?.validate();
    if (!valid) {
      return;
    }

    loading.value = true;
    await request.put("/users/me/password", {
      oldPassword: form.oldPassword,
      newPassword: form.newPassword,
    });
    ElMessage.success("密码修改成功");
    form.oldPassword = "";
    form.newPassword = "";
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || "密码修改失败");
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <main class="password-page page-block">
    <section class="container">
      <el-card class="password-card" shadow="never">
        <p class="kicker">ACCOUNT SECURITY</p>
        <h2>修改密码</h2>
        <p class="subtitle">建议定期更新密码，保护账号安全。</p>

        <el-form
          ref="formRef"
          :rules="rules"
          :model="form"
          label-position="top"
          @submit.prevent="submitChangePassword"
        >
          <el-form-item label="旧密码" prop="oldPassword">
            <el-input
              v-model="form.oldPassword"
              type="password"
              show-password
              placeholder="请输入旧密码"
            />
          </el-form-item>
          <el-form-item label="新密码" prop="newPassword">
            <el-input
              v-model="form.newPassword"
              type="password"
              show-password
              placeholder="请输入新密码"
            />
          </el-form-item>
          <el-button type="primary" :loading="loading" @click="submitChangePassword">
            提交修改
          </el-button>
        </el-form>
      </el-card>
    </section>
  </main>
</template>

<style scoped>
.password-card {
  width: min(100%, 620px);
  margin-inline: auto;
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
  margin: 10px 0;
  font-size: clamp(24px, 3vw, 34px);
}

.subtitle {
  margin: 0 0 18px;
  color: var(--color-text-secondary);
}

.el-button {
  width: 100%;
}
</style>
