<script setup>
import { useAuthStore } from "../../stores/auth";
import message from "../../utils/message";

const authStore = useAuthStore();

async function logout() {
  try {
    await authStore.logout();
    message.success("已退出登录");
  } catch (_err) {
    message.error("退出失败，请稍后重试");
  }
}
</script>

<template>
  <main class="home-page page-block">
    <section class="container hero">
      <p class="hero-kicker">CONTENT STUDIO</p>
      <h1>一个面向创作者的博客工作台</h1>
      <p class="hero-subtitle">
        集中管理文章、草稿、标签和分类，让创作流程更有秩序，发布更高效。
      </p>

      <div v-if="!authStore.isAuthenticated" class="hero-actions">
        <router-link class="action-link primary" to="/login"
          >立即登录</router-link
        >
        <router-link class="action-link" to="/register">免费注册</router-link>
      </div>

      <div v-else class="hero-actions">
        <router-link class="action-link primary" to="/articles"
          >进入文章管理</router-link
        >
        <button class="action-link danger" type="button" @click="logout">
          退出登录
        </button>
      </div>
    </section>

    <section v-if="authStore.isAuthenticated" class="container section-grid">
      <router-link class="panel" to="/profile">
        <h3>个人中心</h3>
        <p>维护昵称、头像和个人简介。</p>
      </router-link>
      <router-link class="panel" to="/change-password">
        <h3>账户安全</h3>
        <p>修改登录密码，保持账号安全。</p>
      </router-link>
      <router-link class="panel" to="/articles">
        <h3>文章管理</h3>
        <p>创建、编辑、删除与检索文章。</p>
      </router-link>
      <router-link class="panel" to="/drafts">
        <h3>草稿箱</h3>
        <p>持续打磨未发布内容，随时继续编辑。</p>
      </router-link>
      <router-link class="panel" to="/taxonomy">
        <h3>分类与标签</h3>
        <p>建立内容结构，提升检索与管理效率。</p>
      </router-link>
    </section>
  </main>
</template>

<style scoped>
.hero {
  background: linear-gradient(135deg, #f8fbff 0%, #eef8f6 100%);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: clamp(24px, 5vw, 48px);
  box-shadow: var(--shadow-md);
}

.hero-kicker {
  margin: 0;
  color: var(--color-primary);
  letter-spacing: 0.18em;
  font-size: 12px;
  font-weight: 700;
}

.hero h1 {
  margin: 12px 0;
  font-size: clamp(30px, 5vw, 52px);
  line-height: 1.08;
}

.hero-subtitle {
  margin: 0;
  max-width: 640px;
  line-height: 1.8;
  color: var(--color-text-secondary);
}

.hero-actions {
  margin-top: 24px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.action-link {
  border: 1px solid var(--color-border);
  background: #ffffff;
  border-radius: 999px;
  padding: 10px 20px;
  text-decoration: none;
  color: var(--color-text);
  font-weight: 700;
  cursor: pointer;
}

.action-link.primary {
  border-color: transparent;
  background: linear-gradient(120deg, #1e6fff 0%, #00a88f 100%);
  color: #ffffff;
}

.action-link.danger {
  border-color: #ffd7d7;
  color: var(--color-danger);
}

.section-grid {
  margin-top: 18px;
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.panel {
  display: block;
  text-decoration: none;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.88);
  box-shadow: var(--shadow-sm);
  padding: 18px;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.panel:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.panel h3 {
  margin: 0;
  color: var(--color-text);
}

.panel p {
  margin: 10px 0 0;
  color: var(--color-text-secondary);
  line-height: 1.6;
}

@media (max-width: 900px) {
  .section-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .section-grid {
    grid-template-columns: 1fr;
  }
}
</style>
