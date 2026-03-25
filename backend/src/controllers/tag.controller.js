const { Tag } = require('../models');
const { success, fail, ERROR_CODES } = require('../utils/http');

exports.list = async (req, res, next) => {
    try {
        const items = await Tag.findAll({
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

        const tag = await Tag.create({
            userId: req.auth.userId,
            name,
        });

        return success(res, tag, 'Tag created', 201);
    } catch (err) {
        return next(err);
    }
};

exports.update = async (req, res, next) => {
    try {
        const tag = await Tag.findOne({
            where: { id: req.params.id, userId: req.auth.userId },
        });

        if (!tag) {
            return fail(res, 'Tag not found', 404, ERROR_CODES.NOT_FOUND);
        }

        tag.name = req.body.name || tag.name;
        await tag.save();

        return success(res, tag, 'Tag updated');
    } catch (err) {
        return next(err);
    }
};

exports.remove = async (req, res, next) => {
    try {
        const count = await Tag.destroy({
            where: { id: req.params.id, userId: req.auth.userId },
        });

        if (!count) {
            return fail(res, 'Tag not found', 404, ERROR_CODES.NOT_FOUND);
        }

        return success(res, null, 'Tag deleted');
    } catch (err) {
        return next(err);
    }
};
