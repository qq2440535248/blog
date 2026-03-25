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

    // 按需加载 markdown-it 与高亮库，避免首屏打包过重。
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

                return `<div class=\"code-block-wrap\"><div class=\"code-block-toolbar\"><span class=\"code-lang\">${languageLabel}</span><div class=\"code-actions\"><button type=\"button\" class=\"code-copy-btn\">复制</button></div></div><pre data-lang=\"${safeLang}\"><code class=\"hljs language-${safeLang}\">${highlighted}</code></pre></div>`;
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
        return () => { };
    }

    function findFromPath(event, selector) {
        // 优先使用 composedPath 兼容按钮内部节点点击。
        const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
        for (const item of path) {
            if (item instanceof Element && item.matches(selector)) {
                return item;
            }
        }

        const target = event.target;
        if (target instanceof Element) {
            return target.closest(selector);
        }

        return target?.parentElement ? target.parentElement.closest(selector) : null;
    }

    const handleClick = async (event) => {
        const button = findFromPath(event, '.code-copy-btn');
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
