const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Article = sequelize.define(
    'Article',
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
        categoryId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
            field: 'category_id',
        },
        title: {
            type: DataTypes.STRING(200),
            allowNull: false,
        },
        excerpt: {
            type: DataTypes.STRING(280),
            allowNull: true,
        },
        content: {
            type: DataTypes.TEXT('long'),
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('draft', 'published'),
            allowNull: false,
            defaultValue: 'published',
        },
        likesCount: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
            field: 'likes_count',
        },
    },
    {
        tableName: 'articles',
        underscored: true,
    }
);

module.exports = Article;
