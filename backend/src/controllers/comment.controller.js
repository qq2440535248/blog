const { Article, Comment, CommentLike, User } = require('../models');
const { success, fail, ERROR_CODES } = require('../utils/http');

function parsePagination(query) {
    const page = Math.max(Number(query.page || 1), 1);
    const pageSize = Math.min(Math.max(Number(query.pageSize || 10), 1), 10);
    return { page, pageSize, offset: (page - 1) * pageSize };
}

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

function toNode(comment, likedSet) {
    return {
        id: comment.id,
        articleId: comment.articleId,
        parentCommentId: comment.parentCommentId,
        content: comment.content,
        likesCount: comment.likesCount,
        liked: likedSet.has(comment.id),
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        user: comment.user,
        replyToUser: comment.parentComment?.user || null,
        replies: [],
    };
}

async function refreshCommentLikesCount(commentId) {
    const count = await CommentLike.count({ where: { commentId } });
    await Comment.update({ likesCount: count }, { where: { id: commentId } });
    return count;
}

exports.listByArticle = async (req, res, next) => {
    try {
        const articleId = Number(req.params.id);
        const { page, pageSize, offset } = parsePagination(req.query);
        const article = await Article.findByPk(articleId, {
            attributes: ['id', 'userId', 'status'],
        });

        if (!article || !canReadArticle(article, req.auth)) {
            return fail(res, 'Article not found', 404, ERROR_CODES.NOT_FOUND);
        }

        const { rows: roots, count } = await Comment.findAndCountAll({
            where: {
                articleId,
                parentCommentId: null,
            },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'nickname', 'avatarUrl'],
                },
            ],
            order: [['createdAt', 'DESC'], ['id', 'DESC']],
            offset,
            limit: pageSize,
        });

        const rootIds = roots.map((item) => item.id);
        const replies = rootIds.length
            ? await Comment.findAll({
                where: {
                    articleId,
                    parentCommentId: rootIds,
                },
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'username', 'nickname', 'avatarUrl'],
                    },
                    {
                        model: Comment,
                        as: 'parentComment',
                        attributes: ['id'],
                        include: [
                            {
                                model: User,
                                as: 'user',
                                attributes: ['id', 'username', 'nickname', 'avatarUrl'],
                            },
                        ],
                    },
                ],
                order: [['createdAt', 'ASC'], ['id', 'ASC']],
            })
            : [];

        const comments = [...roots, ...replies];

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

        const rootMap = new Map();
        roots.forEach((root) => {
            rootMap.set(root.id, toNode(root, likedSet));
        });

        replies.forEach((reply) => {
            const rootNode = rootMap.get(reply.parentCommentId);
            if (!rootNode) {
                return;
            }

            rootNode.replies.push(toNode(reply, likedSet));
        });

        return success(res, {
            list: roots.map((root) => rootMap.get(root.id)),
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
        let normalizedParentCommentId = null;

        if (parentCommentId) {
            const parent = await Comment.findByPk(Number(parentCommentId), {
                attributes: ['id', 'articleId', 'parentCommentId'],
            });

            if (!parent || Number(parent.articleId) !== articleId) {
                return fail(res, '父评论不存在', 400, ERROR_CODES.BAD_REQUEST);
            }

            normalizedParentCommentId = parent.parentCommentId || parent.id;
        }

        const created = await Comment.create({
            userId: req.auth.userId,
            articleId,
            parentCommentId: normalizedParentCommentId,
            content: cleanContent,
        });

        const withUser = await Comment.findByPk(created.id, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'nickname', 'avatarUrl'],
                },
                {
                    model: Comment,
                    as: 'parentComment',
                    attributes: ['id'],
                    include: [
                        {
                            model: User,
                            as: 'user',
                            attributes: ['id', 'username', 'nickname', 'avatarUrl'],
                        },
                    ],
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
