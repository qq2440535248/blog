import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const HomeView = () => import('../views/home/HomeView.vue');
const LoginView = () => import('../views/auth/LoginView.vue');
const RegisterView = () => import('../views/auth/RegisterView.vue');
const ProfileView = () => import('../views/auth/ProfileView.vue');
const ArticleListView = () => import('../views/articles/ArticleListView.vue');
const ArticleDetailView = () => import('../views/articles/ArticleDetailView.vue');
const ArticleEditorView = () => import('../views/articles/ArticleEditorView.vue');
const DraftListView = () => import('../views/articles/DraftListView.vue');
const TaxonomyManageView = () => import('../views/taxonomy/TaxonomyManageView.vue');
const ModerationView = () => import('../views/admin/ModerationView.vue');

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
        redirect: '/profile?tab=security',
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
    },
    {
        path: '/drafts',
        name: 'drafts',
        component: DraftListView,
        meta: { requiresAuth: true },
    },
    {
        path: '/drafts/:id/edit',
        name: 'draft-edit',
        component: ArticleEditorView,
        meta: { requiresAuth: true },
    },
    {
        path: '/taxonomy',
        name: 'taxonomy',
        component: TaxonomyManageView,
        meta: { requiresAuth: true },
    },
    {
        path: '/moderation',
        name: 'moderation',
        component: ModerationView,
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
