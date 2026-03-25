const PREFIX = 'person_blog_cache:';

export function setCache(key, value, ttlMs = 5 * 60 * 1000) {
    const payload = {
        expireAt: Date.now() + ttlMs,
        value,
    };
    localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(payload));
}

export function getCache(key) {
    const raw = localStorage.getItem(`${PREFIX}${key}`);
    if (!raw) {
        return null;
    }

    try {
        const payload = JSON.parse(raw);
        if (!payload.expireAt || payload.expireAt < Date.now()) {
            localStorage.removeItem(`${PREFIX}${key}`);
            return null;
        }
        return payload.value;
    } catch (_err) {
        localStorage.removeItem(`${PREFIX}${key}`);
        return null;
    }
}

export function removeCache(key) {
    localStorage.removeItem(`${PREFIX}${key}`);
}
