const { User } = require('../models');
const { comparePassword, hashPassword } = require('../utils/password');
const { success, fail, ERROR_CODES } = require('../utils/http');

function toUserDto(user) {
    return {
        id: user.id,
        username: user.username,
        email: user.email,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
    };
}

exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.auth.userId);
        if (!user) {
            return fail(res, 'User not found', 404, ERROR_CODES.NOT_FOUND);
        }

        return success(res, toUserDto(user));
    } catch (err) {
        return next(err);
    }
};

exports.updateMe = async (req, res, next) => {
    try {
        const { nickname, avatarUrl, bio } = req.body;
        const user = await User.findByPk(req.auth.userId);
        if (!user) {
            return fail(res, 'User not found', 404, ERROR_CODES.NOT_FOUND);
        }

        user.nickname = nickname ?? user.nickname;
        user.avatarUrl = avatarUrl ?? user.avatarUrl;
        user.bio = bio ?? user.bio;
        await user.save();

        return success(res, toUserDto(user), 'Profile updated');
    } catch (err) {
        return next(err);
    }
};

exports.changePassword = async (req, res, next) => {
    try {
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return fail(res, 'oldPassword and newPassword are required', 400, ERROR_CODES.BAD_REQUEST);
        }

        const user = await User.findByPk(req.auth.userId);
        if (!user) {
            return fail(res, 'User not found', 404, ERROR_CODES.NOT_FOUND);
        }

        const ok = await comparePassword(oldPassword, user.passwordHash);
        if (!ok) {
            return fail(res, 'Old password is incorrect', 400, ERROR_CODES.BAD_REQUEST);
        }

        user.passwordHash = await hashPassword(newPassword);
        await user.save();

        return success(res, null, 'Password changed');
    } catch (err) {
        return next(err);
    }
};

exports.uploadAvatar = async (req, res, next) => {
    try {
        if (!req.file) {
            return fail(res, 'Avatar file is required', 400, ERROR_CODES.BAD_REQUEST);
        }

        const user = await User.findByPk(req.auth.userId);
        if (!user) {
            return fail(res, 'User not found', 404, ERROR_CODES.NOT_FOUND);
        }

        const avatarPath = `/uploads/avatars/${req.file.filename}`;
        const avatarUrl = `${req.protocol}://${req.get('host')}${avatarPath}`;
        user.avatarUrl = avatarUrl;
        await user.save();

        return success(res, toUserDto(user), 'Avatar uploaded');
    } catch (err) {
        return next(err);
    }
};
