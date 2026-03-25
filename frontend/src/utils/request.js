import axios from 'axios';

export function getApiErrorMessage(error, fallback = '请求失败，请稍后重试') {
    return (
        error?.response?.data?.message ||
        error?.message ||
        fallback
    );
}

const request = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
    timeout: 10000,
});

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

        if (status !== 401 || originalRequest._retry) {
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
            const { data } = await axios.post(
                `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/auth/refresh`,
                { refreshToken }
            );

            const newAccessToken = data?.data?.accessToken;
            const newRefreshToken = data?.data?.refreshToken;
            if (!newAccessToken) {
                throw new Error('Refresh failed');
            }

            localStorage.setItem('access_token', newAccessToken);
            if (newRefreshToken) {
                localStorage.setItem('refresh_token', newRefreshToken);
            }
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return request(originalRequest);
        } catch (refreshError) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            refreshError.userMessage = getApiErrorMessage(refreshError, '登录状态已过期，请重新登录');
            redirectToLogin();
            return Promise.reject(refreshError);
        }
    }
);

export default request;
