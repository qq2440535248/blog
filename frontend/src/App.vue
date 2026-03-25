<script setup>
import { ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "./stores/auth";
import message from "./utils/message";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const mobileMenuOpen = ref(false);

const guestRoutes = ["/login", "/register"];

function isActive(path) {
  if (path === "/") {
    return route.path === "/";
  }

  return route.path.startsWith(path);
}

async function logout() {
  try {
    await authStore.logout();
    message.success("已退出登录");
    router.push("/login");
  } catch (_err) {
    message.error("退出失败，请稍后重试");
  }
}

watch(
  () => route.fullPath,
  () => {
    mobileMenuOpen.value = false;
  },
);
</script>

<template>
  <div class="app-shell">
    <header class="topbar" v-if="!guestRoutes.includes(route.path)">
      <div class="container topbar-inner">
        <router-link class="brand" to="/">Person Blog</router-link>

        <button
          class="menu-toggle"
          type="button"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          {{ mobileMenuOpen ? "关闭" : "菜单" }}
        </button>

        <nav class="nav" :class="{ open: mobileMenuOpen }">
          <router-link :class="{ active: isActive('/') }" to="/"
            >首页</router-link
          >
          <router-link
            v-if="authStore.isAuthenticated"
            :class="{ active: isActive('/articles') }"
            to="/articles"
          >
            文章
          </router-link>
          <router-link
            v-if="authStore.isAuthenticated"
            :class="{ active: isActive('/drafts') }"
            to="/drafts"
          >
            草稿
          </router-link>
          <router-link
            v-if="authStore.isAuthenticated"
            :class="{ active: isActive('/taxonomy') }"
            to="/taxonomy"
          >
            分类标签
          </router-link>
          <router-link
            v-if="authStore.isAuthenticated"
            :class="{ active: isActive('/profile') }"
            to="/profile"
          >
            个人中心
          </router-link>
          <router-link
            v-if="authStore.isAuthenticated"
            :class="{ active: isActive('/change-password') }"
            to="/change-password"
          >
            安全设置
          </router-link>
          <router-link v-if="!authStore.isAuthenticated" to="/login"
            >登录</router-link
          >
          <router-link v-if="!authStore.isAuthenticated" to="/register"
            >注册</router-link
          >
          <button
            v-if="authStore.isAuthenticated"
            class="logout"
            type="button"
            @click="logout"
          >
            退出
          </button>
        </nav>
      </div>
    </header>

    <router-view v-slot="{ Component }">
      <transition name="page" mode="out-in" appear>
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<style scoped>
.topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  border-bottom: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(10px);
  transition: box-shadow var(--motion-base) var(--motion-ease);
}

.topbar-inner {
  min-height: 62px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.brand {
  text-decoration: none;
  color: #0b2447;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.nav {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav a,
.logout {
  border: 1px solid transparent;
  text-decoration: none;
  color: var(--color-text-secondary);
  border-radius: 999px;
  padding: 8px 12px;
  font-weight: 600;
  background: transparent;
  cursor: pointer;
  transition:
    color var(--motion-fast) var(--motion-ease),
    border-color var(--motion-fast) var(--motion-ease),
    background-color var(--motion-fast) var(--motion-ease);
}

.nav a:hover,
.logout:hover {
  border-color: var(--color-border);
  color: var(--color-text);
}

.nav a.active {
  border-color: #c8ddff;
  color: var(--color-primary-strong);
  background: #eef4ff;
}

.logout {
  color: var(--color-danger);
}

.menu-toggle {
  display: none;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: #ffffff;
  color: var(--color-text);
  padding: 8px 12px;
  font-weight: 700;
}

@media (max-width: 900px) {
  .menu-toggle {
    display: inline-flex;
  }

  .topbar-inner {
    min-height: 58px;
  }

  .nav {
    position: absolute;
    top: calc(100% + 8px);
    right: 10px;
    left: 10px;
    display: none;
    flex-direction: column;
    align-items: stretch;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: #ffffff;
    box-shadow: var(--shadow-md);
    padding: 8px;
  }

  .nav.open {
    display: flex;
  }

  .nav a,
  .logout {
    border-radius: var(--radius-sm);
    padding: 10px 12px;
  }
}
</style>
