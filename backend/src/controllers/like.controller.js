const { Article, Like } = require('../models');
const { success, fail, ERROR_CODES } = require('../utils/http');

async function refreshLikesCount(articleId) {
    const count = await Like.count({ where: { articleId } });
    await Article.update({ likesCount: count }, { where: { id: articleId } });
    return count;
}

exports.like = async (req, res, next) => {
    try {
        const articleId = Number(req.params.id);
        const article = await Article.findByPk(articleId);

        if (!article) {
            return fail(res, 'Article not found', 404, ERROR_CODES.NOT_FOUND);
        }

        await Like.findOrCreate({
            where: { userId: req.auth.userId, articleId },
            defaults: { userId: req.auth.userId, articleId },
        });

        const likesCount = await refreshLikesCount(articleId);
        return success(res, { liked: true, likesCount }, 'Like success');
    } catch (err) {
        return next(err);
    }
};

exports.unlike = async (req, res, next) => {
    try {
        const articleId = Number(req.params.id);

        await Like.destroy({
            where: { userId: req.auth.userId, articleId },
        });

        const likesCount = await refreshLikesCount(articleId);
        return success(res, { liked: false, likesCount }, 'Unlike success');
    } catch (err) {
        return next(err);
    }
};

exports.isLiked = async (req, res, next) => {
    try {
        const articleId = Number(req.params.id);
        const like = await Like.findOne({ where: { userId: req.auth.userId, articleId } });
        return success(res, { liked: Boolean(like) });
    } catch (err) {
        return next(err);
    }
};
