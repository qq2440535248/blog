const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const app = require('../src/app');

async function ensureUnauthorized(baseUrl, path, method = 'GET') {
    const resp = await fetch(`${baseUrl}${path}`, { method });
    assert.equal(resp.status, 401, `${path} should return 401`);
    const data = await resp.json();
    assert.equal(data.code, 'UNAUTHORIZED', `${path} should return UNAUTHORIZED code`);
}

async function run() {
    const server = app.listen(0);

    try {
        const port = server.address().port;
        const baseUrl = `http://127.0.0.1:${port}/api`;

        await ensureUnauthorized(baseUrl, '/users/me');
        await ensureUnauthorized(baseUrl, '/articles');
        await ensureUnauthorized(baseUrl, '/drafts');
        const likedResp = await fetch(`${baseUrl}/articles/1/is-liked`);
        assert.ok([200, 404].includes(likedResp.status), '/articles/:id/is-liked should be readable for guest');

        const accessSecret = process.env.JWT_ACCESS_SECRET || 'change_me_access_secret';
        const badTypeToken = jwt.sign({ sub: 1, type: 'refresh' }, accessSecret, { expiresIn: '15m' });
        const badTypeResp = await fetch(`${baseUrl}/users/me`, {
            headers: { Authorization: `Bearer ${badTypeToken}` },
        });
        assert.equal(badTypeResp.status, 401);
        const badTypeData = await badTypeResp.json();
        assert.equal(badTypeData.code, 'UNAUTHORIZED');

        const badSubToken = jwt.sign({ sub: 'NaN', type: 'access' }, accessSecret, { expiresIn: '15m' });
        const badSubResp = await fetch(`${baseUrl}/users/me`, {
            headers: { Authorization: `Bearer ${badSubToken}` },
        });
        assert.equal(badSubResp.status, 401);
        const badSubData = await badSubResp.json();
        assert.equal(badSubData.code, 'UNAUTHORIZED');

        console.log('authz smoke tests passed');
    } finally {
        server.close();
    }
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
