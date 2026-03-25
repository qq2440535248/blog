const assert = require('node:assert/strict');
const app = require('../src/app');

async function run() {
    const server = app.listen(0);

    try {
        const port = server.address().port;
        const baseUrl = `http://127.0.0.1:${port}/api`;

        const healthResp = await fetch(`${baseUrl}/health`);
        assert.equal(healthResp.status, 200);
        const healthData = await healthResp.json();
        assert.equal(healthData.ok, true);

        const notFoundResp = await fetch(`${baseUrl}/__not_found__`);
        assert.equal(notFoundResp.status, 404);
        const notFoundData = await notFoundResp.json();
        assert.equal(notFoundData.code, 'NOT_FOUND');

        const badRegisterResp = await fetch(`${baseUrl}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'ab', email: 'bad', password: '1' }),
        });
        assert.equal(badRegisterResp.status, 400);
        const badRegisterData = await badRegisterResp.json();
        assert.equal(badRegisterData.code, 'BAD_REQUEST');

        console.log('api smoke tests passed');
    } finally {
        server.close();
    }
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
