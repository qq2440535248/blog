const { Draft, Tag, Article } = require('../models');
const { success, fail, ERROR_CODES } = require('../utils/http');

function parsePagination(query) {
    const page = Math.max(Number(query.page || 1), 1);
    const pageSize = Math.min(Math.max(Number(query.pageSize || 10), 1), 50);
    return { page, pageSize, offset: (page - 1) * pageSize };
}

exports.list = async (req, res, next) => {
    try {
        const { page, pageSize, offset } = parsePagination(req.query);
        const { rows, count } = await Draft.findAndCountAll({
            where: { userId: req.auth.userId },
            order: [['updatedAt', 'DESC']],
            offset,
            limit: pageSize,
        });

        return success(res, {
            list: rows,
            pagination: { page, pageSize, total: count },
        });
    } catch (err) {
        return next(err);
    }
};

exports.detail = async (req, res, next) => {
    try {
        const draft = await Draft.findOne({
            where: { id: req.params.id, userId: req.auth.userId },
        });

        if (!draft) {
            return fail(res, 'Draft not found', 404, ERROR_CODES.NOT_FOUND);
        }

        return success(res, draft);
    } catch (err) {
        return next(err);
    }
};

exports.create = async (req, res, next) => {
    try {
        const { title = '', excerpt = '', content = '', categoryId = null, tagIds = [] } = req.body;

        const draft = await Draft.create({
            userId: req.auth.userId,
            title,
            excerpt,
            content,
            categoryId,
            tagIds,
        });

        return success(res, draft, 'Draft created', 201);
    } catch (err) {
        return next(err);
    }
};

exports.update = async (req, res, next) => {
    try {
        const draft = await Draft.findOne({
            where: { id: req.params.id, userId: req.auth.userId },
        });

        if (!draft) {
            return fail(res, 'Draft not found', 404, ERROR_CODES.NOT_FOUND);
        }

        const { title, excerpt, content, categoryId, tagIds } = req.body;
        draft.title = title ?? draft.title;
        draft.excerpt = excerpt ?? draft.excerpt;
        draft.content = content ?? draft.content;
        draft.categoryId = categoryId ?? draft.categoryId;
        draft.tagIds = tagIds ?? draft.tagIds;
        await draft.save();

        return success(res, draft, 'Draft updated');
    } catch (err) {
        return next(err);
    }
};

exports.remove = async (req, res, next) => {
    try {
        const count = await Draft.destroy({
            where: { id: req.params.id, userId: req.auth.userId },
        });

        if (!count) {
            return fail(res, 'Draft not found', 404, ERROR_CODES.NOT_FOUND);
        }

        return success(res, null, 'Draft deleted');
    } catch (err) {
        return next(err);
    }
};

exports.publish = async (req, res, next) => {
    try {
        const draft = await Draft.findOne({
            where: { id: req.params.id, userId: req.auth.userId },
        });

        if (!draft) {
            return fail(res, 'Draft not found', 404, ERROR_CODES.NOT_FOUND);
        }

        if (!draft.title || !draft.content) {
            return fail(res, 'Draft title and content are required to publish', 400, ERROR_CODES.BAD_REQUEST);
        }

        const article = await Article.create({
            userId: req.auth.userId,
            title: draft.title,
            excerpt: draft.excerpt,
            content: draft.content,
            categoryId: draft.categoryId,
            status: 'published',
        });

        if (Array.isArray(draft.tagIds) && draft.tagIds.length > 0) {
            const tags = await Tag.findAll({ where: { id: draft.tagIds, userId: req.auth.userId } });
            await article.setTags(tags);
        }

        await draft.destroy();

        return success(res, { articleId: article.id }, 'Draft published');
    } catch (err) {
        return next(err);
    }
};
