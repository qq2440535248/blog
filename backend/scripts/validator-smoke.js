const assert = require('node:assert/strict');

const authValidator = require('../src/validators/auth.validator');
const articleValidator = require('../src/validators/article.validator');
const draftValidator = require('../src/validators/draft.validator');
const userValidator = require('../src/validators/user.validator');

function req(body = {}, params = {}) {
    return { body, params };
}

function run() {
    assert.equal(authValidator.validateRegister(req({ username: 'abc', email: 'a@b.com', password: '123456' })), true);
    assert.notEqual(authValidator.validateRegister(req({ username: 'a', email: 'a@b.com', password: '123456' })), true);

    assert.equal(authValidator.validateLogin(req({ email: 'a@b.com', password: '123456' })), true);
    assert.notEqual(authValidator.validateLogin(req({ email: 'bad-email', password: '123456' })), true);

    assert.equal(userValidator.validateChangePassword(req({ oldPassword: '123456', newPassword: 'abcdef' })), true);
    assert.notEqual(userValidator.validateChangePassword(req({ oldPassword: '1', newPassword: '2' })), true);

    assert.equal(articleValidator.validateArticleCreate(req({ title: 't', content: 'c', tagIds: [1, 2] })), true);
    assert.notEqual(articleValidator.validateArticleCreate(req({ title: '', content: 'c' })), true);
    assert.equal(articleValidator.validateIdParam(req({}, { id: '3' })), true);
    assert.notEqual(articleValidator.validateIdParam(req({}, { id: '0' })), true);

    assert.equal(draftValidator.validateDraftCreateOrUpdate(req({ title: 'd', content: 'c', tagIds: [1] })), true);
    assert.notEqual(draftValidator.validateDraftCreateOrUpdate(req({ tagIds: ['x'] })), true);

    console.log('validator smoke tests passed');
}

run();
