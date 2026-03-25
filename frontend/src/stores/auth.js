import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import request from '../utils/request';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export const useAuthStore = defineStore('auth', () => {
    const accessToken = ref(localStorage.getItem(ACCESS_TOKEN_KEY) || '');
    const refreshToken = ref(localStorage.getItem(REFRESH_TOKEN_KEY) || '');
    const profile = ref(null);

    const isAuthenticated = computed(() => Boolean(accessToken.value));

    function setTokens(tokens) {
        // 登录/注册/刷新后统一写入令牌，保持状态来源一致。
        accessToken.value = tokens.accessToken || '';
        refreshToken.value = tokens.refreshToken || '';

        localStorage.setItem(ACCESS_TOKEN_KEY, accessToken.value);
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken.value);
    }

    function clearAuth() {
        // 退出登录或鉴权失效时清空内存与本地缓存。
        accessToken.value = '';
        refreshToken.value = '';
        profile.value = null;

        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
    }

    async function login(payload) {
        const { data } = await request.post('/auth/login', payload);
        setTokens(data.data);
        profile.value = data?.data?.user || null;
    }

    async function register(payload) {
        const { data } = await request.post('/auth/register', payload);
        setTokens(data.data);
        profile.value = data?.data?.user || null;
    }

    async function fetchMe() {
        // 页面刷新后通过 /users/me 恢复角色与个人信息。
        const { data } = await request.get('/users/me');
        profile.value = data.data;
    }

    async function logout() {
        try {
            await request.post('/auth/logout', {
                refreshToken: refreshToken.value,
            });
        } finally {
            clearAuth();
        }
    }

    return {
        accessToken,
        refreshToken,
        profile,
        isAuthenticated,
        setTokens,
        clearAuth,
        login,
        register,
        fetchMe,
        logout,
    };
});
