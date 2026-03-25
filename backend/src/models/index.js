const sequelize = require('../config/database');
const User = require('./user.model');
const RefreshToken = require('./refresh-token.model');

User.hasMany(RefreshToken, { foreignKey: 'userId', as: 'refreshTokens' });
RefreshToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

async function initDatabase() {
  await sequelize.authenticate();
  await sequelize.sync();
}

module.exports = {
  sequelize,
  User,
  RefreshToken,
  initDatabase,
};
