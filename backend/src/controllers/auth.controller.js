const { User, RefreshToken } = require('../models');
const { hashPassword, comparePassword } = require('../utils/password');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
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

async function saveRefreshToken(userId, refreshToken) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await RefreshToken.create({ userId, token: refreshToken, expiresAt });
}

exports.register = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return fail(res, 'username, email and password are required', 400, ERROR_CODES.BAD_REQUEST);
        }

        const existedByEmail = await User.findOne({ where: { email } });
        const existedByUsername = await User.findOne({ where: { username } });

        if (existedByEmail) {
            return fail(res, 'Email already exists', 409, ERROR_CODES.CONFLICT);
        }

        if (existedByUsername) {
            return fail(res, 'Username already exists', 409, ERROR_CODES.CONFLICT);
        }

        const passwordHash = await hashPassword(password);
        const user = await User.create({ username, email, passwordHash, nickname: username });

        const accessToken = signAccessToken(user.id);
        const refreshToken = signRefreshToken(user.id);
        await saveRefreshToken(user.id, refreshToken);

        return success(
            res,
            {
                accessToken,
                refreshToken,
                user: toUserDto(user),
            },
            'Register success',
            201
        );
    } catch (err) {
        return next(err);
    }
};

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return fail(res, 'email and password are required', 400, ERROR_CODES.BAD_REQUEST);
        }

        const user = await User.findOne({ where: { email } });

        if (!user) {
            return fail(res, 'Invalid credentials', 401, ERROR_CODES.UNAUTHORIZED);
        }

        const ok = await comparePassword(password, user.passwordHash);
        if (!ok) {
            return fail(res, 'Invalid credentials', 401, ERROR_CODES.UNAUTHORIZED);
        }

        const accessToken = signAccessToken(user.id);
        const refreshToken = signRefreshToken(user.id);
        await saveRefreshToken(user.id, refreshToken);

        return success(res, {
            accessToken,
            refreshToken,
            user: toUserDto(user),
        }, 'Login success');
    } catch (err) {
        return next(err);
    }
};

exports.refresh = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return fail(res, 'refreshToken is required', 400, ERROR_CODES.BAD_REQUEST);
        }

        let payload;
        try {
            payload = verifyRefreshToken(refreshToken);
        } catch (_err) {
            return fail(res, 'Refresh token invalid or expired', 401, ERROR_CODES.UNAUTHORIZED);
        }

        const tokenRecord = await RefreshToken.findOne({ where: { token: refreshToken, revoked: false } });

        if (!tokenRecord) {
            return fail(res, 'Refresh token not found', 401, ERROR_CODES.UNAUTHORIZED);
        }

        if (tokenRecord.userId !== Number(payload.sub)) {
            return fail(res, 'Refresh token owner mismatch', 401, ERROR_CODES.UNAUTHORIZED);
        }

        if (new Date(tokenRecord.expiresAt).getTime() <= Date.now()) {
            await tokenRecord.update({ revoked: true });
            return fail(res, 'Refresh token expired', 401, ERROR_CODES.UNAUTHORIZED);
        }

        await tokenRecord.update({ revoked: true });

        const userId = Number(payload.sub);
        const accessToken = signAccessToken(userId);
        const newRefreshToken = signRefreshToken(userId);
        await saveRefreshToken(userId, newRefreshToken);

        return success(res, {
            accessToken,
            refreshToken: newRefreshToken,
        }, 'Refresh success');
    } catch (err) {
        return next(err);
    }
};

exports.logout = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (refreshToken) {
            await RefreshToken.update({ revoked: true }, { where: { token: refreshToken } });
        }

        return success(res, null, 'Logout success');
    } catch (err) {
        return next(err);
    }
};
