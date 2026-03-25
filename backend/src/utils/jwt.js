const jwt = require('jsonwebtoken');

const accessSecret = process.env.JWT_ACCESS_SECRET || 'change_me_access_secret';
const refreshSecret = process.env.JWT_REFRESH_SECRET || 'change_me_refresh_secret';

const accessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

function signAccessToken(userId) {
    return jwt.sign({ sub: userId, type: 'access' }, accessSecret, { expiresIn: accessExpiresIn });
}

function signRefreshToken(userId) {
    return jwt.sign({ sub: userId, type: 'refresh' }, refreshSecret, { expiresIn: refreshExpiresIn });
}

function verifyAccessToken(token) {
    return jwt.verify(token, accessSecret);
}

function verifyRefreshToken(token) {
    return jwt.verify(token, refreshSecret);
}

module.exports = {
    signAccessToken,
    signRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
};
