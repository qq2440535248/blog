let markdownPromise = null;

function getLanguageLabel(lang) {
    if (!lang) {
        return 'TEXT';
    }

    return String(lang).toUpperCase();
}

async function getMarkdownInstance() {
    if (markdownPromise) {
        return markdownPromise;
    }

    markdownPromise = Promise.all([
        import('markdown-it'),
        import('highlight.js'),
    ]).then(([markdownItModule, hljsModule]) => {
        const MarkdownIt = markdownItModule.default;
        const hljs = hljsModule.default;

        const markdown = new MarkdownIt({
            html: false,
            linkify: true,
            highlight(str, lang) {
                const escaped = markdown.utils.escapeHtml(str);
                const safeLang = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
                const languageLabel = getLanguageLabel(safeLang);

                let highlighted = escaped;
                if (lang && hljs.getLanguage(lang)) {
                    try {
                        highlighted = hljs.highlight(str, { language: lang }).value;
                    } catch (_err) {
                        highlighted = escaped;
                    }
                }

                return `<div class=\"code-block-wrap\"><div class=\"code-block-toolbar\"><span class=\"code-lang\">${languageLabel}</span><button type=\"button\" class=\"code-copy-btn\">复制</button></div><pre data-lang=\"${safeLang}\"><code class=\"hljs language-${safeLang}\">${highlighted}</code></pre></div>`;
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

export function bindMarkdownCodeCopy(container, message) {
    if (!container) {
        return () => {};
    }

    const handleClick = async (event) => {
        const button = event.target.closest('.code-copy-btn');
        if (!button) {
            return;
        }

        const wrap = button.closest('.code-block-wrap');
        const codeEl = wrap?.querySelector('pre code');
        const text = codeEl?.innerText;
        if (!text) {
            return;
        }

        try {
            await navigator.clipboard.writeText(text);
            button.textContent = '已复制';
            message?.success?.('代码已复制');
            setTimeout(() => {
                button.textContent = '复制';
            }, 1200);
        } catch (_err) {
            message?.error?.('复制失败，请手动复制');
        }
    };

    container.addEventListener('click', handleClick);
    return () => {
        container.removeEventListener('click', handleClick);
    };
}
