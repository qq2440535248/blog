const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ModerationLog = sequelize.define(
    'ModerationLog',
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        articleId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            field: 'article_id',
        },
        adminUserId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            field: 'admin_user_id',
        },
        action: {
            type: DataTypes.ENUM('takedown', 'restore'),
            allowNull: false,
        },
        reason: {
            type: DataTypes.STRING(200),
            allowNull: true,
        },
    },
    {
        tableName: 'moderation_logs',
        underscored: true,
        indexes: [
            { fields: ['article_id'] },
            { fields: ['admin_user_id'] },
        ],
    }
);

module.exports = ModerationLog;
