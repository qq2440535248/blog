const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Collection = sequelize.define(
    'Collection',
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
        tableName: 'collections',
        underscored: true,
        indexes: [
            {
                unique: true,
                fields: ['user_id', 'article_id'],
            },
        ],
    }
);

module.exports = Collection;
