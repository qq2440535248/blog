const path = require('path');
// 固定从 backend/.env 读取配置，避免从仓库根目录启动时丢失环境变量。
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const app = require('./app');
const { initDatabase } = require('./models');

const port = Number(process.env.PORT || 3000);

async function bootstrap() {
    try {
        // 先保证数据库连通与表结构同步，再对外提供服务。
        await initDatabase();

        app.listen(port, () => {
            // eslint-disable-next-line no-console
            console.log(`Server running on http://localhost:${port}`);
        });
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to start server:', error.message);
        process.exit(1);
    }
}

bootstrap();
