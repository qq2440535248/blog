import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import HomeView from '../views/home/HomeView.vue';
import LoginView from '../views/auth/LoginView.vue';
import RegisterView from '../views/auth/RegisterView.vue';
import ProfileView from '../views/auth/ProfileView.vue';
import ChangePasswordView from '../views/auth/ChangePasswordView.vue';
import ArticleListView from '../views/articles/ArticleListView.vue';
import ArticleDetailView from '../views/articles/ArticleDetailView.vue';
import ArticleEditorView from '../views/articles/ArticleEditorView.vue';
import TaxonomyManageView from '../views/taxonomy/TaxonomyManageView.vue';

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { guestOnly: true },
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterView,
    meta: { guestOnly: true },
  },
  {
    path: '/profile',
    name: 'profile',
    component: ProfileView,
    meta: { requiresAuth: true },
  },
  {
    path: '/change-password',
    name: 'change-password',
    component: ChangePasswordView,
    meta: { requiresAuth: true },
  },
  {
    path: '/articles',
    name: 'articles',
    component: ArticleListView,
    meta: { requiresAuth: true },
  },
  {
    path: '/articles/new',
    name: 'article-new',
    component: ArticleEditorView,
    meta: { requiresAuth: true },
  },
  {
    path: '/articles/:id/edit',
    name: 'article-edit',
    component: ArticleEditorView,
    meta: { requiresAuth: true },
  },
  {
    path: '/articles/:id',
    name: 'article-detail',
    component: ArticleDetailView,
    meta: { requiresAuth: true },
  },
  {
    path: '/taxonomy',
    name: 'taxonomy',
    component: TaxonomyManageView,
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  const authStore = useAuthStore();

  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return '/';
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return '/login';
  }

  return true;
});

export default router;
