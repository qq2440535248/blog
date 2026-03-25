const assert = require('node:assert/strict');
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
        await ensureUnauthorized(baseUrl, '/articles/1/is-liked');

        console.log('authz smoke tests passed');
    } finally {
        server.close();
    }
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
