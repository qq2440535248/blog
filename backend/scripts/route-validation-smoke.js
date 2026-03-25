const assert = require('node:assert/strict');
const app = require('../src/app');
const { signAccessToken } = require('../src/utils/jwt');

async function run() {
    const server = app.listen(0);

    try {
        const port = server.address().port;
        const baseUrl = `http://127.0.0.1:${port}/api`;
        const token = signAccessToken(1);
        const authHeaders = {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        };

        const invalidArticleIdResp = await fetch(`${baseUrl}/articles/abc`, {
            headers: authHeaders,
        });
        assert.equal(invalidArticleIdResp.status, 400);
        const invalidArticleIdData = await invalidArticleIdResp.json();
        assert.equal(invalidArticleIdData.code, 'BAD_REQUEST');

        const emptyCategoryNameResp = await fetch(`${baseUrl}/categories`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ name: '' }),
        });
        assert.equal(emptyCategoryNameResp.status, 400);
        const emptyCategoryNameData = await emptyCategoryNameResp.json();
        assert.equal(emptyCategoryNameData.code, 'BAD_REQUEST');

        const invalidTagIdResp = await fetch(`${baseUrl}/tags/0`, {
            method: 'DELETE',
            headers: authHeaders,
        });
        assert.equal(invalidTagIdResp.status, 400);
        const invalidTagIdData = await invalidTagIdResp.json();
        assert.equal(invalidTagIdData.code, 'BAD_REQUEST');

        const invalidLikeIdResp = await fetch(`${baseUrl}/articles/xyz/like`, {
            method: 'POST',
            headers: authHeaders,
        });
        assert.equal(invalidLikeIdResp.status, 400);
        const invalidLikeIdData = await invalidLikeIdResp.json();
        assert.equal(invalidLikeIdData.code, 'BAD_REQUEST');

        console.log('route validation smoke tests passed');
    } finally {
        server.close();
    }
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
