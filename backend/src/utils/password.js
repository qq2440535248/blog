const bcrypt = require('bcrypt');

async function hashPassword(rawPassword) {
    return bcrypt.hash(rawPassword, 10);
}

async function comparePassword(rawPassword, hashedPassword) {
    return bcrypt.compare(rawPassword, hashedPassword);
}

module.exports = {
    hashPassword,
    comparePassword,
};
