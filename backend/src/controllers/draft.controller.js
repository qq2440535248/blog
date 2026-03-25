const { Draft, Tag, Article } = require('../models');

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

        return res.json({
            data: rows,
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
            return res.status(404).json({ message: 'Draft not found' });
        }

        return res.json({ data: draft });
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

        return res.status(201).json({ data: draft });
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
            return res.status(404).json({ message: 'Draft not found' });
        }

        const { title, excerpt, content, categoryId, tagIds } = req.body;
        draft.title = title ?? draft.title;
        draft.excerpt = excerpt ?? draft.excerpt;
        draft.content = content ?? draft.content;
        draft.categoryId = categoryId ?? draft.categoryId;
        draft.tagIds = tagIds ?? draft.tagIds;
        await draft.save();

        return res.json({ data: draft });
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
            return res.status(404).json({ message: 'Draft not found' });
        }

        return res.json({ message: 'Draft deleted' });
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
            return res.status(404).json({ message: 'Draft not found' });
        }

        if (!draft.title || !draft.content) {
            return res.status(400).json({ message: 'Draft title and content are required to publish' });
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

        return res.json({
            message: 'Draft published',
            data: { articleId: article.id },
        });
    } catch (err) {
        return next(err);
    }
};
