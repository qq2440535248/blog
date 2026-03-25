const { Op } = require('sequelize');
const { User, Like, Collection, Article, Category, Tag } = require('../models');
const { comparePassword, hashPassword } = require('../utils/password');
const { success, fail, ERROR_CODES } = require('../utils/http');
const { getUserRole } = require('../utils/role');

function toUserDto(user) {
    return {
        id: user.id,
        username: user.username,
        email: user.email,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        role: getUserRole(user),
    };
}

function parsePagination(query) {
    const page = Math.max(Number(query.page || 1), 1);
    const pageSize = Math.min(Math.max(Number(query.pageSize || 10), 1), 50);
    return { page, pageSize, offset: (page - 1) * pageSize };
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
        const { username, email, nickname, avatarUrl, bio } = req.body;
        const user = await User.findByPk(req.auth.userId);
        if (!user) {
            return fail(res, 'User not found', 404, ERROR_CODES.NOT_FOUND);
        }

        if (username !== undefined) {
            const normalizedUsername = username.trim();
            if (normalizedUsername && normalizedUsername !== user.username) {
                const conflict = await User.findOne({
                    where: {
                        username: normalizedUsername,
                        id: { [Op.ne]: user.id },
                    },
                });

                if (conflict) {
                    return fail(res, 'Username already exists', 409, ERROR_CODES.CONFLICT);
                }

                user.username = normalizedUsername;
            }
        }

        if (email !== undefined) {
            const normalizedEmail = email.trim().toLowerCase();
            if (normalizedEmail && normalizedEmail !== user.email) {
                const conflict = await User.findOne({
                    where: {
                        email: normalizedEmail,
                        id: { [Op.ne]: user.id },
                    },
                });

                if (conflict) {
                    return fail(res, 'Email already exists', 409, ERROR_CODES.CONFLICT);
                }

                user.email = normalizedEmail;
            }
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

exports.listMyLikes = async (req, res, next) => {
    try {
        const { page, pageSize, offset } = parsePagination(req.query);
        const { rows, count } = await Like.findAndCountAll({
            where: { userId: req.auth.userId },
            include: [
                {
                    model: Article,
                    as: 'article',
                    include: [
                        { model: Category, as: 'category', attributes: ['id', 'name'] },
                        { model: Tag, as: 'tags', through: { attributes: [] }, attributes: ['id', 'name'] },
                        { model: User, as: 'user', attributes: ['id', 'username', 'nickname', 'avatarUrl'] },
                    ],
                },
            ],
            order: [['id', 'DESC']],
            offset,
            limit: pageSize,
        });

        const list = rows
            .map((item) => item.article)
            .filter(Boolean);

        return success(res, {
            list,
            pagination: { page, pageSize, total: count },
        });
    } catch (err) {
        return next(err);
    }
};

exports.listMyCollections = async (req, res, next) => {
    try {
        const { page, pageSize, offset } = parsePagination(req.query);
        const { rows, count } = await Collection.findAndCountAll({
            where: { userId: req.auth.userId },
            include: [
                {
                    model: Article,
                    as: 'article',
                    include: [
                        { model: Category, as: 'category', attributes: ['id', 'name'] },
                        { model: Tag, as: 'tags', through: { attributes: [] }, attributes: ['id', 'name'] },
                        { model: User, as: 'user', attributes: ['id', 'username', 'nickname', 'avatarUrl'] },
                    ],
                },
            ],
            order: [['id', 'DESC']],
            offset,
            limit: pageSize,
        });

        const list = rows
            .map((item) => item.article)
            .filter(Boolean);

        return success(res, {
            list,
            pagination: { page, pageSize, total: count },
        });
    } catch (err) {
        return next(err);
    }
};
