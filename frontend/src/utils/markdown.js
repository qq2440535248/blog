let markdownPromise = null;

async function getMarkdownInstance() {
    if (markdownPromise) {
        return markdownPromise;
    }

    markdownPromise = Promise.all([
        import('markdown-it'),
        import('highlight.js'),
        import('highlight.js/styles/github.css'),
    ]).then(([markdownItModule, hljsModule]) => {
        const MarkdownIt = markdownItModule.default;
        const hljs = hljsModule.default;

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

        return markdown;
    });

    return markdownPromise;
}

export async function renderMarkdown(content) {
    const markdown = await getMarkdownInstance();
    return markdown.render(content || '');
}
