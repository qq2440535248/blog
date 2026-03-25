const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CommentLike = sequelize.define(
    'CommentLike',
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            field: 'user_id',
        },
        commentId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            field: 'comment_id',
        },
    },
    {
        tableName: 'comment_likes',
        underscored: true,
        indexes: [
            {
                unique: true,
                fields: ['user_id', 'comment_id'],
            },
        ],
    }
);

module.exports = CommentLike;
