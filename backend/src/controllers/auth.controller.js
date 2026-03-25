const { User, RefreshToken } = require('../models');
const { hashPassword, comparePassword } = require('../utils/password');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');

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
      return res.status(400).json({ message: 'username, email and password are required' });
    }

    const existedByEmail = await User.findOne({ where: { email } });
    const existedByUsername = await User.findOne({ where: { username } });

    if (existedByEmail) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    if (existedByUsername) {
      return res.status(409).json({ message: 'Username already exists' });
    }

    const passwordHash = await hashPassword(password);
    const user = await User.create({ username, email, passwordHash, nickname: username });

    const accessToken = signAccessToken(user.id);
    const refreshToken = signRefreshToken(user.id);
    await saveRefreshToken(user.id, refreshToken);

    return res.status(201).json({
      message: 'Register success',
      data: {
        accessToken,
        refreshToken,
        user: toUserDto(user),
      },
    });
  } catch (err) {
    return next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const ok = await comparePassword(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const accessToken = signAccessToken(user.id);
    const refreshToken = signRefreshToken(user.id);
    await saveRefreshToken(user.id, refreshToken);

    return res.json({
      message: 'Login success',
      data: {
        accessToken,
        refreshToken,
        user: toUserDto(user),
      },
    });
  } catch (err) {
    return next(err);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'refreshToken is required' });
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (_err) {
      return res.status(401).json({ message: 'Refresh token invalid or expired' });
    }

    const tokenRecord = await RefreshToken.findOne({ where: { token: refreshToken, revoked: false } });

    if (!tokenRecord) {
      return res.status(401).json({ message: 'Refresh token not found' });
    }

    const accessToken = signAccessToken(Number(payload.sub));
    return res.json({
      message: 'Refresh success',
      data: { accessToken },
    });
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

    return res.json({ message: 'Logout success' });
  } catch (err) {
    return next(err);
  }
};
