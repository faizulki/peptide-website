// Articles are stored as HTML (written in the admin panel's rich-text
// editor), but ones entered before that editor existed can be plain text.
// Plain text is turned into paragraphs here so it still reads properly:
// every non-empty line becomes its own paragraph. Section titles are
// usually a line of their own directly above the text, so this keeps them
// separate and they can then be made into headings in the editor.

const HTML_TAG = /<\/?[a-z][a-z0-9]*[\s/>]/i;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function toArticleHtml(content: string | null | undefined): string {
  if (!content || !content.trim()) return '';
  if (HTML_TAG.test(content)) return content;
  return content
    .split(/\r\n?|\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join('');
}
