import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  highlight(str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre><code class=\"hljs\">${hljs.highlight(str, { language: lang }).value}</code></pre>`;
      } catch (_err) {
        return `<pre><code class=\"hljs\">${markdown.utils.escapeHtml(str)}</code></pre>`;
      }
    }

    return `<pre><code class=\"hljs\">${markdown.utils.escapeHtml(str)}</code></pre>`;
  },
});

export function renderMarkdown(content) {
  return markdown.render(content || '');
}
