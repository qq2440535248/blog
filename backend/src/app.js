const express = require('express');
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

const app = express();

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));

const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 120,
});

app.use('/api', apiLimiter);

app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'person-blog-backend' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api', likeRoutes);
app.use('/api/drafts', draftRoutes);

app.use(errorMiddleware);

module.exports = app;
