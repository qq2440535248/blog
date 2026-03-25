const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Draft = sequelize.define(
    'Draft',
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
        title: {
            type: DataTypes.STRING(200),
            allowNull: false,
            defaultValue: '',
        },
        excerpt: {
            type: DataTypes.STRING(280),
            allowNull: true,
        },
        content: {
            type: DataTypes.TEXT('long'),
            allowNull: false,
            defaultValue: '',
        },
        categoryId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
            field: 'category_id',
        },
        tagIds: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: [],
            field: 'tag_ids',
        },
    },
    {
        tableName: 'drafts',
        underscored: true,
    }
);

module.exports = Draft;
