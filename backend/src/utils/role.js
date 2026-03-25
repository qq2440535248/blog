function getAdminEmails() {
    // 支持多个管理员邮箱，使用英文逗号分隔。
    const raw = process.env.ADMIN_EMAILS || '';
    return raw
        .split(',')
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean);
}

function isAdminEmail(email) {
    if (!email || typeof email !== 'string') {
        return false;
    }

    const target = email.trim().toLowerCase();
    if (!target) {
        return false;
    }

    return getAdminEmails().includes(target);
}

function getUserRole(user) {
    // 当前项目基于邮箱白名单判定管理员身份。
    return isAdminEmail(user?.email) ? 'admin' : 'user';
}

function isAdminUser(user) {
    return getUserRole(user) === 'admin';
}

module.exports = {
    getUserRole,
    isAdminUser,
};
