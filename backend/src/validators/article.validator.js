function isPositiveInt(value) {
    return Number.isInteger(value) && value > 0;
}

function validateArticleCreate(req) {
    const { title, content, categoryId, tagIds } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return 'title 必填';
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return 'content 必填';
    }

    if (categoryId !== undefined && categoryId !== null && !isPositiveInt(Number(categoryId))) {
        return 'categoryId 必须是正整数';
    }

    if (tagIds !== undefined) {
        if (!Array.isArray(tagIds)) {
            return 'tagIds 必须是数组';
        }

        const allValid = tagIds.every((id) => isPositiveInt(Number(id)));
        if (!allValid) {
            return 'tagIds 元素必须是正整数';
        }
    }

    return true;
}

function validateArticleUpdate(req) {
    const { title, content, categoryId, tagIds } = req.body;

    if (title !== undefined && (typeof title !== 'string' || title.trim().length === 0)) {
        return 'title 不能为空';
    }

    if (content !== undefined && (typeof content !== 'string' || content.trim().length === 0)) {
        return 'content 不能为空';
    }

    if (categoryId !== undefined && categoryId !== null && !isPositiveInt(Number(categoryId))) {
        return 'categoryId 必须是正整数';
    }

    if (tagIds !== undefined) {
        if (!Array.isArray(tagIds)) {
            return 'tagIds 必须是数组';
        }

        const allValid = tagIds.every((id) => isPositiveInt(Number(id)));
        if (!allValid) {
            return 'tagIds 元素必须是正整数';
        }
    }

    return true;
}

function validateIdParam(req) {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        return 'id 参数必须是正整数';
    }

    return true;
}

module.exports = {
    validateArticleCreate,
    validateArticleUpdate,
    validateIdParam,
};
