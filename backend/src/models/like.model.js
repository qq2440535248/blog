const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Like = sequelize.define(
    'Like',
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
    },
    {
        tableName: 'likes',
        underscored: true,
        indexes: [
            {
                unique: true,
                fields: ['user_id', 'article_id'],
            },
        ],
    }
);

module.exports = Like;
