function validateNameBody(req) {
    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return 'name 必填';
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
    validateNameBody,
    validateIdParam,
};
