import DOMPurify from 'isomorphic-dompurify'

const RICH_TEXT_ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'em',
  'u',
  's',
  'ul',
  'ol',
  'li',
  'h2',
  'h3',
  'blockquote',
  'a',
]

export function sanitizeRichText(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: RICH_TEXT_ALLOWED_TAGS,
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  }).trim()
}

export function stripHtml(html?: string | null): string {
  if (!html) return ''
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] })
    .replace(/\s+/g, ' ')
    .trim()
}

export function hasRichTextContent(html?: string | null): boolean {
  return stripHtml(html).length > 0
}

export function richTextExcerpt(html?: string | null, maxLength = 160): string {
  const plain = stripHtml(html)
  if (!plain) return ''
  if (plain.length <= maxLength) return plain
  return `${plain.slice(0, maxLength).trimEnd()}…`
}
