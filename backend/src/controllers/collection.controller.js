const { Article, Collection } = require('../models');
const { success, fail, ERROR_CODES } = require('../utils/http');

async function refreshCollectionsCount(articleId) {
    const collectionsCount = await Collection.count({ where: { articleId } });
    await Article.update({ collectionsCount }, { where: { id: articleId } });
    return collectionsCount;
}

exports.collect = async (req, res, next) => {
    try {
        const articleId = Number(req.params.id);
        const article = await Article.findByPk(articleId);

        if (!article || article.status !== 'published') {
            return fail(res, 'Article not found', 404, ERROR_CODES.NOT_FOUND);
        }

        await Collection.findOrCreate({
            where: { userId: req.auth.userId, articleId },
            defaults: { userId: req.auth.userId, articleId },
        });

        const collectionsCount = await refreshCollectionsCount(articleId);
        return success(res, { collected: true, collectionsCount }, '收藏成功');
    } catch (err) {
        return next(err);
    }
};

exports.uncollect = async (req, res, next) => {
    try {
        const articleId = Number(req.params.id);

        await Collection.destroy({
            where: { userId: req.auth.userId, articleId },
        });

        const collectionsCount = await refreshCollectionsCount(articleId);
        return success(res, { collected: false, collectionsCount }, '取消收藏成功');
    } catch (err) {
        return next(err);
    }
};

exports.isCollected = async (req, res, next) => {
    try {
        if (!req.auth?.userId) {
            return success(res, { collected: false });
        }

        const articleId = Number(req.params.id);
        const record = await Collection.findOne({
            where: { userId: req.auth.userId, articleId },
        });

        return success(res, { collected: Boolean(record) });
    } catch (err) {
        return next(err);
    }
};
