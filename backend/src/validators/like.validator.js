function validateArticleIdParam(req) {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        return 'id 参数必须是正整数';
    }

    return true;
}

module.exports = {
    validateArticleIdParam,
};
