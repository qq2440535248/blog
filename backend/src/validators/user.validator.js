function validateUpdateProfile(req) {
    const { nickname, avatarUrl, bio } = req.body;

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
