function isEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validateRegister(req) {
    const { username, email, password } = req.body;

    if (!username || typeof username !== 'string' || username.trim().length < 3) {
        return 'username 至少 3 个字符';
    }

    if (!email || typeof email !== 'string' || !isEmail(email)) {
        return 'email 格式不正确';
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
        return 'password 至少 6 位';
    }

    return true;
}

function validateLogin(req) {
    const { email, password } = req.body;

    if (!email || typeof email !== 'string' || !isEmail(email)) {
        return 'email 格式不正确';
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
        return 'password 至少 6 位';
    }

    return true;
}

function validateRefresh(req) {
    const { refreshToken } = req.body;

    if (!refreshToken || typeof refreshToken !== 'string') {
        return 'refreshToken 必填';
    }

    return true;
}

function validateLogout(req) {
    const { refreshToken } = req.body;

    if (refreshToken !== undefined && typeof refreshToken !== 'string') {
        return 'refreshToken 类型错误';
    }

    return true;
}

module.exports = {
    validateRegister,
    validateLogin,
    validateRefresh,
    validateLogout,
};
