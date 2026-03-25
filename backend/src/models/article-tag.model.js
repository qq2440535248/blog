const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ArticleTag = sequelize.define(
    'ArticleTag',
    {
        articleId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            field: 'article_id',
            primaryKey: true,
        },
        tagId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            field: 'tag_id',
            primaryKey: true,
        },
    },
    {
        tableName: 'article_tags',
        timestamps: false,
        underscored: true,
    }
);

module.exports = ArticleTag;
