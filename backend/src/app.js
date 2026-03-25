const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const categoryRoutes = require('./routes/category.routes');
const tagRoutes = require('./routes/tag.routes');
const articleRoutes = require('./routes/article.routes');
const likeRoutes = require('./routes/like.routes');
const draftRoutes = require('./routes/draft.routes');
const errorMiddleware = require('./middlewares/error.middleware');
const { fail, ERROR_CODES } = require('./utils/http');

const app = express();

app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 120,
});

const authLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
});

app.use('/api', apiLimiter);

app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'person-blog-backend' });
});

app.use('/api/auth', authLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api', likeRoutes);
app.use('/api/drafts', draftRoutes);

app.use((_req, res) => {
    return fail(res, 'Route not found', 404, ERROR_CODES.NOT_FOUND);
});

app.use(errorMiddleware);

module.exports = app;
