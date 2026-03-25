const { Category } = require('../models');
const { success, fail, ERROR_CODES } = require('../utils/http');

exports.list = async (req, res, next) => {
    try {
        const items = await Category.findAll({
            where: { userId: req.auth.userId },
            order: [['id', 'DESC']],
        });
        return success(res, items);
    } catch (err) {
        return next(err);
    }
};

exports.create = async (req, res, next) => {
    try {
        const { name } = req.body;
        if (!name) {
            return fail(res, 'name is required', 400, ERROR_CODES.BAD_REQUEST);
        }

        const category = await Category.create({
            userId: req.auth.userId,
            name,
        });

        return success(res, category, 'Category created', 201);
    } catch (err) {
        return next(err);
    }
};

exports.update = async (req, res, next) => {
    try {
        const category = await Category.findOne({
            where: { id: req.params.id, userId: req.auth.userId },
        });

        if (!category) {
            return fail(res, 'Category not found', 404, ERROR_CODES.NOT_FOUND);
        }

        category.name = req.body.name || category.name;
        await category.save();

        return success(res, category, 'Category updated');
    } catch (err) {
        return next(err);
    }
};

exports.remove = async (req, res, next) => {
    try {
        const count = await Category.destroy({
            where: { id: req.params.id, userId: req.auth.userId },
        });

        if (!count) {
            return fail(res, 'Category not found', 404, ERROR_CODES.NOT_FOUND);
        }

        return success(res, null, 'Category deleted');
    } catch (err) {
        return next(err);
    }
};
