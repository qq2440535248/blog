<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import request from "../../utils/request";
import { bindMarkdownCodeCopy, renderMarkdown } from "../../utils/markdown";
import message from "../../utils/message";
import { useCodeTheme } from "../../composables/useCodeTheme";
import { useAuthStore } from "../../stores/auth";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const loading = ref(false);
const article = ref(null);
const liked = ref(false);
const collected = ref(false);
const renderedContent = ref("");
const markdownContainerRef = ref();
const commentsLoading = ref(false);
const comments = ref([]);
const commentContent = ref("");
const replyContent = ref("");
const replyTargetId = ref(null);
const actionLoading = ref(false);
const expandedReplyMap = ref({});
const { codeTheme, toggleCodeTheme } = useCodeTheme();
let unbindCodeCopy = null;

const statusTextMap = {
  published: "已发布",
  draft: "草稿",
};

const wordCount = computed(() => {
  const text = (article.value?.content || "").replace(/\s+/g, "").trim();
  return text.length;
});

const readingMinutes = computed(() => {
  const count = wordCount.value;
  if (!count) {
    return 0;
  }

  return Math.max(1, Math.ceil(count / 450));
});

const canEdit = computed(() => {
  const profileId = Number(authStore.profile?.id || 0);
  const authorId = Number(
    article.value?.user?.id || article.value?.userId || 0,
  );
  return Boolean(profileId && authorId && profileId === authorId);
});

const updatedAtText = computed(() => {
  const value = article.value?.updatedAt || article.value?.createdAt;
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
});

async function refreshRenderedContent() {
  renderedContent.value = await renderMarkdown(article.value?.content || "");
}

async function fetchDetail() {
  try {
    loading.value = true;
    const { data } = await request.get(`/articles/${route.params.id}`);
    article.value = data.data;
  } catch (_err) {
    message.error("加载详情失败");
  } finally {
    loading.value = false;
  }
}

async function fetchLikeState() {
  try {
    const { data } = await request.get(`/articles/${route.params.id}/is-liked`);
    liked.value = Boolean(data.data.liked);
  } catch (_err) {
    liked.value = false;
  }
}

async function fetchCollectionState() {
  try {
    const { data } = await request.get(
      `/articles/${route.params.id}/is-collected`,
    );
    collected.value = Boolean(data.data.collected);
  } catch (_err) {
    collected.value = false;
  }
}

async function fetchComments() {
  try {
    commentsLoading.value = true;
    const { data } = await request.get(`/articles/${route.params.id}/comments`);
    comments.value = data.data.list || [];
  } catch (_err) {
    comments.value = [];
    message.error("加载评论失败");
  } finally {
    commentsLoading.value = false;
  }
}

function ensureLogin(actionName) {
  if (authStore.isAuthenticated) {
    return true;
  }

  message.info(`${actionName}需要先登录`);
  const redirect = encodeURIComponent(route.fullPath);
  router.push(`/login?redirect=${redirect}`);
  return false;
}

function formatCount(value) {
  const count = Math.max(Number(value || 0), 0);
  return count > 99 ? "99+" : String(count);
}

function getDisplayName(user) {
  if (!user) {
    return "匿名用户";
  }

  return user.nickname || user.username || "匿名用户";
}

function getVisibleReplies(comment) {
  const replies = comment?.replies || [];
  if (expandedReplyMap.value[comment.id]) {
    return replies;
  }

  return replies.slice(0, 3);
}

function getHiddenRepliesCount(comment) {
  const replies = comment?.replies || [];
  return Math.max(replies.length - 3, 0);
}

function toggleReplies(comment) {
  expandedReplyMap.value = {
    ...expandedReplyMap.value,
    [comment.id]: !expandedReplyMap.value[comment.id],
  };
}

function openReply(commentId) {
  if (!ensureLogin("回复评论")) {
    return;
  }

  replyTargetId.value = commentId;
  replyContent.value = "";
}

function closeReply() {
  replyTargetId.value = null;
  replyContent.value = "";
}

async function submitComment(parentCommentId = null) {
  if (!ensureLogin(parentCommentId ? "回复评论" : "发表评论")) {
    return;
  }

  const content = parentCommentId
    ? replyContent.value.trim()
    : commentContent.value.trim();
  if (!content) {
    message.warning("评论内容不能为空");
    return;
  }

  try {
    actionLoading.value = true;
    await request.post(`/articles/${route.params.id}/comments`, {
      content,
      parentCommentId,
    });

    if (parentCommentId) {
      closeReply();
    } else {
      commentContent.value = "";
    }

    await fetchComments();
    message.success(parentCommentId ? "回复成功" : "评论成功");
  } catch (error) {
    message.error(error?.response?.data?.message || "提交评论失败");
  } finally {
    actionLoading.value = false;
  }
}

async function toggleCommentLike(comment) {
  if (!ensureLogin("评论点赞")) {
    return;
  }

  try {
    actionLoading.value = true;
    if (comment.liked) {
      const { data } = await request.delete(`/comments/${comment.id}/like`);
      comment.liked = false;
      comment.likesCount = data.data.likesCount;
      return;
    }

    const { data } = await request.post(`/comments/${comment.id}/like`);
    comment.liked = true;
    comment.likesCount = data.data.likesCount;
  } catch (_err) {
    message.error("操作失败");
  } finally {
    actionLoading.value = false;
  }
}

async function toggleLike() {
  if (!ensureLogin("文章点赞")) {
    return;
  }

  try {
    if (liked.value) {
      const { data } = await request.delete(
        `/articles/${route.params.id}/like`,
      );
      liked.value = false;
      if (article.value) {
        article.value.likesCount = data.data.likesCount;
      }
      return;
    }

    const { data } = await request.post(`/articles/${route.params.id}/like`);
    liked.value = true;
    if (article.value) {
      article.value.likesCount = data.data.likesCount;
    }
  } catch (_err) {
    message.error("操作失败");
  }
}

async function toggleCollection() {
  if (!ensureLogin("文章收藏")) {
    return;
  }

  try {
    if (collected.value) {
      await request.delete(`/articles/${route.params.id}/collect`);
      collected.value = false;
      message.success("已取消收藏");
      return;
    }

    await request.post(`/articles/${route.params.id}/collect`);
    collected.value = true;
    message.success("收藏成功");
  } catch (_err) {
    message.error("操作失败");
  }
}

onMounted(async () => {
  await Promise.all([
    fetchDetail(),
    fetchLikeState(),
    fetchCollectionState(),
    fetchComments(),
  ]);
  await refreshRenderedContent();
  unbindCodeCopy = bindMarkdownCodeCopy(markdownContainerRef.value, message, {
    toggleCodeTheme,
  });
});

onUnmounted(() => {
  if (unbindCodeCopy) {
    unbindCodeCopy();
  }
});

watch(
  () => article.value?.content,
  async () => {
    await refreshRenderedContent();
  },
);

watch(
  () => markdownContainerRef.value,
  (el) => {
    if (!el) {
      return;
    }

    if (unbindCodeCopy) {
      unbindCodeCopy();
    }
    unbindCodeCopy = bindMarkdownCodeCopy(el, message, {
      toggleCodeTheme,
    });
  },
);
</script>

<template>
  <main class="detail-page page-block" v-loading="loading">
    <section class="container detail-grid">
      <article class="article-card">
        <p class="kicker">ARTICLE DETAIL</p>
        <h1>{{ article?.title || "未命名文章" }}</h1>
        <p class="excerpt">{{ article?.excerpt || "暂无摘要" }}</p>
        <div class="meta-row">
          <span
            >状态：{{
              statusTextMap[article?.status] || article?.status || "-"
            }}</span
          >
          <span>分类：{{ article?.category?.name || "未分类" }}</span>
          <span>作者：{{ getDisplayName(article?.user) }}</span>
          <span>字数：{{ wordCount }}</span>
          <span>阅读：约 {{ readingMinutes }} 分钟</span>
          <span>更新：{{ updatedAtText }}</span>
        </div>
        <div class="tag-row">
          <span class="tag-label">标签：</span>
          <el-tag
            v-for="tag in article?.tags || []"
            :key="tag.id"
            effect="plain"
          >
            {{ tag.name }}
          </el-tag>
          <span v-if="!article?.tags?.length" class="tag-empty">暂无标签</span>
        </div>
        <div
          ref="markdownContainerRef"
          class="markdown-body"
          :data-code-theme="codeTheme"
          v-html="renderedContent"
        />

        <section class="comment-section">
          <h3>评论区</h3>
          <el-input
            v-model="commentContent"
            type="textarea"
            :rows="3"
            maxlength="500"
            show-word-limit
            placeholder="写下你的评论，支持游客浏览，评论需登录"
          />
          <div class="comment-actions">
            <el-button
              type="primary"
              :loading="actionLoading"
              @click="submitComment(null)"
            >
              发表评论
            </el-button>
          </div>

          <div v-loading="commentsLoading" class="comment-list">
            <el-empty
              v-if="!comments.length"
              description="还没有评论，来做第一个发言者"
            />

            <article
              v-for="comment in comments"
              :key="comment.id"
              class="comment-item"
            >
              <header class="comment-head">
                <strong>{{ getDisplayName(comment.user) }}</strong>
                <span>{{ new Date(comment.createdAt).toLocaleString() }}</span>
              </header>
              <p class="comment-content">{{ comment.content }}</p>
              <div class="comment-ops">
                <button type="button" @click="toggleCommentLike(comment)">
                  {{ comment.liked ? "已赞" : "点赞" }} ({{
                    comment.likesCount || 0
                  }})
                </button>
                <button type="button" @click="openReply(comment.id)">
                  回复
                </button>
              </div>

              <div v-if="replyTargetId === comment.id" class="reply-editor">
                <el-input
                  v-model="replyContent"
                  type="textarea"
                  :rows="2"
                  maxlength="500"
                  show-word-limit
                  placeholder="回复这条评论"
                />
                <div class="reply-actions">
                  <el-button
                    size="small"
                    type="primary"
                    :loading="actionLoading"
                    @click="submitComment(comment.id)"
                  >
                    提交回复
                  </el-button>
                  <el-button size="small" @click="closeReply">取消</el-button>
                </div>
              </div>

              <div v-if="comment.replies?.length" class="reply-list">
                <article
                  v-for="reply in getVisibleReplies(comment)"
                  :key="reply.id"
                  class="reply-item"
                >
                  <header class="comment-head">
                    <strong>{{ getDisplayName(reply.user) }}</strong>
                    <span>{{
                      new Date(reply.createdAt).toLocaleString()
                    }}</span>
                  </header>
                  <p class="comment-content">{{ reply.content }}</p>
                  <div class="comment-ops">
                    <button type="button" @click="toggleCommentLike(reply)">
                      {{ reply.liked ? "已赞" : "点赞" }} ({{
                        reply.likesCount || 0
                      }})
                    </button>
                  </div>
                </article>

                <button
                  v-if="
                    getHiddenRepliesCount(comment) > 0 &&
                    !expandedReplyMap[comment.id]
                  "
                  type="button"
                  class="more-replies"
                  @click="toggleReplies(comment)"
                >
                  更多 {{ formatCount(getHiddenRepliesCount(comment)) }} 条回复
                </button>
                <button
                  v-if="
                    comment.replies.length > 3 && expandedReplyMap[comment.id]
                  "
                  type="button"
                  class="more-replies"
                  @click="toggleReplies(comment)"
                >
                  收起回复
                </button>
              </div>
            </article>
          </div>
        </section>
      </article>

      <aside class="side-card">
        <h3>互动</h3>
        <p>为这篇内容添加你的反馈。</p>
        <div class="side-actions">
          <el-button plain @click="router.push('/articles')"
            >返回列表</el-button
          >
          <el-button
            v-if="canEdit"
            type="success"
            plain
            @click="router.push(`/articles/${route.params.id}/edit`)"
          >
            编辑文章
          </el-button>
        </div>
        <el-button
          class="thumb-btn"
          :class="{ liked }"
          plain
          @click="toggleLike"
        >
          <span class="thumb-icon">👍</span>
          <span>{{ liked ? "已点赞" : "点赞文章" }}</span>
        </el-button>
        <el-button
          class="collect-btn"
          :class="{ active: collected }"
          plain
          @click="toggleCollection"
        >
          <span>{{ collected ? "★ 已收藏" : "☆ 收藏文章" }}</span>
        </el-button>
        <p class="like-count">当前点赞：{{ article?.likesCount || 0 }}</p>
      </aside>
    </section>
  </main>
</template>

<style scoped>
.detail-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: minmax(0, 1fr) 260px;
}

.article-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.94);
  box-shadow: var(--shadow-md);
  padding: clamp(18px, 4vw, 34px);
}

.kicker {
  margin: 0;
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.16em;
}

h1 {
  margin: 10px 0;
  font-size: clamp(28px, 4vw, 42px);
  line-height: 1.15;
}

.excerpt {
  margin: 0;
  color: var(--color-text-secondary);
  line-height: 1.8;
}

.meta-row {
  margin-top: 14px;
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
  color: var(--color-text-secondary);
  font-size: 14px;
}

.markdown-body {
  margin-top: 20px;
  border-top: 1px solid var(--color-border);
  padding-top: 20px;
}

.tag-row {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.tag-label {
  color: var(--color-text-secondary);
  font-size: 14px;
}

.tag-empty {
  color: var(--color-text-secondary);
  font-size: 14px;
}

.comment-section {
  margin-top: 24px;
  border-top: 1px solid var(--color-border);
  padding-top: 18px;
}

.comment-section h3 {
  margin: 0 0 12px;
}

.comment-actions {
  margin-top: 10px;
}

.comment-list {
  margin-top: 14px;
  display: grid;
  gap: 12px;
}

.comment-item,
.reply-item {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: #f9fbff;
  padding: 10px;
}

.reply-list {
  margin-top: 10px;
  display: grid;
  gap: 8px;
}

.reply-item {
  margin-left: 14px;
  background: #ffffff;
}

.comment-head {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  color: var(--color-text-secondary);
  font-size: 12px;
}

.comment-head strong {
  color: var(--color-text);
  font-size: 14px;
}

.comment-content {
  margin: 8px 0;
  color: var(--color-text);
  line-height: 1.7;
  white-space: pre-wrap;
}

.comment-ops {
  display: flex;
  gap: 12px;
}

.comment-ops button,
.more-replies {
  border: 0;
  background: transparent;
  color: var(--color-primary);
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}

.reply-editor {
  margin-top: 10px;
}

.reply-actions {
  margin-top: 8px;
  display: flex;
  gap: 8px;
}

.side-card {
  position: sticky;
  top: 18px;
  align-self: flex-start;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: var(--shadow-sm);
  padding: 16px;
}

.side-card h3 {
  margin: 0;
}

.side-card p {
  margin: 8px 0 12px;
  color: var(--color-text-secondary);
}

.side-actions {
  display: grid;
  gap: 8px;
  margin-bottom: 12px;
}

.side-actions .el-button {
  width: 100%;
}

.side-actions .el-button + .el-button {
  margin-left: 0;
}

.thumb-btn {
  width: 100%;
  margin-top: 2px;
  display: inline-flex;
  justify-content: center;
  gap: 8px;
  border-color: #a3c5ff;
  color: #2c6ae7;
  background: #f2f7ff;
}

.thumb-btn.liked {
  border-color: #85aaf2;
  background: #dfeafe;
  color: #1b4fbe;
}

.collect-btn {
  width: 100%;
  margin-top: 8px;
  border-color: #ffd89c;
  color: #b87911;
  background: #fff8e8;
}

.collect-btn.active {
  border-color: #f3bb58;
  color: #9e6308;
  background: #ffefcc;
}

.thumb-icon {
  font-size: 16px;
  line-height: 1;
}

.like-count {
  margin-top: 12px;
  font-weight: 600;
  color: var(--color-text);
}

@media (max-width: 980px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .side-card {
    position: static;
  }
}
</style>
