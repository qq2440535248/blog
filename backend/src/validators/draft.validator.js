function isPositiveInt(value) {
    return Number.isInteger(value) && value > 0;
}

function validateDraftCreateOrUpdate(req) {
    const { title, excerpt, content, categoryId, tagIds } = req.body;

    if (title !== undefined && typeof title !== 'string') {
        return 'title 必须是字符串';
    }

    if (excerpt !== undefined && typeof excerpt !== 'string') {
        return 'excerpt 必须是字符串';
    }

    if (content !== undefined && typeof content !== 'string') {
        return 'content 必须是字符串';
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
    validateDraftCreateOrUpdate,
    validateIdParam,
};
