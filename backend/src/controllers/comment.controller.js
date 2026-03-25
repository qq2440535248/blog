const { Article, Comment, CommentLike, User } = require('../models');
const { success, fail, ERROR_CODES } = require('../utils/http');

function escapeHtml(input) {
    return String(input)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function canReadArticle(article, auth) {
    if (!article) {
        return false;
    }

    if (article.status === 'published') {
        return true;
    }

    return Boolean(auth && Number(auth.userId) === Number(article.userId));
}

function buildCommentTree(comments, likedSet) {
    const byId = new Map();

    comments.forEach((comment) => {
        byId.set(comment.id, {
            id: comment.id,
            articleId: comment.articleId,
            parentCommentId: comment.parentCommentId,
            content: comment.content,
            likesCount: comment.likesCount,
            liked: likedSet.has(comment.id),
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
            user: comment.user,
            replies: [],
        });
    });

    const roots = [];
    byId.forEach((node) => {
        if (node.parentCommentId && byId.has(node.parentCommentId)) {
            byId.get(node.parentCommentId).replies.push(node);
            return;
        }

        roots.push(node);
    });

    return roots;
}

async function refreshCommentLikesCount(commentId) {
    const count = await CommentLike.count({ where: { commentId } });
    await Comment.update({ likesCount: count }, { where: { id: commentId } });
    return count;
}

exports.listByArticle = async (req, res, next) => {
    try {
        const articleId = Number(req.params.id);
        const article = await Article.findByPk(articleId, {
            attributes: ['id', 'userId', 'status'],
        });

        if (!article || !canReadArticle(article, req.auth)) {
            return fail(res, 'Article not found', 404, ERROR_CODES.NOT_FOUND);
        }

        const comments = await Comment.findAll({
            where: { articleId },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'nickname', 'avatarUrl'],
                },
            ],
            order: [['createdAt', 'ASC'], ['id', 'ASC']],
        });

        let likedSet = new Set();
        if (req.auth?.userId && comments.length > 0) {
            const commentIds = comments.map((comment) => comment.id);
            const likes = await CommentLike.findAll({
                where: {
                    userId: req.auth.userId,
                    commentId: commentIds,
                },
                attributes: ['commentId'],
            });

            likedSet = new Set(likes.map((like) => like.commentId));
        }

        const list = buildCommentTree(comments, likedSet);
        return success(res, { list });
    } catch (err) {
        return next(err);
    }
};

exports.create = async (req, res, next) => {
    try {
        const articleId = Number(req.params.id);
        const article = await Article.findByPk(articleId, {
            attributes: ['id', 'userId', 'status'],
        });

        if (!article || !canReadArticle(article, req.auth)) {
            return fail(res, 'Article not found', 404, ERROR_CODES.NOT_FOUND);
        }

        const { content, parentCommentId = null } = req.body;
        const cleanContent = escapeHtml(content.trim());

        if (parentCommentId) {
            const parent = await Comment.findByPk(Number(parentCommentId), {
                attributes: ['id', 'articleId'],
            });

            if (!parent || Number(parent.articleId) !== articleId) {
                return fail(res, '父评论不存在', 400, ERROR_CODES.BAD_REQUEST);
            }
        }

        const created = await Comment.create({
            userId: req.auth.userId,
            articleId,
            parentCommentId: parentCommentId || null,
            content: cleanContent,
        });

        const withUser = await Comment.findByPk(created.id, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'nickname', 'avatarUrl'],
                },
            ],
        });

        return success(res, withUser, '评论发布成功', 201);
    } catch (err) {
        return next(err);
    }
};

exports.like = async (req, res, next) => {
    try {
        const commentId = Number(req.params.id);
        const comment = await Comment.findByPk(commentId, {
            include: [{ model: Article, as: 'article', attributes: ['id', 'userId', 'status'] }],
        });

        if (!comment || !canReadArticle(comment.article, req.auth)) {
            return fail(res, 'Comment not found', 404, ERROR_CODES.NOT_FOUND);
        }

        await CommentLike.findOrCreate({
            where: { userId: req.auth.userId, commentId },
            defaults: { userId: req.auth.userId, commentId },
        });

        const likesCount = await refreshCommentLikesCount(commentId);
        return success(res, { liked: true, likesCount }, '评论点赞成功');
    } catch (err) {
        return next(err);
    }
};

exports.unlike = async (req, res, next) => {
    try {
        const commentId = Number(req.params.id);

        await CommentLike.destroy({
            where: { userId: req.auth.userId, commentId },
        });

        const likesCount = await refreshCommentLikesCount(commentId);
        return success(res, { liked: false, likesCount }, '取消评论点赞成功');
    } catch (err) {
        return next(err);
    }
};
