function getAdminEmails() {
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
    return isAdminEmail(user?.email) ? 'admin' : 'user';
}

function isAdminUser(user) {
    return getUserRole(user) === 'admin';
}

module.exports = {
    getUserRole,
    isAdminUser,
};
