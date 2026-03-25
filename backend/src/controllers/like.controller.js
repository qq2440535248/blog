const { Article, Like } = require('../models');

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
            return res.status(404).json({ message: 'Article not found' });
        }

        await Like.findOrCreate({
            where: { userId: req.auth.userId, articleId },
            defaults: { userId: req.auth.userId, articleId },
        });

        const likesCount = await refreshLikesCount(articleId);
        return res.json({ liked: true, likesCount });
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
        return res.json({ liked: false, likesCount });
    } catch (err) {
        return next(err);
    }
};

exports.isLiked = async (req, res, next) => {
    try {
        const articleId = Number(req.params.id);
        const like = await Like.findOne({ where: { userId: req.auth.userId, articleId } });
        return res.json({ liked: Boolean(like) });
    } catch (err) {
        return next(err);
    }
};
