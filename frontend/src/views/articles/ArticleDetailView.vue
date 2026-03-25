<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import request from "../../utils/request";
import { bindMarkdownCodeCopy, renderMarkdown } from "../../utils/markdown";
import message from "../../utils/message";
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
const commentPagination = ref({ page: 1, pageSize: 10, total: 0 });
const commentContent = ref("");
const replyContent = ref("");
const replyTargetRootId = ref(null);
const replyTargetComment = ref(null);
const actionLoading = ref(false);
const takedownLoading = ref(false);
const moveDraftLoading = ref(false);
const expandedReplyMap = ref({});
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

const canModerate = computed(() => {
  return authStore.profile?.role === "admin";
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
    const { data } = await request.get(
      `/articles/${route.params.id}/comments`,
      {
        params: {
          page: commentPagination.value.page,
          pageSize: commentPagination.value.pageSize,
        },
      },
    );
    comments.value = data.data.list || [];
    commentPagination.value.total = data.data.pagination?.total || 0;
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

function getReplyTargetName(reply) {
  return getDisplayName(reply?.replyToUser);
}

function getReplyPlaceholder() {
  if (!replyTargetComment.value) {
    return "回复这条评论";
  }

  return `回复 ${getDisplayName(replyTargetComment.value.user)}`;
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

function openReply(targetComment, rootComment) {
  if (!ensureLogin("回复评论")) {
    return;
  }

  replyTargetRootId.value = rootComment?.id || targetComment?.id || null;
  replyTargetComment.value = targetComment || null;
  replyContent.value = "";
}

function closeReply() {
  replyTargetRootId.value = null;
  replyTargetComment.value = null;
  replyContent.value = "";
}

async function submitComment(mode = "comment") {
  const isReply = mode === "reply";
  if (!ensureLogin(isReply ? "回复评论" : "发表评论")) {
    return;
  }

  const content = isReply
    ? replyContent.value.trim()
    : commentContent.value.trim();
  if (!content) {
    message.warning("评论内容不能为空");
    return;
  }

  try {
    actionLoading.value = true;
    const parentCommentId = isReply ? replyTargetComment.value?.id : null;
    await request.post(`/articles/${route.params.id}/comments`, {
      content,
      parentCommentId,
    });

    if (isReply) {
      closeReply();
    } else {
      commentContent.value = "";
      commentPagination.value.page = 1;
    }

    await fetchComments();
    message.success(isReply ? "回复成功" : "评论成功");
  } catch (error) {
    message.error(error?.response?.data?.message || "提交评论失败");
  } finally {
    actionLoading.value = false;
  }
}

function changeCommentPage(page) {
  commentPagination.value.page = page;
  fetchComments();
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
      const { data } = await request.delete(
        `/articles/${route.params.id}/collect`,
      );
      collected.value = false;
      if (article.value) {
        article.value.collectionsCount = data.data.collectionsCount;
      }
      message.success("已取消收藏");
      return;
    }

    const { data } = await request.post(`/articles/${route.params.id}/collect`);
    collected.value = true;
    if (article.value) {
      article.value.collectionsCount = data.data.collectionsCount;
    }
    message.success("收藏成功");
  } catch (_err) {
    message.error("操作失败");
  }
}

async function adminTakedown() {
  if (!ensureLogin("下架文章")) {
    return;
  }

  if (!canModerate.value) {
    message.error("仅管理员可以下架文章");
    return;
  }

  // 与治理台保持一致，优先保证操作有可见反馈。
  const confirmed = window.confirm("确认将这篇文章下架为草稿状态吗？");
  if (!confirmed) {
    return;
  }

  const reasonInput = window.prompt("可选：填写下架原因（最多 200 字）", "");
  if (reasonInput === null) {
    return;
  }

  const reason = String(reasonInput || "")
    .trim()
    .slice(0, 200);

  try {
    takedownLoading.value = true;
    message.info("正在下架文章...");
    await request.patch(`/articles/${route.params.id}/takedown`, { reason });
    message.success("下架成功");
    router.replace("/");
  } catch (error) {
    message.error(error?.response?.data?.message || "下架失败");
  } finally {
    takedownLoading.value = false;
  }
}

async function moveArticleToDraft() {
  if (!ensureLogin("下架到草稿箱")) {
    return;
  }

  if (!canEdit.value) {
    message.error("仅作者本人可执行此操作");
    return;
  }

  const confirmed = window.confirm("确认将这篇文章下架并移入草稿箱吗？");
  if (!confirmed) {
    return;
  }

  try {
    moveDraftLoading.value = true;
    await request.patch(`/articles/${route.params.id}/move-to-draft`);
    message.success("已下架并移入草稿箱，可在草稿箱继续发布");
    router.replace("/drafts");
  } catch (error) {
    message.error(error?.response?.data?.message || "下架到草稿箱失败");
  } finally {
    moveDraftLoading.value = false;
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
  unbindCodeCopy = bindMarkdownCodeCopy(markdownContainerRef.value, message);
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
    unbindCodeCopy = bindMarkdownCodeCopy(el, message);
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
          v-html="renderedContent"
        />

        <section class="comment-section">
          <h3>评论区</h3>

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
                <button type="button" @click="openReply(comment, comment)">
                  回复
                </button>
              </div>

              <div v-if="replyTargetRootId === comment.id" class="reply-editor">
                <el-input
                  v-model="replyContent"
                  type="textarea"
                  :rows="2"
                  maxlength="500"
                  show-word-limit
                  :placeholder="getReplyPlaceholder()"
                />
                <div class="reply-actions">
                  <el-button
                    size="small"
                    type="primary"
                    :loading="actionLoading"
                    @click="submitComment('reply')"
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
                  <p class="reply-to-name">
                    {{ getDisplayName(reply.user) }} 回复
                    {{ getReplyTargetName(reply) }}
                  </p>
                  <p class="comment-content">{{ reply.content }}</p>
                  <div class="comment-ops">
                    <button type="button" @click="toggleCommentLike(reply)">
                      {{ reply.liked ? "已赞" : "点赞" }} ({{
                        reply.likesCount || 0
                      }})
                    </button>
                    <button type="button" @click="openReply(reply, comment)">
                      回复
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

          <div class="comment-pager">
            <el-pagination
              v-model:current-page="commentPagination.page"
              :page-size="commentPagination.pageSize"
              :total="commentPagination.total"
              layout="prev, pager, next"
              @current-change="changeCommentPage"
            />
          </div>

          <div class="comment-input-wrap">
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
                @click="submitComment('comment')"
              >
                发表评论
              </el-button>
            </div>
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
          <el-button
            v-if="canEdit && article?.status === 'published'"
            type="warning"
            plain
            :loading="moveDraftLoading"
            @click="moveArticleToDraft"
          >
            下架到草稿箱
          </el-button>
          <el-button
            v-if="canModerate && article?.status === 'published'"
            type="warning"
            plain
            :loading="takedownLoading"
            @click="adminTakedown"
          >
            下架文章
          </el-button>
        </div>
        <el-button
          class="thumb-btn"
          :class="{ liked }"
          plain
          @click="toggleLike"
        >
          <span class="action-content">
            <span class="action-icon">👍</span>
            <span
              >{{ liked ? "已点赞" : "点赞文章" }}
              {{ article?.likesCount || 0 }}</span
            >
          </span>
        </el-button>
        <el-button
          class="collect-btn"
          :class="{ active: collected }"
          plain
          @click="toggleCollection"
        >
          <span class="action-content">
            <span class="action-icon">{{ collected ? "★" : "☆" }}</span>
            <span
              >{{ collected ? "已收藏" : "收藏文章" }}
              {{ article?.collectionsCount || 0 }}</span
            >
          </span>
        </el-button>
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

.comment-input-wrap {
  margin-top: 14px;
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

.reply-to-name {
  margin: 6px 0 0;
  color: var(--color-text-secondary);
  font-size: 13px;
}

.comment-pager {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
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
  display: inline-flex;
  justify-content: center;
  margin-left: 0;
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

.action-content {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.action-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.2em;
  font-size: 16px;
  line-height: 1;
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
