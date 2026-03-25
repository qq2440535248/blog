const { Category } = require('../models');

exports.list = async (req, res, next) => {
    try {
        const items = await Category.findAll({
            where: { userId: req.auth.userId },
            order: [['id', 'DESC']],
        });
        return res.json({ data: items });
    } catch (err) {
        return next(err);
    }
};

exports.create = async (req, res, next) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'name is required' });
        }

        const category = await Category.create({
            userId: req.auth.userId,
            name,
        });

        return res.status(201).json({ data: category });
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
            return res.status(404).json({ message: 'Category not found' });
        }

        category.name = req.body.name || category.name;
        await category.save();

        return res.json({ data: category });
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
            return res.status(404).json({ message: 'Category not found' });
        }

        return res.json({ message: 'Category deleted' });
    } catch (err) {
        return next(err);
    }
};
