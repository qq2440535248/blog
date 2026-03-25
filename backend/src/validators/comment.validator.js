function isPositiveInt(value) {
    return Number.isInteger(value) && value > 0;
}

function validateArticleIdParam(req) {
    const id = Number(req.params.id);
    if (!isPositiveInt(id)) {
        return '文章 id 参数必须是正整数';
    }

    return true;
}

function validateCommentIdParam(req) {
    const id = Number(req.params.id);
    if (!isPositiveInt(id)) {
        return '评论 id 参数必须是正整数';
    }

    return true;
}

function validateCommentCreate(req) {
    const { content, parentCommentId } = req.body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return '评论内容不能为空';
    }

    if (content.trim().length > 500) {
        return '评论内容不能超过 500 字';
    }

    if (parentCommentId !== undefined && parentCommentId !== null && !isPositiveInt(Number(parentCommentId))) {
        return 'parentCommentId 必须是正整数';
    }

    return true;
}

module.exports = {
    validateArticleIdParam,
    validateCommentIdParam,
    validateCommentCreate,
};
