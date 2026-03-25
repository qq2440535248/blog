import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
const apiTimeout = Number(import.meta.env.VITE_REQUEST_TIMEOUT || 10000);

export function getApiErrorMessage(error, fallback = '请求失败，请稍后重试') {
    return (
        error?.response?.data?.message ||
        error?.message ||
        fallback
    );
}

const request = axios.create({
    baseURL: apiBaseUrl,
    timeout: Number.isFinite(apiTimeout) && apiTimeout > 0 ? apiTimeout : 10000,
});

let refreshPromise = null;

async function refreshAuthTokens(refreshToken) {
    const { data } = await axios.post(`${apiBaseUrl}/auth/refresh`, { refreshToken });
    const newAccessToken = data?.data?.accessToken;
    const newRefreshToken = data?.data?.refreshToken;

    if (!newAccessToken) {
        throw new Error('Refresh failed');
    }

    localStorage.setItem('access_token', newAccessToken);
    if (newRefreshToken) {
        localStorage.setItem('refresh_token', newRefreshToken);
    }

    return newAccessToken;
}

function redirectToLogin() {
    if (typeof window === 'undefined') {
        return;
    }

    if (window.location.pathname === '/login') {
        return;
    }

    const redirect = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/login?redirect=${redirect}`;
}

request.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

request.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const status = error?.response?.status;
        const url = String(originalRequest?.url || '');
        const isAuthEndpoint = /\/auth\/(login|register|refresh)/.test(url);

        if (status !== 401 || originalRequest._retry || isAuthEndpoint) {
            error.userMessage = getApiErrorMessage(error);
            return Promise.reject(error);
        }

        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
            error.userMessage = getApiErrorMessage(error, '登录状态已失效，请重新登录');
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            redirectToLogin();
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        try {
            // 并发 401 时只发起一次刷新请求，其余请求复用同一个 Promise。
            if (!refreshPromise) {
                refreshPromise = refreshAuthTokens(refreshToken).finally(() => {
                    refreshPromise = null;
                });
            }

            const newAccessToken = await refreshPromise;
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return request(originalRequest);
        } catch (refreshError) {
            // 刷新失败时统一清理本地令牌并跳转登录。
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            refreshError.userMessage = getApiErrorMessage(refreshError, '登录状态已过期，请重新登录');
            redirectToLogin();
            return Promise.reject(refreshError);
        }
    }
);

export default request;
