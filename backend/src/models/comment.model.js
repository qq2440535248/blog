const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Comment = sequelize.define(
    'Comment',
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
        articleId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            field: 'article_id',
        },
        parentCommentId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
            field: 'parent_comment_id',
        },
        replyToCommentId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
            field: 'reply_to_comment_id',
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        likesCount: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
            field: 'likes_count',
        },
    },
    {
        tableName: 'comments',
        underscored: true,
    }
);

module.exports = Comment;
