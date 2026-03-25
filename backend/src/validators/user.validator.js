function validateUpdateProfile(req) {
    const { username, email, nickname, avatarUrl, bio } = req.body;

    if (username !== undefined && (typeof username !== 'string' || username.trim().length < 3 || username.trim().length > 50)) {
        return 'username 长度需在 3 到 50 之间';
    }

    if (email !== undefined) {
        if (typeof email !== 'string') {
            return 'email 必须是字符串';
        }

        const emailText = email.trim();
        const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailReg.test(emailText)) {
            return 'email 格式不正确';
        }
    }

    if (nickname !== undefined && (typeof nickname !== 'string' || nickname.length > 80)) {
        return 'nickname 不能为空且长度不能超过 80';
    }

    if (avatarUrl !== undefined && typeof avatarUrl !== 'string') {
        return 'avatarUrl 必须是字符串';
    }

    if (bio !== undefined && typeof bio !== 'string') {
        return 'bio 必须是字符串';
    }

    return true;
}

function validateChangePassword(req) {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || typeof oldPassword !== 'string' || oldPassword.length < 6) {
        return 'oldPassword 至少 6 位';
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
        return 'newPassword 至少 6 位';
    }

    return true;
}

module.exports = {
    validateUpdateProfile,
    validateChangePassword,
};
