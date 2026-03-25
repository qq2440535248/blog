const { Op } = require('sequelize');
const { Article, Category, Tag } = require('../models');
const { success, fail, ERROR_CODES } = require('../utils/http');

function parsePagination(query) {
    const page = Math.max(Number(query.page || 1), 1);
    const pageSize = Math.min(Math.max(Number(query.pageSize || 10), 1), 50);
    return { page, pageSize, offset: (page - 1) * pageSize };
}

exports.list = async (req, res, next) => {
    try {
        const { page, pageSize, offset } = parsePagination(req.query);
        const { q, categoryId, tag } = req.query;

        const where = {
            userId: req.auth.userId,
        };

        if (q) {
            where[Op.or] = [
                { title: { [Op.like]: `%${q}%` } },
                { content: { [Op.like]: `%${q}%` } },
            ];
        }

        if (categoryId) {
            where.categoryId = Number(categoryId);
        }

        const include = [
            { model: Category, as: 'category', attributes: ['id', 'name'] },
            { model: Tag, as: 'tags', through: { attributes: [] }, attributes: ['id', 'name'] },
        ];

        if (tag) {
            include[1].where = { name: { [Op.like]: `%${tag}%` } };
        }

        const { rows, count } = await Article.findAndCountAll({
            where,
            include,
            distinct: true,
            order: [['id', 'DESC']],
            offset,
            limit: pageSize,
        });

        return success(res, {
            list: rows,
            pagination: {
                page,
                pageSize,
                total: count,
            },
        });
    } catch (err) {
        return next(err);
    }
};

exports.detail = async (req, res, next) => {
    try {
        const article = await Article.findOne({
            where: { id: req.params.id, userId: req.auth.userId },
            include: [
                { model: Category, as: 'category', attributes: ['id', 'name'] },
                { model: Tag, as: 'tags', through: { attributes: [] }, attributes: ['id', 'name'] },
            ],
        });

        if (!article) {
            return fail(res, 'Article not found', 404, ERROR_CODES.NOT_FOUND);
        }

        return success(res, article);
    } catch (err) {
        return next(err);
    }
};

exports.create = async (req, res, next) => {
    try {
        const { title, content, excerpt, categoryId, tagIds = [], status = 'published' } = req.body;

        if (!title || !content) {
            return fail(res, 'title and content are required', 400, ERROR_CODES.BAD_REQUEST);
        }

        const article = await Article.create({
            userId: req.auth.userId,
            title,
            content,
            excerpt: excerpt || '',
            categoryId: categoryId || null,
            status,
        });

        if (Array.isArray(tagIds) && tagIds.length > 0) {
            const tags = await Tag.findAll({ where: { id: tagIds, userId: req.auth.userId } });
            await article.setTags(tags);
        }

        const created = await Article.findByPk(article.id, {
            include: [{ model: Tag, as: 'tags', through: { attributes: [] }, attributes: ['id', 'name'] }],
        });

        return success(res, created, 'Article created', 201);
    } catch (err) {
        return next(err);
    }
};

exports.update = async (req, res, next) => {
    try {
        const article = await Article.findOne({
            where: { id: req.params.id, userId: req.auth.userId },
        });

        if (!article) {
            return fail(res, 'Article not found', 404, ERROR_CODES.NOT_FOUND);
        }

        const { title, content, excerpt, categoryId, tagIds, status } = req.body;

        article.title = title ?? article.title;
        article.content = content ?? article.content;
        article.excerpt = excerpt ?? article.excerpt;
        article.categoryId = categoryId ?? article.categoryId;
        article.status = status ?? article.status;
        await article.save();

        if (Array.isArray(tagIds)) {
            const tags = await Tag.findAll({ where: { id: tagIds, userId: req.auth.userId } });
            await article.setTags(tags);
        }

        const updated = await Article.findByPk(article.id, {
            include: [{ model: Tag, as: 'tags', through: { attributes: [] }, attributes: ['id', 'name'] }],
        });

        return success(res, updated, 'Article updated');
    } catch (err) {
        return next(err);
    }
};

exports.remove = async (req, res, next) => {
    try {
        const count = await Article.destroy({
            where: { id: req.params.id, userId: req.auth.userId },
        });

        if (!count) {
            return fail(res, 'Article not found', 404, ERROR_CODES.NOT_FOUND);
        }

        return success(res, null, 'Article deleted');
    } catch (err) {
        return next(err);
    }
};
