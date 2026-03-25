const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Tag = sequelize.define(
    'Tag',
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
        name: {
            type: DataTypes.STRING(40),
            allowNull: false,
        },
    },
    {
        tableName: 'tags',
        underscored: true,
    }
);

module.exports = Tag;
