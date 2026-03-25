const { User } = require('../models');
const { comparePassword, hashPassword } = require('../utils/password');

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
            return res.status(404).json({ message: 'User not found' });
        }

        return res.json({ data: toUserDto(user) });
    } catch (err) {
        return next(err);
    }
};

exports.updateMe = async (req, res, next) => {
    try {
        const { nickname, avatarUrl, bio } = req.body;
        const user = await User.findByPk(req.auth.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.nickname = nickname ?? user.nickname;
        user.avatarUrl = avatarUrl ?? user.avatarUrl;
        user.bio = bio ?? user.bio;
        await user.save();

        return res.json({ message: 'Profile updated', data: toUserDto(user) });
    } catch (err) {
        return next(err);
    }
};

exports.changePassword = async (req, res, next) => {
    try {
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ message: 'oldPassword and newPassword are required' });
        }

        const user = await User.findByPk(req.auth.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const ok = await comparePassword(oldPassword, user.passwordHash);
        if (!ok) {
            return res.status(400).json({ message: 'Old password is incorrect' });
        }

        user.passwordHash = await hashPassword(newPassword);
        await user.save();

        return res.json({ message: 'Password changed' });
    } catch (err) {
        return next(err);
    }
};
