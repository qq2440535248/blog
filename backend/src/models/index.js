const sequelize = require('../config/database');
const User = require('./user.model');
const RefreshToken = require('./refresh-token.model');
const Category = require('./category.model');
const Tag = require('./tag.model');
const Article = require('./article.model');
const ArticleTag = require('./article-tag.model');
const Like = require('./like.model');
const Draft = require('./draft.model');
const Comment = require('./comment.model');
const CommentLike = require('./comment-like.model');

User.hasMany(RefreshToken, { foreignKey: 'userId', as: 'refreshTokens' });
RefreshToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Category, { foreignKey: 'userId', as: 'categories' });
Category.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Tag, { foreignKey: 'userId', as: 'tags' });
Tag.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Article, { foreignKey: 'userId', as: 'articles' });
Article.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Category.hasMany(Article, { foreignKey: 'categoryId', as: 'articles' });
Article.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

Article.belongsToMany(Tag, {
    through: ArticleTag,
    foreignKey: 'articleId',
    otherKey: 'tagId',
    as: 'tags',
});
Tag.belongsToMany(Article, {
    through: ArticleTag,
    foreignKey: 'tagId',
    otherKey: 'articleId',
    as: 'articles',
});

User.hasMany(Like, { foreignKey: 'userId', as: 'likes' });
Like.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Article.hasMany(Like, { foreignKey: 'articleId', as: 'likes' });
Like.belongsTo(Article, { foreignKey: 'articleId', as: 'article' });

User.hasMany(Draft, { foreignKey: 'userId', as: 'drafts' });
Draft.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Category.hasMany(Draft, { foreignKey: 'categoryId', as: 'drafts' });
Draft.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });
Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Article.hasMany(Comment, { foreignKey: 'articleId', as: 'comments' });
Comment.belongsTo(Article, { foreignKey: 'articleId', as: 'article' });

Comment.hasMany(Comment, { foreignKey: 'parentCommentId', as: 'replies' });
Comment.belongsTo(Comment, { foreignKey: 'parentCommentId', as: 'parentComment' });

User.hasMany(CommentLike, { foreignKey: 'userId', as: 'commentLikes' });
CommentLike.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Comment.hasMany(CommentLike, { foreignKey: 'commentId', as: 'likes' });
CommentLike.belongsTo(Comment, { foreignKey: 'commentId', as: 'comment' });

async function initDatabase() {
    await sequelize.authenticate();
    await sequelize.sync();
}

module.exports = {
    sequelize,
    User,
    RefreshToken,
    Category,
    Tag,
    Article,
    ArticleTag,
    Like,
    Draft,
    Comment,
    CommentLike,
    initDatabase,
};
